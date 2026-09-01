/** @vitest-environment jsdom */
import { createHash } from 'node:crypto';
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION, type Scenario } from '@anesthesia/engine';
import type { PatientState } from '@anesthesia/physiology';
import { MODEL_SET_REVISION } from '@anesthesia/pharmacology/registry';
import { WORKER_PROTOCOL_VERSION, assertProtocolVersion,
  type FromWorkerMessage, type ToWorkerMessage, type LearnerAction } from '@platform/kernel/protocol';
import { useSession, sessionInternals } from '@platform/session/session-store';
import { RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypermagnesemia-antagonism-and-removal';
import { RENAL_HYPERMAGNESEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypermagnesemia-fixtures';
import { RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS as CALCIUM,
  RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS as REMOVAL,
  RENAL_HYPERMAGNESEMIA_SESSION_TICKS as SESSION,
  type RenalHypermagnesemiaAction } from '../../src/modules/renal-electrolyte/hypermagnesemia';
import { useRenalHypermagnesemiaDemonstration } from '../../src/modules/renal-electrolyte/demo/useRenalHypermagnesemiaDemonstration';
import { ScenarioProblemReport } from '@platform/reporting/ScenarioProblemReport';

// The real modal opens without contacting an external report service in this local test.
vi.mock('@platform/reporting/client', () => ({
  reportConfig: vi.fn(async () => { throw new Error('Offline test host'); }),
  loadTurnstile: vi.fn(), renderTurnstile: vi.fn(), submitScenarioReport: vi.fn(),
}));

/** Only transport is in-process. Session store, clock, recorder, protocol, and the complete solver are real. */
class InProcessWorker implements Partial<Worker> {
  onmessage: ((event: MessageEvent<FromWorkerMessage<PatientState>>) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  private engine: AnesthesiaEngine | null = null;
  readonly applied: LearnerAction[] = [];
  readonly trace = createHash('sha256');
  frames = 0;
  terminated = false;

  postMessage(message: ToWorkerMessage): void {
    expect(this.terminated).toBe(false); assertProtocolVersion(message);
    if (message.type === 'init') {
      this.engine = new AnesthesiaEngine({ scenario: message.scenario as Scenario,
        seed: message.seed, practiceRegion: message.practiceRegion });
      this.ready(); return;
    }
    if (message.type === 'action') {
      this.applied.push(structuredClone(message.action)); this.engine!.apply(message.action); return;
    }
    if (message.type !== 'advance') throw new Error(`Unexpected test transport message: ${message.type}`);
    const signals = ['ecg', 'arterial', 'capno', 'pleth'] as const;
    const collected: Record<(typeof signals)[number], number[]> = { ecg: [], arterial: [], capno: [], pleth: [] };
    let last = this.engine!.step(); const events = [...last.events]; const warnings = [...last.warnings];
    const capture = () => {
      // Include every equipment field, event, warning, and waveform sample, not only final vital signs.
      this.trace.update(JSON.stringify(last)); this.frames += 1;
      for (const signal of signals) collected[signal].push(...last.waveforms[signal].samples);
    };
    capture();
    for (let tick = 1; tick < message.ticks; tick += 1) {
      last = this.engine!.step(); events.push(...last.events); warnings.push(...last.warnings); capture();
    }
    this.emit({ v: WORKER_PROTOCOL_VERSION, type: 'state', tick: last.tick, state: last.state,
      concentrations: last.concentrations, attribution: last.attribution, equipment: last.equipment, events, warnings,
      alarms: last.alarms.map((alarm) => ({ alarmId: alarm.id, priority: alarm.priority, parameter: alarm.parameter,
        value: alarm.value, unit: alarm.unit, message: alarm.message, sinceTick: alarm.sinceTick, silencedUntilTick: alarm.silencedUntilTick })),
      waveforms: signals.map((signal) => ({ signal, sampleRateHz: last.waveforms[signal].sampleRateHz,
        startSeconds: last.waveforms[signal].startSeconds, samples: new Float32Array(collected[signal]) })),
    });
  }
  ready() { this.emit({ v: WORKER_PROTOCOL_VERSION, type: 'ready', engineVersion: ENGINE_VERSION, modelSetRevision: MODEL_SET_REVISION }); }
  terminate() { this.terminated = true; }
  private emit(message: FromWorkerMessage<PatientState>) {
    this.onmessage?.({ data: structuredClone(message) } as MessageEvent<FromWorkerMessage<PatientState>>);
  }
}

describe('RenalHypermagnesemia worked example through the real session pipeline', () => {
  let root: Root; let container: HTMLDivElement; let mounted: boolean;
  let workers: InProcessWorker[]; let advance: (() => void) | undefined; let finishes: number;
  const session = () => useSession.getState();
  const patient = () => session().equipment?.resuscitation.renalHypermagnesemia;
  const worker = () => workers.at(-1)!;
  const recorded = () => sessionInternals().recorder!.build('pending').actions;
  function Harness({ active }: { active: boolean }) {
    const state = useSession();
    const demo = useRenalHypermagnesemiaDemonstration({ active, running: state.transport === 'running',
      patient: state.equipment?.resuscitation.renalHypermagnesemia, act: state.act,
      pause: state.pause, play: state.play, onFinished: () => { finishes += 1; } });
    advance = demo.onAdvance;
    // This tests the modal and real session, not AnesthesiaRoute's separate close/resume policy.
    return <ScenarioProblemReport context={{
      scenarioId: SCENARIO.metadata.id, contentVersion: SCENARIO.metadata.version,
      appVersion: 'test', engineVersion: ENGINE_VERSION, moduleId: 'renal-electrolyte',
      maturity: 'preview', practiceRegion: 'US', fidelityClass: 'state_transition',
      surface: 'live', simulatedTick: state.tick,
      canonicalUrl: 'https://opensimlab.com/renal-electrolyte/scenario/hypermagnesemia-antagonism-and-removal',
    }} onOpen={state.pause} />;
  }
  const render = (active = true) => act(() => root.render(<StrictMode><Harness active={active} /></StrictMode>));
  const button = (label: string) => Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.trim() === label)!;
  const frames = (count = 6) => act(() => { for (let i = 0; i < count; i += 1) session().frame(1000 / 60); });
  function begin(active = true) {
    act(() => {
      session().begin({ scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version,
        contentVersion: SCENARIO.metadata.version, modelSetRevision: MODEL_SET_REVISION, engineVersion: ENGINE_VERSION,
        practiceRegion: 'US', seed: FIXTURES.seed, scenario: SCENARIO },
      () => { const next = new InProcessWorker(); workers.push(next); return next as unknown as Worker; },
      { engine: ENGINE_VERSION, content: SCENARIO.metadata.version, modelSet: MODEL_SET_REVISION,
        scenario: SCENARIO.metadata.version }, 'renal-electrolyte');
      session().setSpeed(60); session().play();
    });
    render(active); frames();
  }
  function readWithoutAdvancing() {
    const before = { tick: session().tick, state: session().state, equipment: session().equipment,
      actions: recorded(), frames: worker().frames };
    expect(session().transport).toBe('paused');
    act(() => { for (let i = 0; i < 60; i += 1) session().frame(i % 2 ? 1000 / 60 : 1000); });
    expect({ tick: session().tick, state: session().state, equipment: session().equipment,
      actions: recorded(), frames: worker().frames }).toEqual(before);
  }
  function confirmDecision() {
    expect(advance).toBeTypeOf('function'); readWithoutAdvancing();
    const count = recorded().length; const before = session().equipment; const callback = advance!;
    act(() => { callback(); callback(); });
    expect(recorded()).toHaveLength(count + 1); expect(worker().applied).toHaveLength(count + 1);
    expect(session().equipment).toEqual(before); expect(session().transport).toBe('running');
    render(); act(() => callback()); expect(recorded()).toHaveLength(count + 1);
  }
  function replayWholeTrace() {
    const actions = recorded(); const replay = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    const hash = createHash('sha256'); let next = 0; let last;
    expect(actions).toEqual(worker().applied); expect(worker().frames).toBe(session().tick);
    for (let tick = 0; tick < session().tick; tick += 1) {
      while (actions[next]?.tick === tick) replay.apply(actions[next++]!);
      last = replay.step(); hash.update(JSON.stringify(last));
    }
    expect(next).toBe(actions.length);
    expect(hash.digest('hex')).toBe(worker().trace.copy().digest('hex'));
    expect(last!.state).toEqual(session().state); expect(last!.equipment).toEqual(session().equipment);
  }
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    mounted = true; workers = []; advance = undefined; finishes = 0;
  });
  afterEach(() => {
    if (mounted) act(() => root.unmount());
    act(() => session().end()); sessionInternals().client?.terminate(); container.remove();
  });
  it('records twelve confirmations with fresh recurrence review before repeat calcium and replays every engine frame', () => {
    begin(); const pausedWaits = new Set<string>();
    for (let batch = 0; batch < 1000 && !patient()?.ended; batch++) {
      if (advance) confirmDecision();
      const current = patient();
      const wait = current?.monitoringAtTick !== null && current?.calciumDueInSeconds !== null
        ? current?.calciumRequests === 1 ? current.calciumResponseObserved ? 'expiry' : 'early' : 'removal' : null;
      if (wait && !pausedWaits.has(wait)) {
        pausedWaits.add(wait); expect(advance).toBeUndefined();
        act(() => session().pause()); readWithoutAdvancing();
        act(() => worker().ready()); expect(session().phase).toBe('running'); expect(session().transport).toBe('paused');
        act(() => session().play());
      }
      frames();
    }
    expect(finishes).toBe(1); expect(pausedWaits).toEqual(new Set(['early', 'expiry', 'removal']));
    expect(recorded().map((action) => action.payload.action)).toEqual([
      'support-breathing', 'calcium', 'deliver-removal', 'stop-magnesium', 'call-support', 'review-context', 'monitor',
      'reassess', 'reassess', 'calcium', 'reassess', 'handoff',
    ]);
    expect(recorded().every((action) => action.type === 'renal-hypermagnesemia-response')).toBe(true);
    const calcium = recorded().filter((action) => action.payload.action === 'calcium');
    const removal = recorded().find((action) => action.payload.action === 'deliver-removal')!;
    const assessments = recorded().filter((action) => action.payload.action === 'reassess');
    expect(assessments[0]!.tick - calcium[0]!.tick).toBeGreaterThanOrEqual(CALCIUM / 6);
    expect(assessments[1]!.tick - calcium[0]!.tick).toBeGreaterThanOrEqual(CALCIUM);
    expect(calcium[1]!.tick).toBeGreaterThan(assessments[1]!.tick);
    expect(assessments[2]!.tick - removal.tick).toBeGreaterThanOrEqual(REMOVAL);
    expect(patient()).toMatchObject({ ended: 'handoff', calciumResponseObserved: true, recurrenceObserved: true,
      removalResponseObserved: true, calciumRequests: 2, calciumClearanceAttempted: false, routineDiuresisAttempted: false,
      durableRecoveryProven: false, observation: { magnesiumMmolL: 2.4, reflexesPresent: true, severeWeakness: false,
        alertness: 'awake with residual weakness', respiratoryRateBpm: 14, spo2Percent: 96 } });
    readWithoutAdvancing(); replayWholeTrace(); render(); frames();
    expect(finishes).toBe(1); expect(recorded()).toHaveLength(12); expect(advance).toBeUndefined();
  });

  it('preserves accepted rescue and a paused clock after takeover while invalidating callbacks across reactivation', () => {
    begin(); confirmDecision(); frames();
    expect(patient()!.breathingAtTick).not.toBeNull();
    const before = { tick: session().tick, patient: patient(), actions: recorded() };
    const stale = advance!; expect(stale).toBeTypeOf('function');
    render(false); act(() => stale()); frames(); readWithoutAdvancing();
    expect({ tick: session().tick, patient: patient(), actions: recorded() }).toEqual(before);
    render(); expect(advance).toBeTypeOf('function');
    act(() => stale()); expect(recorded()).toHaveLength(1);
    confirmDecision(); frames();
    expect(recorded().map((action) => action.payload.action)).toEqual(['support-breathing', 'calcium']);
    expect(patient()!.breathingAtTick).toBe(before.patient!.breathingAtTick); expect(finishes).toBe(0);
  });

  it('rejects retained callbacks after a real session reset and component disposal', () => {
    begin(); const beforeReset = advance!; const oldWorker = worker();
    expect(beforeReset).toBeTypeOf('function'); act(() => session().resetSession());
    expect(oldWorker.terminated).toBe(true); expect(workers).toHaveLength(2);
    act(() => beforeReset()); expect(recorded()).toHaveLength(0); expect(worker().applied).toHaveLength(0);
    expect(session()).toMatchObject({ tick: 0, phase: 'briefing', transport: 'idle' });
    act(() => session().play()); frames();
    expect(advance).toBeTypeOf('function'); act(() => beforeReset()); expect(recorded()).toHaveLength(0);
    confirmDecision(); frames(); const beforeUnmount = advance!;
    expect(beforeUnmount).toBeTypeOf('function'); const before = { count: recorded().length, tick: session().tick };
    act(() => root.unmount()); mounted = false; act(() => beforeUnmount()); frames();
    expect(recorded()).toHaveLength(before.count); expect(worker().applied).toHaveLength(before.count);
    expect(session().tick).toBe(before.tick); expect(finishes).toBe(0);
  });

  it('holds the real session during a shared report modal without reviving an already submitted confirmation', async () => {
    begin(); let stale: (() => void) | undefined;
    for (let decision = 0; decision < 7; decision++) { stale = advance; confirmDecision(); frames(); }
    expect(advance).toBeUndefined(); expect(patient()!.calciumDueInSeconds).toBeGreaterThan(0);
    const count = recorded().length;
    await act(async () => { container.querySelector<HTMLButtonElement>('button[aria-label="Help us improve this"]')!.click(); });
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain('Reporting is unavailable on this host.');
    readWithoutAdvancing(); act(() => stale!()); frames(); readWithoutAdvancing();
    expect(recorded()).toHaveLength(count); expect(worker().applied).toHaveLength(count);
    await act(async () => { button('Cancel').click(); });
    expect(container.querySelector('[role="dialog"]')).toBeNull(); readWithoutAdvancing();
    expect(advance).toBeUndefined(); expect(recorded()).toHaveLength(count);
    act(() => session().play()); frames(); expect(session().transport).toBe('running');
  });




  it('resumes after missed early observations with fresh recurrence review and an explicit repeat choice', () => {
    begin(false);
    const choose = (action: RenalHypermagnesemiaAction) => act(() => session().act({ type: 'renal-hypermagnesemia-response', payload: { action } }));
    for (const action of ['calcium-means-clearance', 'routine-diuresis', 'support-breathing', 'calcium',
      'deliver-removal', 'stop-magnesium', 'call-support', 'review-context', 'monitor'] as const) choose(action);
    const calcium = recorded().find((action) => action.payload.action === 'calcium')!;
    for (let batch = 0; batch < 100 && session().tick < calcium.tick + CALCIUM / 6; batch++) frames();
    act(() => session().pause()); choose('check-magnesium'); choose('check-neuromuscular'); act(() => session().play()); frames();
    expect(patient()).toMatchObject({ calciumResponseObserved: false, observation: null,
      magnesiumObservation: { magnesiumMmolL: 4.6 }, neuromuscularObservation: { reflexesPresent: false, severeWeakness: true } });
    for (let batch = 0; batch < 400 && session().tick < calcium.tick + CALCIUM; batch++) frames();
    act(() => session().pause()); choose('check-magnesium'); choose('check-neuromuscular'); choose('handoff');
    act(() => session().play()); frames();
    expect(patient()).toMatchObject({ ended: null, observation: null, calciumResponseObserved: false,
      recurrenceObserved: false, magnesiumObservation: { magnesiumMmolL: 4.6 } });
    act(() => session().pause()); render();
    expect(advance).toBeTypeOf('function');
    for (let batch = 0; batch < 600 && !patient()?.ended; batch++) {
      if (advance) confirmDecision();
      frames();
    }
    expect(finishes).toBe(1); expect(session().tick).toBeLessThan(SESSION);
    const repeats = recorded().filter((action) => action.payload.action === 'calcium');
    const assessments = recorded().filter((action) => action.payload.action === 'reassess');
    expect(repeats).toHaveLength(2); expect(assessments).toHaveLength(2);
    expect(repeats[1]!.tick).toBeGreaterThan(assessments[0]!.tick);
    expect(patient()).toMatchObject({ ended: 'handoff', calciumResponseObserved: false, removalResponseObserved: true,
      recurrenceObserved: true, calciumClearanceAttempted: true, routineDiuresisAttempted: true,
      durableRecoveryProven: false, observation: { magnesiumMmolL: 2.4, reflexesPresent: true, severeWeakness: false,
        alertness: 'awake with residual weakness', respiratoryRateBpm: 14 } });
    expect(recorded().filter((action) => action.payload.action === 'handoff')).toHaveLength(2);
    readWithoutAdvancing(); replayWholeTrace();
  });

  it('omits unnecessary calcium after observed removal and refreshes full findings after late breathing support', () => {
    begin(false);
    const choose = (action: RenalHypermagnesemiaAction) => act(() => session().act({ type: 'renal-hypermagnesemia-response', payload: { action } }));
    for (const action of ['deliver-removal', 'stop-magnesium', 'call-support', 'review-context', 'monitor'] as const) choose(action);
    const removal = recorded().find((action) => action.payload.action === 'deliver-removal')!;
    for (let batch = 0; batch < 800 && session().tick < removal.tick + REMOVAL; batch++) frames();
    act(() => session().pause()); choose('reassess'); act(() => session().play()); frames();
    expect(patient()).toMatchObject({ removalResponseObserved: true, calciumAtTick: null, breathingAtTick: null,
      observation: { magnesiumMmolL: 2.4, respiratoryRateBpm: 10, spo2Percent: 92 } });
    act(() => session().pause()); render();
    for (let batch = 0; batch < 20 && !patient()?.ended; batch++) {
      if (advance) confirmDecision();
      frames();
    }
    expect(finishes).toBe(1);
    expect(recorded().slice(-3).map((action) => action.payload.action)).toEqual(['support-breathing', 'reassess', 'handoff']);
    expect(recorded().some((action) => action.payload.action === 'calcium')).toBe(false);
    expect(patient()).toMatchObject({ ended: 'handoff', calciumRequests: 0, calciumResponseObserved: false,
      removalResponseObserved: true, observation: { magnesiumMmolL: 2.4, respiratoryRateBpm: 14, spo2Percent: 96 } });
    readWithoutAdvancing(); replayWholeTrace();
  });
});

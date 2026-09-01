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
import { PERIOPERATIVE_DIABETES_INSULIN_CONTINUITY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/perioperative-diabetes-insulin-continuity';
import { PERIOPERATIVE_DIABETES_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/perioperative-diabetes-fixtures';
import { PERIOPERATIVE_DIABETES_EARLY_TICKS as EARLY,
  PERIOPERATIVE_DIABETES_RESPONSE_TICKS as RESPONSE, PERIOPERATIVE_DIABETES_SESSION_TICKS as SESSION,
  type PerioperativeDiabetesAction } from '../../src/modules/endocrine-metabolic/perioperative-diabetes';
import { usePerioperativeDiabetesDemonstration } from '../../src/modules/endocrine-metabolic/demo/usePerioperativeDiabetesDemonstration';
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

describe('PerioperativeDiabetes worked example through the real session pipeline', () => {
  let root: Root; let container: HTMLDivElement; let mounted: boolean;
  let workers: InProcessWorker[]; let advance: (() => void) | undefined; let finishes: number;
  const session = () => useSession.getState();
  const patient = () => session().equipment?.resuscitation.perioperativeDiabetes;
  const worker = () => workers.at(-1)!;
  const recorded = () => sessionInternals().recorder!.build('pending').actions;
  function Harness({ active }: { active: boolean }) {
    const state = useSession();
    const demo = usePerioperativeDiabetesDemonstration({ active, running: state.transport === 'running',
      patient: state.equipment?.resuscitation.perioperativeDiabetes, act: state.act,
      pause: state.pause, play: state.play, onFinished: () => { finishes += 1; } });
    advance = demo.onAdvance;
    // This tests the modal and real session, not AnesthesiaRoute's separate close/resume policy.
    return <ScenarioProblemReport context={{
      scenarioId: SCENARIO.metadata.id, contentVersion: SCENARIO.metadata.version,
      appVersion: 'test', engineVersion: ENGINE_VERSION, moduleId: 'endocrine-metabolic',
      maturity: 'preview', practiceRegion: 'US', fidelityClass: 'state_transition',
      surface: 'live', simulatedTick: state.tick,
      canonicalUrl: 'https://opensimlab.com/endocrine-metabolic/scenario/perioperative-diabetes-insulin-continuity',
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
        scenario: SCENARIO.metadata.version }, 'endocrine-metabolic');
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


  it('records eight confirmations, freezes each reading and wait pause, and replays every full engine frame', () => {
    begin(); const pausedWaits = new Set<string>();
    for (let batch = 0; batch < 1000 && !patient()?.ended; batch++) {
      if (advance) confirmDecision();
      const current = patient();
      const wait = current?.monitoringAtTick !== null && current?.earlyDueInSeconds
        ? 'early' : current?.earlyResponseObserved && current?.responseDueInSeconds ? 'later' : null;
      if (wait && !pausedWaits.has(wait)) {
        pausedWaits.add(wait); expect(advance).toBeUndefined();
        act(() => session().pause()); readWithoutAdvancing();
        act(() => worker().ready()); expect(session().phase).toBe('running'); expect(session().transport).toBe('paused');
        act(() => session().play());
      }
      frames();
    }
    expect(finishes).toBe(1); expect(pausedWaits).toEqual(new Set(['early', 'later']));
    expect(recorded().map((action) => action.payload.action)).toEqual([
      'restore-insulin', 'call-support', 'review-context', 'plan-fasting', 'monitor', 'reassess', 'reassess', 'handoff',
    ]);
    expect(recorded().every((action) => action.type === 'perioperative-diabetes-response')).toBe(true);
    const insulin = recorded()[0]!;
    const assessments = recorded().filter((action) => action.payload.action === 'reassess');
    expect(assessments[0]!.tick - insulin.tick).toBeGreaterThanOrEqual(EARLY);
    expect(assessments[1]!.tick - insulin.tick).toBeGreaterThanOrEqual(RESPONSE);
    expect(patient()).toMatchObject({ ended: 'handoff', earlyResponseObserved: true, responseObserved: true,
      deteriorationObserved: false, omitInsulinAttempted: false, cgmOnlyAttempted: false, clearanceAttempted: false,
      durableRecoveryProven: false, observation: { glucoseMgDl: 144, ketonesMmolL: 0.3 } });
    readWithoutAdvancing(); replayWholeTrace(); render(); frames();
    expect(finishes).toBe(1); expect(recorded()).toHaveLength(8); expect(advance).toBeUndefined();
  }, 120_000);

  it('preserves accepted insulin and a paused clock after takeover while invalidating callbacks across reactivation', () => {
    begin(); confirmDecision(); frames();
    expect(patient()!.insulinAtTick).not.toBeNull();
    const before = { tick: session().tick, patient: patient(), actions: recorded() };
    const stale = advance!; expect(stale).toBeTypeOf('function');
    render(false); act(() => stale()); frames(); readWithoutAdvancing();
    expect({ tick: session().tick, patient: patient(), actions: recorded() }).toEqual(before);
    render(); expect(advance).toBeTypeOf('function');
    act(() => stale()); expect(recorded()).toHaveLength(1);
    confirmDecision(); frames();
    expect(recorded().map((action) => action.payload.action)).toEqual(['restore-insulin', 'call-support']);
    expect(patient()!.insulinAtTick).toBe(before.patient!.insulinAtTick); expect(finishes).toBe(0);
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
    for (let decision = 0; decision < 5; decision++) { stale = advance; confirmDecision(); frames(); }
    expect(advance).toBeUndefined(); expect(patient()!.earlyDueInSeconds).toBeGreaterThan(0);
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

  it('recovers after glucose-only surveillance and refused shortcuts, retaining historical full findings and replaying every frame', () => {
    begin(false);
    const choose = (action: PerioperativeDiabetesAction) => act(() => session().act({ type: 'perioperative-diabetes-response', payload: { action } }));
    for (const action of ['check-glucose', 'omit-insulin', 'cgm-only', 'clear-surgery'] as const) choose(action);
    for (let batch = 0; batch < 900 && session().tick < RESPONSE; batch++) frames();
    act(() => session().pause()); choose('check-glucose'); act(() => session().play()); frames();
    expect(patient()).toMatchObject({ observation: null, glucoseObservation: { glucoseMgDl: 280 },
      deteriorationObserved: false, earlyResponseObserved: false, responseObserved: false });
    act(() => session().pause()); choose('reassess'); choose('restore-insulin');
    for (const action of ['call-support', 'review-context', 'plan-fasting', 'monitor'] as const) choose(action);
    const insulin = recorded().find((action) => action.payload.action === 'restore-insulin')!;
    act(() => session().play()); frames();
    const historical = patient()!.observation;
    expect(historical).toMatchObject({ glucoseMgDl: 280, ketonesMmolL: 2.0 });
    for (let batch = 0; batch < 600 && session().tick < insulin.tick + EARLY; batch++) frames();
    act(() => session().pause()); choose('check-glucose'); act(() => session().play()); frames();
    expect(patient()).toMatchObject({ observation: historical, glucoseObservation: { glucoseMgDl: 198 },
      earlyResponseObserved: false, responseObserved: false, deteriorationObserved: true });
    // Skip the early full observation deliberately; do not fabricate it from glucose-only evidence.
    for (let batch = 0; batch < 600 && session().tick < insulin.tick + RESPONSE; batch++) frames();
    act(() => session().pause()); render();
    for (let batch = 0; batch < 30 && !patient()?.ended; batch++) {
      if (advance) confirmDecision();
      frames();
    }
    expect(finishes).toBe(1); expect(session().tick).toBeLessThan(SESSION);
    expect(recorded().map((action) => action.payload.action)).toEqual([
      'check-glucose', 'omit-insulin', 'cgm-only', 'clear-surgery', 'check-glucose', 'reassess',
      'restore-insulin', 'call-support', 'review-context', 'plan-fasting', 'monitor', 'check-glucose',
      'reassess', 'handoff',
    ]);
    const lastAssessment = recorded().filter((action) => action.payload.action === 'reassess').at(-1)!;
    expect(lastAssessment.tick - insulin.tick).toBeGreaterThanOrEqual(RESPONSE);
    expect(patient()).toMatchObject({ ended: 'handoff', responseObserved: true, earlyResponseObserved: false,
      deteriorationObserved: true, omitInsulinAttempted: true, cgmOnlyAttempted: true, clearanceAttempted: true,
      durableRecoveryProven: false, observation: { glucoseMgDl: 162, ketonesMmolL: 0.4 } });
    readWithoutAdvancing(); replayWholeTrace();
  }, 120_000);
});


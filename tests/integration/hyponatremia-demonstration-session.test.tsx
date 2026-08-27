/** @vitest-environment jsdom */
import { createHash } from 'node:crypto';
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION, type Scenario } from '@anesthesia/engine';
import type { PatientState } from '@anesthesia/physiology';
import { MODEL_SET_REVISION } from '@anesthesia/pharmacology/registry';
import { WORKER_PROTOCOL_VERSION, assertProtocolVersion,
  type FromWorkerMessage, type ToWorkerMessage, type LearnerAction } from '@platform/kernel/protocol';
import { useSession, sessionInternals } from '@platform/session/session-store';
import { HYPONATREMIA_AQUARESIS_AND_OVERCORRECTION as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hyponatremia-aquaresis-and-overcorrection';
import { HYPONATREMIA_CORRECTION_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/hyponatremia-correction-fixtures';
import { HYPONATREMIA_CORRECTION_AQUARESIS_TICKS as AQUARESIS, HYPONATREMIA_CORRECTION_OVERCORRECTION_TICKS as BREACH,
  HYPONATREMIA_CORRECTION_RESPONSE_TICKS as RESPONSE,
  type HyponatremiaCorrectionAction } from '../../src/modules/endocrine-metabolic/hyponatremia-correction';
import { useHyponatremiaCorrectionDemonstration } from '../../src/modules/endocrine-metabolic/demo/useHyponatremiaCorrectionDemonstration';

/** Only the transport is in-process. The store, clock, recorder, protocol, and entire solver are real. */
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
      // Every field and every waveform sample, not just final sodium or visible vital signs.
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

describe('Sodium worked example through the real session pipeline', () => {
  let root: Root; let container: HTMLDivElement; let mounted: boolean;
  let workers: InProcessWorker[]; let advance: (() => void) | undefined; let narration: string; let finishes: number;
  const session = () => useSession.getState();
  const patient = () => session().equipment?.resuscitation.hyponatremiaCorrection;
  const worker = () => workers.at(-1)!;
  const recorded = () => sessionInternals().recorder!.build('pending').actions;
  function Harness({ active }: { active: boolean }) {
    const state = useSession();
    const demo = useHyponatremiaCorrectionDemonstration({ active, running: state.transport === 'running',
      patient: state.equipment?.resuscitation.hyponatremiaCorrection, act: state.act,
      pause: state.pause, play: state.play, onFinished: () => { finishes += 1; } });
    advance = demo.onAdvance; narration = demo.beat?.narration ?? ''; return null;
  }
  const render = (active = true) => act(() => root.render(<StrictMode><Harness active={active} /></StrictMode>));
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
    mounted = true; workers = []; advance = undefined; narration = ''; finishes = 0;
  });
  afterEach(() => {
    if (mounted) act(() => root.unmount());
    act(() => session().end()); sessionInternals().client?.terminate(); container.remove();
  });

  it('records seven learner-confirmed decisions, preserves both waits, and replays every complete engine frame', () => {
    begin(); const pausedWaits = new Set<string>();
    for (let batch = 0; batch < 1500 && !patient()?.ended; batch += 1) {
      if (advance) confirmDecision();
      const current = patient();
      const wait = current?.monitoringAtTick !== null && current?.aquaresisDueInSeconds
        ? 'surveillance' : current?.waterLossControlAtTick !== null && current?.responseDueInSeconds ? 'reassessment' : null;
      if (wait && !pausedWaits.has(wait)) {
        pausedWaits.add(wait); expect(advance).toBeUndefined();
        act(() => session().pause()); readWithoutAdvancing();
        act(() => worker().ready()); expect(session().phase).toBe('running'); expect(session().transport).toBe('paused');
        act(() => session().play());
      }
      frames();
    }
    expect(finishes).toBe(1); expect(pausedWaits).toEqual(new Set(['surveillance', 'reassessment']));
    expect(recorded().map((action) => action.payload.action)).toEqual([
      'review-risk', 'call-support', 'monitor', 'reassess', 'control-water-loss', 'reassess', 'handoff',
    ]);
    const assessments = recorded().filter((action) => action.payload.action === 'reassess');
    const control = recorded().find((action) => action.payload.action === 'control-water-loss')!;
    expect(assessments[0]!.tick).toBeGreaterThanOrEqual(AQUARESIS);
    expect(control.tick).toBeLessThan(BREACH);
    expect(assessments[1]!.tick - control.tick).toBeGreaterThanOrEqual(RESPONSE);
    expect(patient()).toMatchObject({ ended: 'handoff', responseObserved: true, reloweringAtTick: null,
      overcorrectionObserved: false, peakObservedSodiumMmolL: 112, durableRecoveryProven: false,
      observation: { sodiumMmolL: 112, urineOutputMlPerHour: 100 } });
    readWithoutAdvancing(); replayWholeTrace(); render(); frames();
    expect(finishes).toBe(1); expect(recorded()).toHaveLength(7); expect(advance).toBeUndefined();
  }, 120_000);

  it('rejects retained decisions after takeover, real reset, and unmount without late transcript or worker actions', () => {
    begin(); const beforeTakeover = advance!; const initialTick = session().tick;
    expect(beforeTakeover).toBeTypeOf('function'); render(false);
    act(() => beforeTakeover()); frames();
    expect(recorded()).toHaveLength(0); expect(worker().applied).toHaveLength(0); expect(session().tick).toBe(initialTick);
    render(); const beforeReset = advance!; expect(beforeReset).toBeTypeOf('function');
    const oldWorker = worker(); act(() => session().resetSession());
    expect(oldWorker.terminated).toBe(true); expect(workers).toHaveLength(2);
    act(() => beforeReset()); expect(recorded()).toHaveLength(0); expect(worker().applied).toHaveLength(0);
    expect(session()).toMatchObject({ tick: 0, phase: 'briefing', transport: 'idle' });
    act(() => session().play()); frames();
    expect(advance).toBeTypeOf('function'); act(() => { beforeTakeover(); beforeReset(); });
    expect(recorded()).toHaveLength(0); confirmDecision(); frames();
    const beforeUnmount = advance!; expect(beforeUnmount).toBeTypeOf('function');
    const count = recorded().length; act(() => root.unmount()); mounted = false;
    act(() => beforeUnmount()); frames();
    expect(recorded()).toHaveLength(count); expect(worker().applied).toHaveLength(count); expect(finishes).toBe(0);
  });

  it('keeps a late-control breach hidden until a fresh assessment, then completes observed recovery and exact replay', () => {
    begin(false);
    const choose = (action: HyponatremiaCorrectionAction) => act(() => session().act({ type: 'hyponatremia-correction-response', payload: { action } }));
    for (const action of ['review-risk', 'call-support', 'monitor'] as const) choose(action);
    for (let batch = 0; batch < 700 && session().tick < AQUARESIS; batch += 1) frames();
    act(() => session().pause()); choose('reassess');
    act(() => session().play());
    for (let batch = 0; batch < 700 && session().tick < BREACH; batch += 1) frames();
    act(() => session().pause()); choose('control-water-loss');
    act(() => session().play()); frames(); render();
    const control = recorded().find((action) => action.payload.action === 'control-water-loss')!;
    expect(control.tick).toBeGreaterThanOrEqual(BREACH);
    expect(patient()).toMatchObject({ observation: { sodiumMmolL: 112 }, peakObservedSodiumMmolL: 112,
      overcorrectionObserved: false, reloweringAtTick: null, responseObserved: false });
    expect(patient()!.responseDueInSeconds).toBeGreaterThan(0); expect(advance).toBeUndefined();
    expect(narration).toContain('reassessment checkpoint'); expect(narration).not.toMatch(/115|exceeded/);
    let observedBreach = false;
    for (let batch = 0; batch < 1800 && !patient()?.ended; batch += 1) {
      if (!patient()!.overcorrectionObserved) {
        expect(patient()!.peakObservedSodiumMmolL).toBe(112); expect(narration).not.toMatch(/115|exceeded/);
      } else observedBreach = true;
      if (advance) confirmDecision();
      frames();
    }
    expect(observedBreach).toBe(true); expect(finishes).toBe(1);
    expect(recorded().map((action) => action.payload.action)).toEqual([
      'review-risk', 'call-support', 'monitor', 'reassess', 'control-water-loss', 'reassess', 'relower', 'reassess', 'handoff',
    ]);
    const assessments = recorded().filter((action) => action.payload.action === 'reassess');
    const relower = recorded().find((action) => action.payload.action === 'relower')!;
    expect(assessments[1]!.tick - control.tick).toBeGreaterThanOrEqual(RESPONSE);
    expect(relower.tick).toBeGreaterThanOrEqual(assessments[1]!.tick);
    expect(assessments[2]!.tick - relower.tick).toBeGreaterThanOrEqual(RESPONSE);
    expect(patient()).toMatchObject({ ended: 'handoff', overcorrectionObserved: true, peakObservedSodiumMmolL: 115,
      responseObserved: true, durableRecoveryProven: false, observation: { sodiumMmolL: 112, urineOutputMlPerHour: 100 } });
    replayWholeTrace();
  }, 120_000);
});

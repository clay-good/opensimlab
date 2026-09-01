/**
 * @vitest-environment jsdom
 *
 * The demonstration, driven end to end over simulated time.
 *
 * Everything else about the demonstration is covered in pieces: the script
 * against the engine by replay, the hook and the strip in isolation. What was
 * never covered is the whole thing running — the hook watching a real clock,
 * dispatching into the real store, over the real worker protocol, into the real
 * engine, for the full three hundred and thirty seconds.
 *
 * That gap was not theoretical. The `?demo=1` link shipped broken in exactly
 * that seam: the demonstration started, and a late ready message from the solver
 * put the session back to the briefing with the clock stopped. Every unit test
 * passed. This is the test that would have caught it.
 */
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  WORKER_PROTOCOL_VERSION, assertProtocolVersion,
  type FromWorkerMessage, type ToWorkerMessage,
} from '@platform/kernel/protocol';
import { AnesthesiaEngine, ENGINE_VERSION, type Scenario } from '@anesthesia/engine';
import { MODEL_SET_REVISION } from '@anesthesia/pharmacology/registry';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { useSession, sessionInternals } from '@platform/session/session-store';
import { useHypoglycemiaDemonstration } from '../../src/modules/endocrine-metabolic/demo/useHypoglycemiaDemonstration';
import { SEVERE_HYPOGLYCEMIA_RECURRENCE } from '../../src/modules/endocrine-metabolic/scenarios/severe-hypoglycemia-recurrence';
import { useAdrenalDemonstration } from '../../src/modules/endocrine-metabolic/demo/useAdrenalDemonstration';
import { ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS } from '../../src/modules/endocrine-metabolic/scenarios/adrenal-crisis-treatment-before-tests';
import { useThyroidDemonstration } from '../../src/modules/endocrine-metabolic/demo/useThyroidDemonstration';
import { THYROID_STORM_HEMODYNAMIC_RISK } from '../../src/modules/endocrine-metabolic/scenarios/thyroid-storm-hemodynamic-risk';
import { THYROID_IODINE_WAIT_TICKS, THYROID_RESPONSE_TICKS } from '../../src/modules/endocrine-metabolic/thyroid-storm';
import { useMyxedemaDemonstration } from '../../src/modules/endocrine-metabolic/demo/useMyxedemaDemonstration';
import { MYXEDEMA_COMA_VENTILATION_AND_STEROID_SEQUENCE } from '../../src/modules/endocrine-metabolic/scenarios/myxedema-coma-ventilation-and-steroid-sequence';
import { MYXEDEMA_VENTILATION_TICKS, MYXEDEMA_RESPONSE_TICKS } from '../../src/modules/endocrine-metabolic/myxedema';
import { useHypercalcemiaDemonstration } from '../../src/modules/endocrine-metabolic/demo/useHypercalcemiaDemonstration';
import { HYPERCALCEMIC_CRISIS_VOLUME_AND_BRIDGE } from '../../src/modules/endocrine-metabolic/scenarios/hypercalcemic-crisis-volume-and-bridge';
import { HYPERCALCEMIA_FLUID_RESPONSE_TICKS, HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS } from '../../src/modules/endocrine-metabolic/hypercalcemia';
import { useHypocalcemiaDemonstration } from '../../src/modules/endocrine-metabolic/demo/useHypocalcemiaDemonstration';
import { HYPOCALCEMIC_TETANY_RESCUE_AND_RECURRENCE } from '../../src/modules/endocrine-metabolic/scenarios/hypocalcemic-tetany-rescue-and-recurrence';
import { HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS, HYPOCALCEMIA_RESPONSE_TICKS } from '../../src/modules/endocrine-metabolic/hypocalcemia';
import type { PatientState } from '@anesthesia/physiology';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { useDemonstration } from '@anesthesia/demo/useDemonstration';
import {
  DEMONSTRATION_SECONDS, INDUCTION_DEMONSTRATION,
} from '@anesthesia/demo/demonstration';

/** The same in-process solver the session integration test uses. */
class InProcessWorker implements Partial<Worker> {
  onmessage: ((event: MessageEvent<FromWorkerMessage<PatientState>>) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  private engine: AnesthesiaEngine | null = null;
  /** Every action the engine actually received, in order. */
  readonly applied: { type: string; payload: Record<string, unknown> }[] = [];

  postMessage(message: ToWorkerMessage): void {
    assertProtocolVersion(message);
    switch (message.type) {
      case 'init':
        this.engine = new AnesthesiaEngine({
          scenario: message.scenario as Scenario,
          seed: message.seed,
          practiceRegion: message.practiceRegion,
        });
        this.emit({
          v: WORKER_PROTOCOL_VERSION, type: 'ready',
          engineVersion: ENGINE_VERSION, modelSetRevision: MODEL_SET_REVISION,
        });
        break;
      case 'action':
        this.applied.push({
          type: message.action.type,
          payload: message.action.payload as Record<string, unknown>,
        });
        this.engine?.apply(message.action);
        break;
      case 'advance': {
        if (!this.engine) return;
        let last = this.engine.step();
        const events = [...last.events];
        const signals = ['ecg', 'arterial', 'capno', 'pleth'] as const;
        const collected: Record<string, number[]> = { ecg: [], arterial: [], capno: [], pleth: [] };
        const collect = () => {
          for (const signal of signals) collected[signal]!.push(...last.waveforms[signal].samples);
        };
        collect();
        for (let i = 1; i < message.ticks; i += 1) {
          last = this.engine.step();
          events.push(...last.events);
          collect();
        }
        this.emit({
          v: WORKER_PROTOCOL_VERSION,
          type: 'state',
          tick: last.tick,
          state: last.state,
          concentrations: last.concentrations,
          attribution: last.attribution,
          waveforms: signals.map((signal) => ({
            signal,
            sampleRateHz: last.waveforms[signal].sampleRateHz,
            startSeconds: last.waveforms[signal].startSeconds,
            samples: new Float32Array(collected[signal]!),
          })),
          alarms: last.alarms.map((alarm) => ({
            alarmId: alarm.id, priority: alarm.priority, parameter: alarm.parameter,
            value: alarm.value, unit: alarm.unit, message: alarm.message,
            sinceTick: alarm.sinceTick, silencedUntilTick: alarm.silencedUntilTick,
          })),
          events,
          warnings: last.warnings,
          equipment: last.equipment,
        } as FromWorkerMessage<PatientState>);
        break;
      }
      default:
        break;
    }
  }

  terminate(): void {}

  /**
   * Emit a ready message out of band.
   *
   * The real failure needed a SECOND ready arriving after the session had
   * started — React's development double-mount stands two solvers up, and the
   * second one's ready landed on a running session. One `begin()` in a test
   * emits one ready, before `play()`, which is why the first version of this
   * file did not reproduce the bug it claimed to catch.
   */
  sendReadyAgain(): void {
    this.emit({
      v: WORKER_PROTOCOL_VERSION, type: 'ready',
      engineVersion: ENGINE_VERSION, modelSetRevision: MODEL_SET_REVISION,
    });
  }

  private emit(message: FromWorkerMessage<PatientState>): void {
    this.onmessage?.({ data: message } as MessageEvent<FromWorkerMessage<PatientState>>);
  }
}

/** Just the demonstration hook, wired to the real store. No canvas involved. */
function Harness({ onBeat }: { onBeat: (narration: string | null, focus: string | null) => void }) {
  const session = useSession();
  const demonstration = useDemonstration({
    active: true,
    tick: session.tick,
    act: session.act,
    onFinished: () => {},
  });
  useEffect(() => {
    onBeat(demonstration.beat?.narration ?? null, demonstration.beat?.focus ?? null);
  }, [demonstration.beat, onBeat]);
  return null;
}

function advancePausedDecision(advance: () => void, worker: InProcessWorker) {
  const paused = useSession.getState(); const count = worker.applied.length;
  expect(paused.transport).toBe('paused');
  act(() => {
    for (let frame = 0; frame < 60; frame += 1) useSession.getState().frame(frame % 2 ? 1000 / 60 : 1000);
  });
  expect(useSession.getState().tick).toBe(paused.tick);
  expect(useSession.getState().state).toEqual(paused.state);
  expect(useSession.getState().equipment).toEqual(paused.equipment);
  expect(worker.applied).toHaveLength(count);
  act(() => {
    advance();
    expect(worker.applied).toHaveLength(count + 1);
    advance();
    expect(worker.applied).toHaveLength(count + 1);
  });
  // The action has reached the engine, but the next worker snapshot has not.
  // Rerendering with that stale snapshot must not pause the same decision again.
  expect(useSession.getState().transport).toBe('running');
  expect(useSession.getState().tick).toBe(paused.tick);
  expect(useSession.getState().equipment).toEqual(paused.equipment);
}

describe('the demonstration, run for its full length', () => {
  const workers: InProcessWorker[] = [];
  const narrations: string[] = [];
  const focuses: string[] = [];

  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    useSession.getState().begin(
      {
        scenarioId: ROUTINE_INDUCTION.metadata.id,
        scenarioVersion: ROUTINE_INDUCTION.metadata.version,
        contentVersion: ROUTINE_INDUCTION.metadata.version,
        modelSetRevision: MODEL_SET_REVISION,
        engineVersion: ENGINE_VERSION,
        practiceRegion: 'US',
        seed: 20260819,
        scenario: ROUTINE_INDUCTION,
      },
      () => { const w = new InProcessWorker(); workers.push(w); return w as unknown as Worker; },
      {
        engine: ENGINE_VERSION, content: ROUTINE_INDUCTION.metadata.version,
        modelSet: MODEL_SET_REVISION, scenario: ROUTINE_INDUCTION.metadata.version,
      },
      'anesthesia',
    );
  });

  act(() => {
    root.render(createElement(Harness, {
      onBeat: (narration, focus) => {
        if (narration && narrations[narrations.length - 1] !== narration) narrations.push(narration);
        if (focus && focuses[focuses.length - 1] !== focus) focuses.push(focus);
      },
    }));
  });

  // Five times speed, exactly as the front door's link sets it, then the whole
  // thing driven a frame at a time.
  act(() => { useSession.getState().setSpeed(5); useSession.getState().play(); });
  // Frames are driven in small batches, each in its own `act`, so React
  // re-renders between them and the hook sees the clock ADVANCE rather than
  // jump. Driving the whole run inside one `act` batches every update into a
  // single render: the hook then sees tick 0 and then tick 3500, fires all five
  // actions at the end, and the patient never meets a drug during the session.
  // That is a faithful test of catch-up and a useless test of the demonstration.
  const frameMs = 1000 / 60;
  const framesPerBatch = 6;
  const wallSeconds = (DEMONSTRATION_SECONDS + 20) / 5;
  const batches = Math.round((wallSeconds * 1000) / frameMs / framesPerBatch);
  /** The phase seen on every batch, so a momentary drop out of 'running' shows. */
  const phasesSeen = new Set<string>();
  for (let batch = 0; batch < batches; batch += 1) {
    act(() => {
      for (let i = 0; i < framesPerBatch; i += 1) useSession.getState().frame(frameMs);
    });
    phasesSeen.add(useSession.getState().phase);
    // A quarter of the way in, a second solver reports ready — which is what
    // React's development double-mount does, and what broke the front door's
    // demonstration link. It must not disturb a session already under way.
    if (batch === Math.round(batches / 4)) act(() => { workers[0]!.sendReadyAgain(); });
  }

  const applied = workers[0]!.applied;
  const state = () => useSession.getState().state!;

  it('reaches the end of the script rather than stalling part-way', () => {
    expect(useSession.getState().tick / TICKS_PER_SECOND).toBeGreaterThan(DEMONSTRATION_SECONDS);
    expect(useSession.getState().phase).toBe('running');
    expect(useSession.getState().transport).toBe('running');
  });

  it('is not disturbed by a second solver reporting ready mid-run', () => {
    // The bug this file exists for. A late ready message used to set the phase
    // back to 'briefing', stopping the clock and returning the learner to the
    // briefing screen — which is how the front door's demonstration link looked
    // like it did nothing at all. The session must never have left 'running'.
    expect([...phasesSeen]).toEqual(['running']);
  });

  it('performs every scripted action exactly once, and no others', () => {
    const scripted = INDUCTION_DEMONSTRATION.filter((beat) => beat.action);
    expect(applied).toHaveLength(scripted.length);
    expect(applied.map((entry) => entry.type))
      .toEqual(scripted.map((beat) => beat.action!.type));
  });

  it('says every line in the script, in order', () => {
    expect(narrations).toEqual(INDUCTION_DEMONSTRATION.map((beat) => beat.narration));
  });

  it('moves the viewer between the regions rather than pointing at one', () => {
    expect(new Set(focuses).size).toBeGreaterThanOrEqual(3);
    expect(focuses[0]).toBe('monitor');
    expect(focuses).toContain('analysis');
    expect(focuses).toContain('actions');
  });

  it('leaves a patient the narration described: anaesthetised, ventilated, intubated', () => {
    expect(state().depthIndex).toBeLessThan(60);
    expect(state().etco2MmHg).toBeGreaterThan(20);
    expect(useSession.getState().equipment?.airway.intubated).toBe(true);
    expect(useSession.getState().equipment?.ventilator.delivering).toBe(true);
  });

  it('never desaturates the patient it was preoxygenating', () => {
    expect(state().spo2Percent).toBeGreaterThan(95);
  });

  it('produces the waveform the monitor draws, not just numbers', () => {
    const blocks = useSession.getState().waveformBlocks;
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) expect(block.samples.length).toBeGreaterThan(0);
  });

  it('runs the hypoglycemia example through the real session clock, recorder, and worker protocol', () => {
    act(() => root.unmount());
    const exampleRoot = createRoot(container); const scenario = SEVERE_HYPOGLYCEMIA_RECURRENCE;
    const worker = new InProcessWorker(); let finishes = 0; let decisions = 0;
    const advance = { current: undefined as (() => void) | undefined };
    function HypoglycemiaHarness() {
      const session = useSession();
      const demonstration = useHypoglycemiaDemonstration({ active: true, running: session.transport === 'running',
        patient: session.equipment?.resuscitation.severeHypoglycemia, act: session.act,
        pause: session.pause, play: session.play, onFinished: () => { finishes += 1; },
      });
      advance.current = demonstration.onAdvance;
      return null;
    }
    try {
      act(() => {
        useSession.getState().begin({ scenarioId: scenario.metadata.id, scenarioVersion: scenario.metadata.version,
          contentVersion: scenario.metadata.version, modelSetRevision: MODEL_SET_REVISION, engineVersion: ENGINE_VERSION,
          practiceRegion: 'US', seed: 4901, scenario,
        }, () => worker as unknown as Worker, { engine: ENGINE_VERSION, content: scenario.metadata.version,
          modelSet: MODEL_SET_REVISION, scenario: scenario.metadata.version }, 'endocrine-metabolic');
        exampleRoot.render(createElement(HypoglycemiaHarness));
        useSession.getState().setSpeed(60); useSession.getState().play();
      });
      for (let batch = 0; batch < 600 && !useSession.getState().equipment?.resuscitation.severeHypoglycemia?.ended; batch += 1) {
        if (advance.current) { advancePausedDecision(advance.current, worker); decisions += 1; }
        if (batch === 25) {
          act(() => useSession.getState().pause());
          const pausedTick = useSession.getState().tick; const count = worker.applied.length;
          act(() => useSession.getState().frame(100));
          expect(useSession.getState().tick).toBe(pausedTick); expect(worker.applied).toHaveLength(count);
          act(() => useSession.getState().play());
        }
        if (batch === 50) act(() => worker.sendReadyAgain());
        if (batch === 100) {
          act(() => useSession.getState().frame(1000));
          const cappedTick = useSession.getState().tick;
          expect(useSession.getState().transport).toBe('paused');
          act(() => useSession.getState().frame(1000 / 60));
          expect(useSession.getState().tick).toBe(cappedTick);
          act(() => useSession.getState().play());
          expect(useSession.getState().catchUpNotice).toBe(false);
        }
        act(() => {
          for (let frame = 0; frame < 6; frame += 1) useSession.getState().frame(1000 / 60);
          // The final observation can arrive in the same render as a manual
          // pause; completion must still be recognized exactly once.
          if (worker.applied.length === 10) useSession.getState().pause();
        });
      }
      expect(finishes, JSON.stringify({ tick: useSession.getState().tick, phase: useSession.getState().phase,
        patient: useSession.getState().equipment?.resuscitation.severeHypoglycemia, applied: worker.applied })).toBe(1);
      expect(decisions).toBe(10);
      expect(useSession.getState().transport).toBe('paused');
      expect(worker.applied).toHaveLength(10);
      expect(useSession.getState().equipment?.resuscitation.severeHypoglycemia?.ended).toBe('handoff');
      const transcript = sessionInternals().recorder!.build('pending');
      const replay = new AnesthesiaEngine({ scenario, seed: 4901, practiceRegion: 'US' });
      let last;
      for (let tick = 0; tick < useSession.getState().tick; tick += 1) {
        for (const action of transcript.actions) if (action.tick === tick) replay.apply(action);
        last = replay.step();
      }
      expect(last?.state).toEqual(useSession.getState().state);
      expect(replay.equipment().resuscitation.severeHypoglycemia).toEqual(useSession.getState().equipment?.resuscitation.severeHypoglycemia);
      act(() => { exampleRoot.render(createElement(HypoglycemiaHarness)); useSession.getState().frame(100); });
      expect(finishes).toBe(1); expect(worker.applied).toHaveLength(10);
    } finally { act(() => exampleRoot.unmount()); container.remove(); }
  });

  it('runs the adrenal example through combined rescue, the timed reassessment, and a replayable handoff', () => {
    const exampleContainer = document.createElement('div'); document.body.appendChild(exampleContainer);
    const exampleRoot = createRoot(exampleContainer); const scenario = ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS;
    const worker = new InProcessWorker(); let finishes = 0; let decisions = 0;
    const advance = { current: undefined as (() => void) | undefined };
    function AdrenalHarness() {
      const session = useSession();
      const demonstration = useAdrenalDemonstration({ active: true, running: session.transport === 'running',
        patient: session.equipment?.resuscitation.adrenalCrisis, act: session.act,
        pause: session.pause, play: session.play, onFinished: () => { finishes += 1; },
      });
      advance.current = demonstration.onAdvance;
      return null;
    }
    try {
      act(() => {
        useSession.getState().begin({ scenarioId: scenario.metadata.id, scenarioVersion: scenario.metadata.version,
          contentVersion: scenario.metadata.version, modelSetRevision: MODEL_SET_REVISION, engineVersion: ENGINE_VERSION,
          practiceRegion: 'US', seed: 4902, scenario,
        }, () => worker as unknown as Worker, { engine: ENGINE_VERSION, content: scenario.metadata.version,
          modelSet: MODEL_SET_REVISION, scenario: scenario.metadata.version }, 'endocrine-metabolic');
        exampleRoot.render(createElement(AdrenalHarness));
        useSession.getState().setSpeed(60); useSession.getState().play();
      });
      for (let batch = 0; batch < 150 && !useSession.getState().equipment?.resuscitation.adrenalCrisis?.ended; batch += 1) {
        if (advance.current) { advancePausedDecision(advance.current, worker); decisions += 1; }
        if (batch === 25) {
          act(() => useSession.getState().pause());
          const pausedTick = useSession.getState().tick; const count = worker.applied.length;
          const pausedPatient = useSession.getState().equipment?.resuscitation.adrenalCrisis;
          act(() => { for (let frame = 0; frame < 60; frame += 1) useSession.getState().frame(1000 / 60); });
          expect(useSession.getState().tick).toBe(pausedTick); expect(worker.applied).toHaveLength(count);
          expect(useSession.getState().equipment?.resuscitation.adrenalCrisis).toEqual(pausedPatient);
          act(() => useSession.getState().play());
        }
        act(() => { for (let frame = 0; frame < 6; frame += 1) useSession.getState().frame(1000 / 60); });
      }
      expect(finishes, JSON.stringify({ tick: useSession.getState().tick,
        patient: useSession.getState().equipment?.resuscitation.adrenalCrisis, applied: worker.applied })).toBe(1);
      expect(decisions).toBe(7);
      expect(useSession.getState().transport).toBe('paused');
      expect(worker.applied).toEqual([
        'hydrocortisone', 'saline', 'call-support', 'review-record', 'reassess', 'prevention', 'handoff',
      ].map((action) => ({ type: 'adrenal-crisis-response', payload: { action } })));
      expect(useSession.getState().equipment?.resuscitation.adrenalCrisis).toMatchObject({
        supportActive: true, recordReviewed: true, responseObserved: true, preventionPlanned: true, ended: 'handoff',
      });
      const transcript = sessionInternals().recorder!.build('pending');
      const steroid = transcript.actions.find((action) => action.type === 'adrenal-crisis-response' && action.payload.action === 'hydrocortisone')!;
      const saline = transcript.actions.find((action) => action.type === 'adrenal-crisis-response' && action.payload.action === 'saline')!;
      const reassessment = transcript.actions.find((action) => action.type === 'adrenal-crisis-response' && action.payload.action === 'reassess')!;
      expect(reassessment.tick - Math.max(steroid.tick, saline.tick)).toBeGreaterThanOrEqual(10 * 60 * TICKS_PER_SECOND);
      const replay = new AnesthesiaEngine({ scenario, seed: 4902, practiceRegion: 'US' });
      let last;
      for (let tick = 0; tick < useSession.getState().tick; tick += 1) {
        for (const action of transcript.actions) if (action.tick === tick) replay.apply(action);
        last = replay.step();
      }
      expect(last?.state).toEqual(useSession.getState().state);
      expect(replay.equipment().resuscitation.adrenalCrisis).toEqual(useSession.getState().equipment?.resuscitation.adrenalCrisis);
      act(() => { exampleRoot.render(createElement(AdrenalHarness)); useSession.getState().frame(100); });
      expect(finishes).toBe(1); expect(worker.applied).toHaveLength(7);
    } finally { act(() => exampleRoot.unmount()); exampleContainer.remove(); }
  });

  it('runs the thyroid example through both distinct waits and replays its real session transcript', () => {
    const exampleContainer = document.createElement('div'); document.body.appendChild(exampleContainer);
    const exampleRoot = createRoot(exampleContainer); const scenario = THYROID_STORM_HEMODYNAMIC_RISK;
    const worker = new InProcessWorker(); let finishes = 0; let decisions = 0;
    const advance = { current: undefined as (() => void) | undefined };
    const pausedWaits = new Set<string>();
    function ThyroidHarness() {
      const session = useSession();
      const demonstration = useThyroidDemonstration({ active: true, running: session.transport === 'running',
        patient: session.equipment?.resuscitation.thyroidStorm, act: session.act,
        pause: session.pause, play: session.play, onFinished: () => { finishes += 1; },
      });
      advance.current = demonstration.onAdvance;
      return null;
    }
    try {
      act(() => {
        useSession.getState().begin({ scenarioId: scenario.metadata.id, scenarioVersion: scenario.metadata.version,
          contentVersion: scenario.metadata.version, modelSetRevision: MODEL_SET_REVISION, engineVersion: ENGINE_VERSION,
          practiceRegion: 'US', seed: 4903, scenario,
        }, () => worker as unknown as Worker, { engine: ENGINE_VERSION, content: scenario.metadata.version,
          modelSet: MODEL_SET_REVISION, scenario: scenario.metadata.version }, 'endocrine-metabolic');
        exampleRoot.render(createElement(ThyroidHarness));
        useSession.getState().setSpeed(60); useSession.getState().play();
      });
      for (let batch = 0; batch < 2000 && !useSession.getState().equipment?.resuscitation.thyroidStorm?.ended; batch += 1) {
        if (advance.current) { advancePausedDecision(advance.current, worker); decisions += 1; }
        const patient = useSession.getState().equipment?.resuscitation.thyroidStorm;
        const wait = patient && patient.iodineAtTick === null && patient.observation
          && patient.iodineDueInSeconds !== null && patient.iodineDueInSeconds > 0 ? 'iodine'
          : patient && patient.iodineAtTick !== null && patient.responseDueInSeconds !== null
            && patient.responseDueInSeconds > 0 ? 'partial-support' : null;
        if (wait && !pausedWaits.has(wait)) {
          pausedWaits.add(wait);
          act(() => useSession.getState().pause());
          const tick = useSession.getState().tick; const count = worker.applied.length;
          act(() => { for (let frame = 0; frame < 60; frame += 1) useSession.getState().frame(1000 / 60); });
          expect(useSession.getState().tick).toBe(tick);
          expect(useSession.getState().equipment?.resuscitation.thyroidStorm).toEqual(patient);
          expect(worker.applied).toHaveLength(count);
          act(() => useSession.getState().play());
        }
        act(() => { for (let frame = 0; frame < 6; frame += 1) useSession.getState().frame(1000 / 60); });
      }
      expect(finishes).toBe(1); expect(decisions).toBe(9);
      expect(pausedWaits).toEqual(new Set(['iodine', 'partial-support']));
      expect(useSession.getState().transport).toBe('paused');
      expect(worker.applied).toEqual([
        'synthesis-blockade', 'supportive-care', 'call-support', 'assess-circulation', 'rate-control-review',
        'reassess', 'iodine', 'reassess', 'handoff',
      ].map((action) => ({ type: 'thyroid-storm-response', payload: { action } })));
      expect(useSession.getState().equipment?.resuscitation.thyroidStorm).toMatchObject({
        ended: 'handoff', responseObserved: true, urgentCoverageDelayed: false, earlyIodineAttempted: false,
        durableRecoveryProven: false, observation: { heartRateBpm: 132, coreTemperatureC: 39.3 },
      });
      const transcript = sessionInternals().recorder!.build('pending');
      const actions = transcript.actions.filter((action) => action.type === 'thyroid-storm-response');
      const synthesis = actions.find((action) => action.payload.action === 'synthesis-blockade')!;
      const iodine = actions.find((action) => action.payload.action === 'iodine')!;
      const reassessments = actions.filter((action) => action.payload.action === 'reassess');
      expect(iodine.tick - synthesis.tick).toBeGreaterThanOrEqual(THYROID_IODINE_WAIT_TICKS);
      expect(reassessments[0]!.tick).toBeLessThan(iodine.tick);
      expect(reassessments[1]!.tick - iodine.tick).toBeGreaterThanOrEqual(THYROID_RESPONSE_TICKS);
      const replay = new AnesthesiaEngine({ scenario, seed: 4903, practiceRegion: 'US' });
      let last;
      for (let tick = 0; tick < useSession.getState().tick; tick += 1) {
        for (const action of transcript.actions) if (action.tick === tick) replay.apply(action);
        last = replay.step();
      }
      expect(last?.state).toEqual(useSession.getState().state);
      expect(replay.equipment().resuscitation.thyroidStorm).toEqual(useSession.getState().equipment?.resuscitation.thyroidStorm);
      act(() => { exampleRoot.render(createElement(ThyroidHarness)); useSession.getState().frame(100); });
      expect(finishes).toBe(1); expect(worker.applied).toHaveLength(9);
    } finally { act(() => exampleRoot.unmount()); exampleContainer.remove(); }
  // Two complete three-hour, whole-tick runs include session recording and replay.
  });

  it('runs the myxedema example through distinct respiratory and partial-support waits and replays its real transcript', () => {
    // This test must also run alone without the induction fixture owning the store.
    act(() => root.unmount());
    const exampleContainer = document.createElement('div'); document.body.appendChild(exampleContainer);
    const exampleRoot = createRoot(exampleContainer); const scenario = MYXEDEMA_COMA_VENTILATION_AND_STEROID_SEQUENCE;
    const worker = new InProcessWorker(); let finishes = 0; let decisions = 0;
    const advance = { current: undefined as (() => void) | undefined };
    const pausedWaits = new Set<string>();
    function MyxedemaHarness() {
      const session = useSession();
      const demonstration = useMyxedemaDemonstration({ active: true, running: session.transport === 'running',
        patient: session.equipment?.resuscitation.myxedema, act: session.act,
        pause: session.pause, play: session.play, onFinished: () => { finishes += 1; },
      });
      advance.current = demonstration.onAdvance;
      return null;
    }
    try {
      act(() => {
        useSession.getState().begin({ scenarioId: scenario.metadata.id, scenarioVersion: scenario.metadata.version,
          contentVersion: scenario.metadata.version, modelSetRevision: MODEL_SET_REVISION, engineVersion: ENGINE_VERSION,
          practiceRegion: 'US', seed: 4904, scenario,
        }, () => worker as unknown as Worker, { engine: ENGINE_VERSION, content: scenario.metadata.version,
          modelSet: MODEL_SET_REVISION, scenario: scenario.metadata.version }, 'endocrine-metabolic');
        exampleRoot.render(createElement(MyxedemaHarness));
        useSession.getState().setSpeed(60); useSession.getState().play();
      });
      for (let batch = 0; batch < 1000 && !useSession.getState().equipment?.resuscitation.myxedema?.ended; batch += 1) {
        if (advance.current) { advancePausedDecision(advance.current, worker); decisions += 1; }
        const patient = useSession.getState().equipment?.resuscitation.myxedema;
        const wait = patient && patient.supportActive && patient.ventilationDueInSeconds !== null
          && patient.ventilationDueInSeconds > 0 ? 'respiratory-support'
          : patient && patient.respiratorySupportObserved && patient.responseDueInSeconds !== null
            && patient.responseDueInSeconds > 0 ? 'partial-support' : null;
        if (wait && !pausedWaits.has(wait)) {
          pausedWaits.add(wait);
          expect(advance.current).toBeUndefined();
          expect(useSession.getState().transport).toBe('running');
          if (wait === 'partial-support') expect(patient).toMatchObject({ responseObserved: false,
            observation: { respiratoryRateBpm: 12, spo2Percent: 94, paco2MmHg: 54, coreTemperatureC: 34 } });
          act(() => useSession.getState().pause());
          const tick = useSession.getState().tick; const count = worker.applied.length;
          act(() => { for (let frame = 0; frame < 60; frame += 1) useSession.getState().frame(frame % 2 ? 1000 / 60 : 1000); });
          expect(useSession.getState().tick).toBe(tick);
          expect(useSession.getState().equipment?.resuscitation.myxedema).toEqual(patient);
          expect(worker.applied).toHaveLength(count);
          expect(advance.current).toBeUndefined();
          act(() => useSession.getState().play());
        }
        act(() => { for (let frame = 0; frame < 6; frame += 1) useSession.getState().frame(1000 / 60); });
      }
      expect(finishes).toBe(1); expect(decisions).toBe(8);
      expect(pausedWaits).toEqual(new Set(['respiratory-support', 'partial-support']));
      expect(useSession.getState().transport).toBe('paused');
      expect(worker.applied).toEqual([
        'ventilate', 'hydrocortisone', 'levothyroxine', 'supportive-care', 'call-support', 'reassess', 'reassess', 'handoff',
      ].map((action) => ({ type: 'myxedema-response', payload: { action } })));
      expect(useSession.getState().equipment?.resuscitation.myxedema).toMatchObject({
        ended: 'handoff', respiratorySupportObserved: true, responseObserved: true, ventilationDelayed: false,
        endocrineTreatmentDelayed: false, oxygenOnlyAtTick: null, earlyThyroxineAttempted: false,
        waitForLabsChosen: false, rapidRewarmingAttempted: false, durableRecoveryProven: false,
        observation: { heartRateBpm: 46, coreTemperatureC: 34.2, paco2MmHg: 54, alertness: 'still drowsy and support-dependent' },
      });
      const transcript = sessionInternals().recorder!.build('pending');
      const actions = transcript.actions.filter((action) => action.type === 'myxedema-response');
      const ventilation = actions.find((action) => action.payload.action === 'ventilate')!;
      const steroid = actions.find((action) => action.payload.action === 'hydrocortisone')!;
      const thyroxine = actions.find((action) => action.payload.action === 'levothyroxine')!;
      const packageAt = Math.max(...actions.filter((action) => ['ventilate', 'hydrocortisone', 'levothyroxine', 'supportive-care', 'call-support']
        .includes(action.payload.action as string)).map((action) => action.tick));
      const reassessments = actions.filter((action) => action.payload.action === 'reassess');
      expect(steroid.tick).toBeLessThanOrEqual(thyroxine.tick);
      expect(reassessments).toHaveLength(2);
      expect(reassessments[0]!.tick - ventilation.tick).toBeGreaterThanOrEqual(MYXEDEMA_VENTILATION_TICKS);
      expect(reassessments[0]!.tick).toBeLessThan(packageAt + MYXEDEMA_RESPONSE_TICKS);
      expect(reassessments[1]!.tick - packageAt).toBeGreaterThanOrEqual(MYXEDEMA_RESPONSE_TICKS);
      const replay = new AnesthesiaEngine({ scenario, seed: 4904, practiceRegion: 'US' });
      let last;
      for (let tick = 0; tick < useSession.getState().tick; tick += 1) {
        for (const action of transcript.actions) if (action.tick === tick) replay.apply(action);
        last = replay.step();
      }
      expect(last?.state).toEqual(useSession.getState().state);
      expect(replay.equipment().resuscitation.myxedema).toEqual(useSession.getState().equipment?.resuscitation.myxedema);
      const endedTick = useSession.getState().tick;
      act(() => { exampleRoot.render(createElement(MyxedemaHarness)); useSession.getState().frame(1000); });
      expect(finishes).toBe(1); expect(worker.applied).toHaveLength(8);
      expect(advance.current).toBeUndefined(); expect(useSession.getState().tick).toBe(endedTick);
    } finally { act(() => exampleRoot.unmount()); exampleContainer.remove(); }
  // The authored hour is run once through the real session and once as replay.
  }, 60_000);

  it('runs the hypercalcemia example through distinct volume and calcium waits and replays its real transcript', () => {
    // This test must also run alone without the induction fixture owning the store.
    act(() => root.unmount());
    const exampleContainer = document.createElement('div'); document.body.appendChild(exampleContainer);
    const exampleRoot = createRoot(exampleContainer); const scenario = HYPERCALCEMIC_CRISIS_VOLUME_AND_BRIDGE;
    const worker = new InProcessWorker(); let finishes = 0; let decisions = 0;
    const advance = { current: undefined as (() => void) | undefined };
    const pausedWaits = new Set<string>();
    function HypercalcemiaHarness() {
      const session = useSession();
      const demonstration = useHypercalcemiaDemonstration({ active: true, running: session.transport === 'running',
        patient: session.equipment?.resuscitation.hypercalcemia, act: session.act,
        pause: session.pause, play: session.play, onFinished: () => { finishes += 1; },
      });
      advance.current = demonstration.onAdvance;
      return null;
    }
    try {
      act(() => {
        useSession.getState().begin({ scenarioId: scenario.metadata.id, scenarioVersion: scenario.metadata.version,
          contentVersion: scenario.metadata.version, modelSetRevision: MODEL_SET_REVISION, engineVersion: ENGINE_VERSION,
          practiceRegion: 'US', seed: 4905, scenario,
        }, () => worker as unknown as Worker, { engine: ENGINE_VERSION, content: scenario.metadata.version,
          modelSet: MODEL_SET_REVISION, scenario: scenario.metadata.version }, 'endocrine-metabolic');
        exampleRoot.render(createElement(HypercalcemiaHarness));
        useSession.getState().setSpeed(60); useSession.getState().play();
      });
      for (let batch = 0; batch < 3000 && !useSession.getState().equipment?.resuscitation.hypercalcemia?.ended; batch += 1) {
        if (advance.current) { advancePausedDecision(advance.current, worker); decisions += 1; }
        const patient = useSession.getState().equipment?.resuscitation.hypercalcemia;
        const wait = patient && patient.supportActive && patient.fluidDueInSeconds !== null
          && patient.fluidDueInSeconds > 0 ? 'fluid-support'
          : patient && patient.fluidResponseObserved && patient.bridgeDueInSeconds !== null
            && patient.bridgeDueInSeconds > 0 ? 'calcium-bridge' : null;
        if (wait && !pausedWaits.has(wait)) {
          pausedWaits.add(wait);
          expect(advance.current).toBeUndefined();
          expect(useSession.getState().transport).toBe('running');
          if (wait === 'calcium-bridge') expect(patient).toMatchObject({ bridgeResponseObserved: false,
            observation: { heartRateBpm: 96, adjustedCalciumMgDl: 16.4, coreTemperatureC: 36.8 } });
          act(() => useSession.getState().pause());
          const tick = useSession.getState().tick; const count = worker.applied.length;
          act(() => { for (let frame = 0; frame < 60; frame += 1) useSession.getState().frame(frame % 2 ? 1000 / 60 : 1000); });
          expect(useSession.getState().tick).toBe(tick);
          expect(useSession.getState().equipment?.resuscitation.hypercalcemia).toEqual(patient);
          expect(worker.applied).toHaveLength(count);
          expect(advance.current).toBeUndefined();
          act(() => useSession.getState().play());
        }
        act(() => { for (let frame = 0; frame < 6; frame += 1) useSession.getState().frame(1000 / 60); });
      }
      expect(finishes).toBe(1); expect(decisions).toBe(8);
      expect(pausedWaits).toEqual(new Set(['fluid-support', 'calcium-bridge']));
      expect(useSession.getState().transport).toBe('paused');
      expect(worker.applied).toEqual([
        'tailored-fluids', 'calcitonin', 'assess-cardiorenal', 'antiresorptive', 'call-support', 'reassess', 'reassess', 'handoff',
      ].map((action) => ({ type: 'hypercalcemia-response', payload: { action } })));
      expect(useSession.getState().equipment?.resuscitation.hypercalcemia).toMatchObject({
        ended: 'handoff', fluidResponseObserved: true, bridgeResponseObserved: true, urgentTreatmentDelayed: false,
        unrestrictedFluidsAttempted: false, routineDiureticAttempted: false, waitForCauseChosen: false,
        durableRecoveryProven: false, observation: { heartRateBpm: 96, coreTemperatureC: 36.8, adjustedCalciumMgDl: 14.8 },
      });
      const transcript = sessionInternals().recorder!.build('pending');
      const actions = transcript.actions.filter((action) => action.type === 'hypercalcemia-response');
      const fluids = actions.find((action) => action.payload.action === 'tailored-fluids')!;
      const bridge = actions.find((action) => action.payload.action === 'calcitonin')!;
      const renal = actions.find((action) => action.payload.action === 'assess-cardiorenal')!;
      const antiresorptive = actions.find((action) => action.payload.action === 'antiresorptive')!;
      const reassessments = actions.filter((action) => action.payload.action === 'reassess');
      expect(renal.tick).toBeLessThanOrEqual(antiresorptive.tick);
      expect(reassessments).toHaveLength(2);
      expect(reassessments[0]!.tick - fluids.tick).toBeGreaterThanOrEqual(HYPERCALCEMIA_FLUID_RESPONSE_TICKS);
      expect(reassessments[0]!.tick).toBeLessThan(bridge.tick + HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS);
      expect(reassessments[1]!.tick - bridge.tick).toBeGreaterThanOrEqual(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS);
      const replay = new AnesthesiaEngine({ scenario, seed: 4905, practiceRegion: 'US' });
      let last;
      for (let tick = 0; tick < useSession.getState().tick; tick += 1) {
        for (const action of transcript.actions) if (action.tick === tick) replay.apply(action);
        last = replay.step();
      }
      expect(last?.state).toEqual(useSession.getState().state);
      expect(replay.equipment().resuscitation.hypercalcemia).toEqual(useSession.getState().equipment?.resuscitation.hypercalcemia);
      const endedTick = useSession.getState().tick;
      act(() => { exampleRoot.render(createElement(HypercalcemiaHarness)); useSession.getState().frame(1000); });
      expect(finishes).toBe(1); expect(worker.applied).toHaveLength(8);
      expect(advance.current).toBeUndefined(); expect(useSession.getState().tick).toBe(endedTick);
    } finally { act(() => exampleRoot.unmount()); exampleContainer.remove(); }
  // The authored four hours is run once through the real session and once as replay.
  });

  it('runs the hypocalcemia example through distinct rescue and continuing-care waits and replays its real transcript', () => {
    // This test must also run alone without the induction fixture owning the store.
    act(() => root.unmount());
    const exampleContainer = document.createElement('div'); document.body.appendChild(exampleContainer);
    const exampleRoot = createRoot(exampleContainer); const scenario = HYPOCALCEMIC_TETANY_RESCUE_AND_RECURRENCE;
    const worker = new InProcessWorker(); let finishes = 0; let decisions = 0;
    const advance = { current: undefined as (() => void) | undefined };
    const pausedWaits = new Set<string>();
    function HypocalcemiaHarness() {
      const session = useSession();
      const demonstration = useHypocalcemiaDemonstration({ active: true, running: session.transport === 'running',
        patient: session.equipment?.resuscitation.hypocalcemia, act: session.act,
        pause: session.pause, play: session.play, onFinished: () => { finishes += 1; },
      });
      advance.current = demonstration.onAdvance;
      return null;
    }
    try {
      act(() => {
        useSession.getState().begin({ scenarioId: scenario.metadata.id, scenarioVersion: scenario.metadata.version,
          contentVersion: scenario.metadata.version, modelSetRevision: MODEL_SET_REVISION, engineVersion: ENGINE_VERSION,
          practiceRegion: 'US', seed: 4906, scenario,
        }, () => worker as unknown as Worker, { engine: ENGINE_VERSION, content: scenario.metadata.version,
          modelSet: MODEL_SET_REVISION, scenario: scenario.metadata.version }, 'endocrine-metabolic');
        exampleRoot.render(createElement(HypocalcemiaHarness));
        useSession.getState().setSpeed(60); useSession.getState().play();
      });
      for (let batch = 0; batch < 3000 && !useSession.getState().equipment?.resuscitation.hypocalcemia?.ended; batch += 1) {
        if (advance.current) { advancePausedDecision(advance.current, worker); decisions += 1; }
        const patient = useSession.getState().equipment?.resuscitation.hypocalcemia;
        const wait = patient && patient.supportActive && patient.calciumDueInSeconds !== null
          && patient.calciumDueInSeconds > 0 ? 'early-relief'
          : patient && patient.calciumResponseObserved && patient.responseDueInSeconds !== null
            && patient.responseDueInSeconds > 0 ? 'continuing-care' : null;
        if (wait && !pausedWaits.has(wait)) {
          pausedWaits.add(wait);
          expect(advance.current).toBeUndefined();
          expect(useSession.getState().transport).toBe('running');
          if (wait === 'continuing-care') expect(patient).toMatchObject({ responseObserved: false,
            observation: { heartRateBpm: 90, adjustedCalciumMgDl: 7, coreTemperatureC: 36.8 } });
          act(() => useSession.getState().pause());
          const tick = useSession.getState().tick; const count = worker.applied.length;
          act(() => { for (let frame = 0; frame < 60; frame += 1) useSession.getState().frame(frame % 2 ? 1000 / 60 : 1000); });
          expect(useSession.getState().tick).toBe(tick);
          expect(useSession.getState().equipment?.resuscitation.hypocalcemia).toEqual(patient);
          expect(worker.applied).toHaveLength(count);
          expect(advance.current).toBeUndefined();
          act(() => useSession.getState().play());
        }
        act(() => { for (let frame = 0; frame < 6; frame += 1) useSession.getState().frame(1000 / 60); });
      }
      expect(finishes).toBe(1); expect(decisions).toBe(9);
      expect(pausedWaits).toEqual(new Set(['early-relief', 'continuing-care']));
      expect(useSession.getState().transport).toBe('paused');
      expect(worker.applied).toEqual([
        'calcium-rescue', 'assess-risk', 'review-cause', 'magnesium', 'continuing-care', 'call-support', 'reassess', 'reassess', 'handoff',
      ].map((action) => ({ type: 'hypocalcemia-response', payload: { action } })));
      expect(useSession.getState().equipment?.resuscitation.hypocalcemia).toMatchObject({
        ended: 'handoff', calciumResponseObserved: true, responseObserved: true, urgentTreatmentDelayed: false,
        oralOnlyChosen: false, waitForLabsChosen: false, waitForMagnesiumChosen: false, recurrenceOccurred: false, stopAfterReliefAttempted: false,
        durableRecoveryProven: false, observation: { heartRateBpm: 86, coreTemperatureC: 36.8, adjustedCalciumMgDl: 7.2 },
      });
      const transcript = sessionInternals().recorder!.build('pending');
      const actions = transcript.actions.filter((action) => action.type === 'hypocalcemia-response');
      const rescue = actions.find((action) => action.payload.action === 'calcium-rescue')!;
      const cause = actions.find((action) => action.payload.action === 'review-cause')!;
      const magnesium = actions.find((action) => action.payload.action === 'magnesium')!;
      const continuing = actions.find((action) => action.payload.action === 'continuing-care')!;
      const support = actions.find((action) => action.payload.action === 'call-support')!;
      const reassessments = actions.filter((action) => action.payload.action === 'reassess');
      expect(rescue.tick).toBeLessThan(cause.tick);
      expect(cause.tick).toBeLessThanOrEqual(magnesium.tick);
      expect(cause.tick).toBeLessThanOrEqual(continuing.tick);
      expect(reassessments).toHaveLength(2);
      expect(reassessments[0]!.tick - rescue.tick).toBeGreaterThanOrEqual(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS);
      expect(reassessments[0]!.tick).toBeLessThan(support.tick + HYPOCALCEMIA_RESPONSE_TICKS);
      expect(reassessments[1]!.tick - support.tick).toBeGreaterThanOrEqual(HYPOCALCEMIA_RESPONSE_TICKS);
      const replay = new AnesthesiaEngine({ scenario, seed: 4906, practiceRegion: 'US' });
      let last;
      for (let tick = 0; tick < useSession.getState().tick; tick += 1) {
        for (const action of transcript.actions) if (action.tick === tick) replay.apply(action);
        last = replay.step();
      }
      expect(last?.state).toEqual(useSession.getState().state);
      expect(replay.equipment().resuscitation.hypocalcemia).toEqual(useSession.getState().equipment?.resuscitation.hypocalcemia);
      const endedTick = useSession.getState().tick;
      act(() => { exampleRoot.render(createElement(HypocalcemiaHarness)); useSession.getState().frame(1000); });
      expect(finishes).toBe(1); expect(worker.applied).toHaveLength(9);
      expect(advance.current).toBeUndefined(); expect(useSession.getState().tick).toBe(endedTick);
    } finally { act(() => exampleRoot.unmount()); exampleContainer.remove(); }
  // The authored complete-care hour is run once through the real session and once as replay.
  });

  it('invalidates a pending adrenal decision when the learner takes over the session', () => {
    const exampleContainer = document.createElement('div'); document.body.appendChild(exampleContainer);
    const exampleRoot = createRoot(exampleContainer); const scenario = ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS;
    const worker = new InProcessWorker(); let finishes = 0;
    const advance = { current: undefined as (() => void) | undefined };
    function AdrenalHarness({ active }: { active: boolean }) {
      const session = useSession();
      const demonstration = useAdrenalDemonstration({ active, running: session.transport === 'running',
        patient: session.equipment?.resuscitation.adrenalCrisis, act: session.act,
        pause: session.pause, play: session.play, onFinished: () => { finishes += 1; },
      });
      advance.current = demonstration.onAdvance;
      return null;
    }
    try {
      act(() => {
        useSession.getState().begin({ scenarioId: scenario.metadata.id, scenarioVersion: scenario.metadata.version,
          contentVersion: scenario.metadata.version, modelSetRevision: MODEL_SET_REVISION, engineVersion: ENGINE_VERSION,
          practiceRegion: 'US', seed: 4902, scenario,
        }, () => worker as unknown as Worker, { engine: ENGINE_VERSION, content: scenario.metadata.version,
          modelSet: MODEL_SET_REVISION, scenario: scenario.metadata.version }, 'endocrine-metabolic');
        exampleRoot.render(createElement(AdrenalHarness, { active: true }));
        useSession.getState().setSpeed(60); useSession.getState().play();
      });
      for (let batch = 0; batch < 20 && worker.applied.length < 2; batch += 1) {
        if (advance.current) advancePausedDecision(advance.current, worker);
        act(() => { for (let frame = 0; frame < 6; frame += 1) useSession.getState().frame(1000 / 60); });
      }
      expect(worker.applied.map((action) => action.payload.action)).toEqual(['hydrocortisone', 'saline']);
      expect(useSession.getState().transport).toBe('paused');
      const pendingAdvance = advance.current;
      expect(pendingAdvance).toBeTypeOf('function');
      const takeoverTick = useSession.getState().tick; const takeoverPatient = useSession.getState().equipment?.resuscitation.adrenalCrisis;
      act(() => exampleRoot.render(createElement(AdrenalHarness, { active: false })));
      expect(advance.current).toBeUndefined();
      act(() => pendingAdvance?.());
      expect(worker.applied).toHaveLength(2);
      expect(useSession.getState().transport).toBe('paused');
      expect(useSession.getState().tick).toBe(takeoverTick);
      expect(useSession.getState().equipment?.resuscitation.adrenalCrisis).toEqual(takeoverPatient);
      act(() => useSession.getState().play());
      for (let batch = 0; batch < 110; batch += 1) {
        act(() => { for (let frame = 0; frame < 6; frame += 1) useSession.getState().frame(1000 / 60); });
      }
      expect(useSession.getState().tick - takeoverTick).toBeGreaterThan(10 * 60 * TICKS_PER_SECOND);
      expect(useSession.getState().transport).toBe('running');
      expect(worker.applied).toHaveLength(2); expect(finishes).toBe(0);
      expect(useSession.getState().equipment?.resuscitation.adrenalCrisis).toMatchObject({
        responseDueInSeconds: null, responseObserved: false, preventionPlanned: false, ended: null,
      });
    } finally { act(() => exampleRoot.unmount()); exampleContainer.remove(); }
  });
});

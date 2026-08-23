/**
 * @vitest-environment jsdom
 *
 * The end-to-end path: a learner action reaches the engine, the engine's state
 * message reaches the store, and the values the interface reads come out right.
 *
 * The worker is stubbed with an in-process double that speaks the SAME protocol
 * and runs the SAME engine, so what is exercised is the real message shape, the
 * real solver, and the real store — everything except the thread boundary.
 */
import { describe, expect, it } from 'vitest';
import {
  WORKER_PROTOCOL_VERSION, assertProtocolVersion,
  type FromWorkerMessage, type StateMessage, type ToWorkerMessage,
} from '@platform/kernel/protocol';
import { AnesthesiaEngine, ENGINE_VERSION, type Scenario } from '@anesthesia/engine';
import { MODEL_SET_REVISION } from '@anesthesia/pharmacology/registry';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { useSession, sessionInternals } from '@platform/session/session-store';
import type { PatientState } from '@anesthesia/physiology';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';

/**
 * An in-process stand-in for the solver worker. It is deliberately a faithful
 * copy of `solver.worker.ts`'s message handling rather than a mock that returns
 * canned data: a mock would pass while the real protocol was broken.
 */
class InProcessWorker implements Partial<Worker> {
  onmessage: ((event: MessageEvent<FromWorkerMessage<PatientState>>) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  private engine: AnesthesiaEngine | null = null;
  terminated = false;
  /** Raised when a message arrives with the wrong protocol version. */
  rejected: string[] = [];

  postMessage(message: ToWorkerMessage): void {
    if (this.terminated) return;
    try {
      assertProtocolVersion(message);
    } catch (error) {
      this.rejected.push((error as Error).message);
      return;
    }
    switch (message.type) {
      case 'init': {
        expect(validateScenario(message.scenario)).toEqual([]);
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
      }
      case 'action':
        this.engine?.apply(message.action);
        break;
      case 'advance': {
        if (!this.engine) return;
        let last = this.engine.step();
        const events = [...last.events];
        // The batch carries every tick's samples, exactly as the shipping worker
        // does. See tests/unit/solver-worker.test.ts, which drives the real one.
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
        const state: StateMessage<PatientState> = {
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
        };
        this.emit(state);
        break;
      }
      case 'reset':
        this.engine = null;
        break;
      default:
        break;
    }
  }

  terminate(): void { this.terminated = true; }

  private emit(message: FromWorkerMessage<PatientState>): void {
    this.onmessage?.({ data: message } as MessageEvent<FromWorkerMessage<PatientState>>);
  }
}

const workers: InProcessWorker[] = [];
const createWorker = (): Worker => {
  const worker = new InProcessWorker();
  workers.push(worker);
  return worker as unknown as Worker;
};

function begin(): void {
  workers.length = 0;
  useSession.getState().begin(
    {
      scenarioId: ROUTINE_INDUCTION.metadata.id,
      scenarioVersion: ROUTINE_INDUCTION.metadata.version,
      contentVersion: ROUTINE_INDUCTION.metadata.version,
      modelSetRevision: MODEL_SET_REVISION,
      engineVersion: ENGINE_VERSION,
      practiceRegion: 'GB',
      seed: 20260819,
      scenario: ROUTINE_INDUCTION,
    },
    createWorker,
    {
      engine: ENGINE_VERSION, content: ROUTINE_INDUCTION.metadata.version,
      modelSet: MODEL_SET_REVISION, scenario: ROUTINE_INDUCTION.metadata.version,
    },
    'anesthesia',
  );
}

/** Drive `seconds` of wall-clock time through the animation-frame path. */
function runFrames(seconds: number, frameMs = 1000 / 60): void {
  const session = useSession.getState();
  const frames = Math.round((seconds * 1000) / frameMs);
  for (let i = 0; i < frames; i += 1) session.frame(frameMs);
}

describe('The worker protocol, the store, and the interface values', () => {
  it('reports ready, then delivers state once the transport is running', () => {
    begin();
    expect(useSession.getState().ready).toBe(true);
    expect(useSession.getState().phase).toBe('briefing');
    // Nothing advances until the learner presses play.
    runFrames(2);
    expect(useSession.getState().tick).toBe(0);
    expect(useSession.getState().state).toBeNull();

    useSession.getState().play();
    runFrames(2);
    const session = useSession.getState();
    expect(session.tick).toBeGreaterThan(0);
    expect(session.state).not.toBeNull();
    expect(session.state!.heartRateBpm).toBeGreaterThan(40);
    expect(session.state!.meanArterialMmHg).toBeGreaterThan(50);
    expect(session.elapsed).toMatch(/^00:00:0\d$/);
  });

  it('carries a full waveform frame for every signal', () => {
    begin();
    useSession.getState().play();
    runFrames(1);
    const blocks = useSession.getState().waveformBlocks;
    expect(blocks.map((block) => block.trackId).sort()).toEqual(['arterial', 'capno', 'ecg', 'pleth']);
    for (const block of blocks) {
      expect(block.samples.length).toBeGreaterThan(0);
      expect(block.samples.some((value) => value !== 0)).toBe(true);
    }
  });

  it('applies a learner action and the physiology follows it', () => {
    begin();
    useSession.getState().play();
    runFrames(3);
    const before = useSession.getState().state!.meanArterialMmHg!;

    useSession.getState().act({
      type: 'bolus', payload: { drugId: 'propofol', amount: 140, unit: 'mg' },
    });
    useSession.getState().act({
      type: 'ventilator', payload: { delivering: true, mode: 'volume-control', fio2: 0.5 },
    });
    runFrames(90);

    const after = useSession.getState();
    expect(after.state!.meanArterialMmHg).toBeLessThan(before * 0.9);
    expect(after.state!.depthIndex).toBeLessThan(70);
    // The concentration panel has something to draw.
    const propofol = after.concentrations.find((entry) => entry.drugId === 'propofol');
    expect(propofol!.plasma).toBeGreaterThan(0);
    expect(propofol!.effectSite).toBeGreaterThan(0);
    expect(propofol!.modelId).toBe('propofol-eleveld-2018');
    // The log recorded the dose, and the history has samples for the plot.
    expect(after.log.some((entry) => entry.message.includes('propofol'))).toBe(true);
    expect(after.history.length).toBeGreaterThan(30);
    // Attribution reached the store, so the Why panel has something to rank.
    expect(after.attribution.some((entry) => entry.variable === 'meanArterialMmHg')).toBe(true);
  });

  it('raises an alarm the interface can render, and silences it on request', () => {
    begin();
    useSession.getState().play();
    // Induce without ventilating: the saturation falls and the alarm fires.
    useSession.getState().act({
      type: 'bolus', payload: { drugId: 'propofol', amount: 180, unit: 'mg' },
    });
    runFrames(240);
    const alarms = useSession.getState().alarms;
    expect(alarms.length).toBeGreaterThan(0);
    const alarm = alarms[0]!;
    expect(alarm.message.length).toBeGreaterThan(10);
    expect(['high', 'medium', 'low']).toContain(alarm.priority);

    useSession.getState().act({ type: 'silence-alarm', payload: { alarmId: alarm.alarmId } });
    runFrames(2);
    const silenced = useSession.getState().alarms.find((entry) => entry.alarmId === alarm.alarmId);
    if (silenced) expect(silenced.silencedUntilTick).not.toBeNull();
  });

  it('Scenario: Speed change does not alter the trajectory', () => {
    const runAt = (speed: 1 | 60) => {
      begin();
      useSession.getState().setSpeed(speed);
      useSession.getState().play();
      useSession.getState().act({
        type: 'bolus', payload: { drugId: 'propofol', amount: 140, unit: 'mg' },
      });
      // Sixty simulated seconds, however long that takes in wall-clock time.
      runFrames(60 / speed);
      const session = useSession.getState();
      return { tick: session.tick, state: session.state! };
    };
    const slow = runAt(1);
    const fast = runAt(60);
    expect(fast.tick).toBe(slow.tick);
    for (const key of ['meanArterialMmHg', 'spo2Percent', 'depthIndex', 'heartRateBpm'] as const) {
      expect(Math.abs((fast.state[key] ?? 0) - (slow.state[key] ?? 0)), key).toBeLessThan(1e-9);
    }
  });

  it('Scenario: Doses queued while paused apply at the resumed tick', () => {
    begin();
    useSession.getState().play();
    runFrames(5);
    useSession.getState().pause();
    const pausedTick = useSession.getState().tick;

    useSession.getState().act({
      type: 'bolus', payload: { drugId: 'propofol', amount: 120, unit: 'mg' },
    });
    // The clock does not move while paused.
    runFrames(5);
    expect(useSession.getState().tick).toBe(pausedTick);

    useSession.getState().play();
    runFrames(30);
    const entry = useSession.getState().log.find((event) => event.eventId.startsWith('bolus-propofol'));
    expect(entry?.tick).toBe(pausedTick);
    expect(useSession.getState().state!.depthIndex).toBeLessThan(90);
  });

  it('Scenario: Backgrounded tab does not skip ahead', () => {
    begin();
    useSession.getState().play();
    // Ten minutes of wall-clock time arriving in one frame, as a hidden tab does.
    useSession.getState().frame(10 * 60 * 1000);
    expect(useSession.getState().tick).toBeLessThanOrEqual(5 * TICKS_PER_SECOND);
    expect(useSession.getState().catchUpNotice).toBe(true);
    expect(useSession.getState().transport).toBe('paused');
  });

  it('Scenario: Reset requires confirmation and clears state', () => {
    begin();
    useSession.getState().play();
    useSession.getState().act({
      type: 'bolus', payload: { drugId: 'propofol', amount: 140, unit: 'mg' },
    });
    runFrames(20);
    expect(useSession.getState().log.length).toBeGreaterThan(0);

    useSession.getState().resetSession();
    const session = useSession.getState();
    expect(session.tick).toBe(0);
    expect(session.log).toHaveLength(0);
    expect(session.history).toHaveLength(0);
    expect(session.state).toBeNull();
    expect(session.transport).toBe('idle');
  });

  it('Scenario: Worker failure degrades safely', async () => {
    begin();
    useSession.getState().play();
    useSession.getState().act({
      type: 'bolus', payload: { drugId: 'propofol', amount: 140, unit: 'mg' },
    });
    runFrames(20);

    // The worker dies.
    workers[workers.length - 1]!.onerror?.({});
    const dead = useSession.getState();
    expect(dead.phase).toBe('worker-lost');
    expect(dead.transport).toBe('paused');
    // The transcript is preserved, with the action still in it.
    const transcript = await useSession.getState().exportTranscript();
    expect(transcript.actions.some((action) => action.type === 'bolus')).toBe(true);

    // And a resume replays it into a fresh worker.
    const before = workers.length;
    useSession.getState().resumeAfterWorkerLoss();
    expect(workers.length).toBeGreaterThan(before);
    expect(useSession.getState().phase).toBe('running');
  });

  it('rejects a message from an incompatible protocol version rather than guessing', () => {
    begin();
    const worker = workers[workers.length - 1]!;
    worker.postMessage({ v: 999, type: 'advance', ticks: 1 } as unknown as ToWorkerMessage);
    expect(worker.rejected[0]).toContain('protocol mismatch');
  });

  it('records the transcript the debrief and the export both read', async () => {
    begin();
    useSession.getState().play();
    useSession.getState().act({
      type: 'bolus', payload: { drugId: 'propofol', amount: 140, unit: 'mg' },
    });
    runFrames(30);
    const transcript = await useSession.getState().exportTranscript();
    expect(transcript.practiceRegion).toBe('GB');
    expect(transcript.seed).toBe(20260819);
    expect(transcript.versions.engine).toBe(ENGINE_VERSION);
    expect(transcript.stateTraceHash).toMatch(/^[0-9a-f]{64}$/);
    expect(sessionInternals().clock.tick).toBe(transcript.ticks);
  });
});

describe('Requirement: The Action Region Reflects The Patient', () => {
  // A control that shows what the learner asked for rather than what the engine
  // did teaches them to trust a number that is not true. Every one of these
  // values used to be a hard-coded prop.
  it('Scenario: the ventilator the tray shows is the ventilator the engine holds', () => {
    begin();
    useSession.getState().play();
    runFrames(1);
    const before = useSession.getState().equipment;
    expect(before?.ventilator.fio2).toBeCloseTo(0.21, 5);

    useSession.getState().act({ type: 'ventilator', payload: { fio2: 1, delivering: true, mode: 'volume-control' } });
    runFrames(1);
    const after = useSession.getState().equipment;
    expect(after?.ventilator.fio2).toBeCloseTo(1, 5);
    expect(after?.ventilator.delivering).toBe(true);
    expect(after?.ventilator.mode).toBe('volume-control');
  });

  it('Scenario: a refused setting is reported as refused, not as accepted', () => {
    // The hypoxic guard forbids an inspired oxygen fraction below room air. The
    // tray must show 0.21, not the value that was asked for.
    begin();
    useSession.getState().play();
    runFrames(1);
    useSession.getState().act({ type: 'ventilator', payload: { fio2: 0.1 } });
    runFrames(1);
    expect(useSession.getState().equipment?.ventilator.fio2).toBeCloseTo(0.21, 5);
  });

  it('Scenario: an airway attempt consumes simulated time before reporting its outcome', () => {
    begin();
    useSession.getState().play();
    runFrames(1);
    expect(useSession.getState().equipment?.airway.attempts).toBe(0);
    expect(useSession.getState().equipment?.airway.lastGrade).toBeNull();

    useSession.getState().act({ type: 'laryngoscopy', payload: { technique: 'video' } });
    runFrames(1);
    const during = useSession.getState().equipment?.airway;
    expect(during?.attempts).toBe(1);
    expect(during?.attemptInProgress).toBe(true);
    expect(during?.lastGrade).toBeNull();

    // Even the longest modelled attempt is complete after 70 simulated seconds.
    runFrames(70);
    const airway = useSession.getState().equipment?.airway;
    expect(airway?.attemptInProgress).toBe(false);
    expect(airway?.lastGrade).toBeGreaterThanOrEqual(1);
    expect(airway?.lastGrade).toBeLessThanOrEqual(4);
    // A grade 1 or 2 view intubates; a grade 3 or 4 does not. Either is a valid
    // outcome, but the two must agree with each other.
    expect(airway?.intubated).toBe((airway?.lastGrade ?? 4) <= 2);
  });

  it('Scenario: a bolus empties the syringe it came from', () => {
    begin();
    useSession.getState().play();
    runFrames(1);
    const before = useSession.getState().equipment?.drugs.find((drug) => drug.drugId === 'propofol');
    expect(before?.syringeRemainingMl).toBeGreaterThan(0);

    useSession.getState().act({ type: 'bolus', payload: { drugId: 'propofol', amount: 100, unit: 'mg' } });
    runFrames(1);
    const after = useSession.getState().equipment?.drugs.find((drug) => drug.drugId === 'propofol');
    expect(after!.syringeRemainingMl).toBeLessThan(before!.syringeRemainingMl);
  });

  it('Scenario: a running infusion is reported with its rate, and stopping clears it', () => {
    begin();
    useSession.getState().play();
    runFrames(1);
    expect(useSession.getState().equipment?.drugs.every((drug) => drug.infusionRate === 0)).toBe(true);

    useSession.getState().act({ type: 'infusion', payload: { drugId: 'remifentanil', rate: 0.2, unit: 'µg/kg/min' } });
    runFrames(2);
    const running = useSession.getState().equipment?.drugs.find((drug) => drug.drugId === 'remifentanil');
    expect(running?.infusionRate).toBeGreaterThan(0);
    expect(running?.infusionSinceTick).not.toBeNull();

    useSession.getState().act({ type: 'infusion', payload: { drugId: 'remifentanil', rate: 0, unit: 'µg/kg/min' } });
    runFrames(1);
    const stopped = useSession.getState().equipment?.drugs.find((drug) => drug.drugId === 'remifentanil');
    expect(stopped?.infusionRate).toBe(0);
    expect(stopped?.infusionSinceTick).toBeNull();
  });
});

describe('Requirement: The Debrief Judges What The Engine Counted', () => {
  it('Scenario: preoxygenation time comes from the engine, not from the interface', () => {
    // The debrief marks the preoxygenation objective on this number. Hard-coding
    // it tells a learner who DID preoxygenate that they did not, which is worse
    // than saying nothing.
    begin();
    useSession.getState().play();
    runFrames(1);
    expect(useSession.getState().equipment?.preoxygenationSeconds).toBe(0);

    useSession.getState().act({ type: 'ventilator', payload: { fio2: 1, delivering: true, mode: 'volume-control' } });
    // Turning the oxygen up does not count as preoxygenation. Washing the
    // nitrogen out does, and that takes time.
    runFrames(10);
    expect(useSession.getState().equipment!.preoxygenationSeconds).toBe(0);
    expect(useSession.getState().state!.endTidalO2Fraction).toBeGreaterThan(0.21);

    runFrames(170);
    const state = useSession.getState();
    expect(state.state!.endTidalO2Fraction, 'end-tidal oxygen after three minutes')
      .toBeGreaterThan(0.9);
    expect(state.equipment!.preoxygenationSeconds, 'counted preoxygenation')
      .toBeGreaterThan(30);
  });
});

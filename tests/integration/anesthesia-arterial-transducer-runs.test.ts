/**
 * Reference transcripts for the arterial-transducer lesson, replayed through the
 * real engine and scored by the real debrief.
 *
 * The premise this file asserts is that the true mean arterial pressure is 78
 * mmHg at every tick of every transcript — including the one that gives a litre
 * of crystalloid for a displayed 63. The display was wrong and the patient never
 * was; the 15 mmHg gap is a 20 cm column of water.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { promptFor } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT as SCENARIO } from '@anesthesia/scenarios/arterial-pressure-transducer-artifact';
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION } from '@anesthesia/scenarios/capnography-sampling-line-obstruction';
import { ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/arterial-pressure-transducer-artifact-fixtures';
import {
  ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT_OBJECTIVES, supportsArterialPressureTransducerArtifact,
} from '../../src/modules/anesthesia/arterial-pressure-transducer-artifact';
import { arterialPressureTransducerArtifactCompletionEvidence } from '../../src/modules/anesthesia/arterial-pressure-transducer-artifact-completion';

/** The tick both artifacts arrive. */
const ARTIFACT = 600;

function run(
  actions: readonly LearnerAction[],
  level: GuidanceLevel = 'unassisted',
  region: 'US' | 'GB' = 'US',
) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
  const hash = createHash('sha256');
  const history: HistorySample[] = [];
  const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= FIXTURES.ticks; tick += 1) {
    while (actions[next]?.tick === tick) { engine.apply(actions[next]!); next += 1; }
    const frame = engine.step();
    hash.update(JSON.stringify(frame));
    history.push({ tick: frame.tick, state: frame.state, concentrations: frame.concentrations } as HistorySample);
    events.push(...frame.events);
    const prompt = promptFor(level, {
      scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version,
      tick, state: frame.state as Readonly<Record<string, number>>,
      actions: actions.slice(0, next), ventilating: false, alarmCount: 0,
    }, new Map());
    if (level === 'unassisted') expect(prompt).toBeNull();
  }
  expect(next).toBe(actions.length);
  return {
    hash: hash.digest('hex'), history, events, engine,
    arterialLine: engine.equipment().arterialLine ?? {
      displayedMeanArterialMmHg: null, mislevelingCm: 0,
      dynamicResponse: 'normal', waveformAssessed: false, leveledAndZeroed: false,
    },
    findings: objectiveFindings(
      SCENARIO, history, 0, engine.equipment().preoxygenationSeconds, actions, events,
    ),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
/** The patient's real pressure, which the display is not reporting. */
const trueMeanArterialRange = (result: ReturnType<typeof run>) => {
  const values = result.history.slice(ARTIFACT).map(({ state }) => Math.round(state.meanArterialMmHg ?? 0));
  return { low: Math.min(...values), high: Math.max(...values) };
};

const LINE = (tick: number, action: string): LearnerAction =>
  ({ tick, type: 'arterial-line', payload: { action } });

describe('Arterial-transducer transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(3);
    expect(supportsArterialPressureTransducerArtifact(SCENARIO)).toBe(true);
    // The module's other "the monitor is wrong" lesson.
    expect(supportsArterialPressureTransducerArtifact(CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION)).toBe(false);
    expect(supportsArterialPressureTransducerArtifact({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(arterialPressureTransducerArtifactCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(arterialPressureTransducerArtifactCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(arterialPressureTransducerArtifactCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(arterialPressureTransducerArtifactCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT_OBJECTIVES]);
    expect(supportsArterialPressureTransducerArtifact({
      ...SCENARIO,
      metadata: { ...SCENARIO.metadata, objectives: [...SCENARIO.metadata.objectives].reverse() },
    })).toBe(false);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels and regions', (path) => {
    const actions = FIXTURES[path];
    const reference = run(actions);
    for (const level of ['guided', 'coached'] as const) {
      expect(run(actions, level).hash).toBe(reference.hash);
    }
    expect(run(actions, 'unassisted', 'GB').hash).toBe(reference.hash);
  });

  it('meets every objective on the expert path and clears both faults', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met']);
    expect(expert.findings[0]!.finding).toContain('before any accepted fluid or drug treatment');
    expect(expert.arterialLine.mislevelingCm).toBe(0);
    expect(expert.arterialLine.dynamicResponse).toBe('normal');
    expect(expert.arterialLine.displayedMeanArterialMmHg).toBe(78);
  });

  it('holds the true pressure at 78 on every path, fluid included', () => {
    // The premise of the lesson: the display was wrong and the patient was not.
    for (const path of ['expert', 'commonError', 'recovery', 'noAction'] as const) {
      expect(trueMeanArterialRange(run(FIXTURES[path]))).toEqual({ low: 78, high: 78 });
    }
    // Untouched, the display sits 15 mmHg low against that 78.
    const idle = run(FIXTURES.noAction);
    expect(idle.arterialLine.displayedMeanArterialMmHg).toBe(63);
    expect(idle.arterialLine.mislevelingCm).toBe(20);
    expect(78 - (idle.arterialLine.displayedMeanArterialMmHg ?? 0)).toBe(15);
  });

  it('downgrades the first objective on order rather than latency', () => {
    // The cuff is timely and correct, and reports the true 78. It is
    // downgraded because a litre of fluid came first.
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['partly-met', 'met', 'not-met']);
    expect(errored.findings[0]!.finding).toContain('60 seconds after the display changed');
    expect(errored.findings[0]!.finding).toContain('reported MAP 78 mmHg');
    expect(errored.findings[0]!.finding).toContain('after an accepted patient-changing action');
    // The very same cuff timing without the fluid earns it outright.
    const withoutFluid = run([LINE(1000, 'cycle-cuff'), LINE(1100, 'level-zero')]);
    expect(withoutFluid.findings[0]!.outcome).toBe('met');
  });

  it('treats the two artifacts as genuinely independent faults', () => {
    // Correcting the level does not reveal or fix the damping.
    const levelledOnly = run([LINE(800, 'level-zero')]);
    expect(levelledOnly.arterialLine.mislevelingCm).toBe(0);
    expect(levelledOnly.arterialLine.dynamicResponse).toBe('overdamped');
    expect(levelledOnly.findings[1]!.outcome).toBe('met');
    expect(levelledOnly.findings[2]!.outcome).toBe('not-met');
  });

  it('refuses the damping correction before the waveform is assessed, and forgives it', () => {
    // The module's usual rule, not the blood-bank exception.
    const outOfOrder = run([
      LINE(700, 'cycle-cuff'), LINE(800, 'level-zero'),
      LINE(900, 'restore-dynamic-response'),
      LINE(1000, 'assess-waveform'), LINE(1100, 'restore-dynamic-response'),
    ]);
    expect(outOfOrder.events.some(({ eventId }) =>
      eventId.startsWith('arterial-response-restoration-refused-'))).toBe(true);
    expect(outcomes(outOfOrder)).toEqual(['met', 'met', 'met']);
    expect(outOfOrder.arterialLine.dynamicResponse).toBe('normal');
  });

  it('completes the sequence on the recovery path', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['partly-met', 'met', 'met']);
    expect(recovered.arterialLine.dynamicResponse).toBe('normal');
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('leaves the display wrong when it is simply believed', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met']);
    expect(idle.arterialLine.dynamicResponse).toBe('overdamped');
    expect(idle.findings[0]!.finding).toContain('No accepted independent cuff result');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('arterial-pressure-artifact-is-display-only');
    expect(SCENARIO.metadata.limitations).toContain('arterial-line-actions-are-screen-intent');
    expect(SCENARIO.metadata.limitations).toContain('nibp-is-a-delayed-independent-sample');
  });
});

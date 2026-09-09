/**
 * Reference transcripts for the pneumothorax-under-positive-pressure lesson,
 * replayed through the real engine and scored by the real debrief.
 *
 * This file exists for two things. The counterfactual — answering a falling
 * saturation with more minute ventilation earns the oxygenation objective and
 * nothing else, while the pressure stays at 33 mmHg. And a DEFECT: the fifth
 * objective cannot be earned by any transcript, and the tests below locate the
 * fault rather than working around it.
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
import { PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE as SCENARIO } from '@anesthesia/scenarios/pneumothorax-under-positive-pressure';
import { RAPID_DESATURATION } from '@anesthesia/scenarios/rapid-desaturation';
import { PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/pneumothorax-under-positive-pressure-fixtures';
import {
  PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_OBJECTIVES, supportsPneumothoraxUnderPositivePressure,
} from '../../src/modules/anesthesia/pneumothorax-under-positive-pressure';
import { pneumothoraxUnderPositivePressureCompletionEvidence } from '../../src/modules/anesthesia/pneumothorax-under-positive-pressure-completion';

/** The declared endpoint of the fifth objective, and the reason it is unmet. */
const DECLARED_RECOVERY_MAP = 65;

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
    findings: objectiveFindings(
      SCENARIO, history, 0, engine.equipment().preoxygenationSeconds, actions, events,
    ),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const meanArterial = (result: ReturnType<typeof run>, tick: number) =>
  (result.history[tick]!.state as Readonly<Record<string, number>>).meanArterialMmHg!;
const peakMeanArterialAfter = (result: ReturnType<typeof run>, tick: number) =>
  Math.max(...result.history.slice(tick).map(({ state }) => state.meanArterialMmHg ?? 0));

describe('Pneumothorax-under-positive-pressure transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(supportsPneumothoraxUnderPositivePressure(SCENARIO)).toBe(true);
    expect(supportsPneumothoraxUnderPositivePressure(RAPID_DESATURATION)).toBe(false);
    // Without the scripted pleural event there is no clock for any objective.
    expect(supportsPneumothoraxUnderPositivePressure({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(pneumothoraxUnderPositivePressureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(pneumothoraxUnderPositivePressureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(pneumothoraxUnderPositivePressureCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(pneumothoraxUnderPositivePressureCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_OBJECTIVES]);
    expect(supportsPneumothoraxUnderPositivePressure({
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

  it('meets the first four objectives on the expert path', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met', 'not-met']);
    expect(expert.findings[0]!.finding).toContain('assessed 10 seconds after');
    expect(expert.findings[3]!.finding).toContain('accepted 30 seconds after');
  });

  it('cannot earn the fifth objective on any path, and the shortfall is 0.29 mmHg', () => {
    // A DEFECT in this lesson, pinned rather than worked around. The declared
    // endpoint sits above the ceiling of the post-decompression trajectory, so
    // a perfect run scores four of five and nothing a learner does changes it.
    const expert = run(FIXTURES.expert);
    const peak = peakMeanArterialAfter(expert, 900);
    expect(peak).toBeLessThan(DECLARED_RECOVERY_MAP);
    expect(DECLARED_RECOVERY_MAP - peak).toBeLessThan(0.3);
    expect(peak).toBeCloseTo(64.71, 1);
    expect(expert.findings[4]!.outcome).toBe('not-met');
    expect(expert.findings[4]!.finding).toContain('had not both reached the declared reassessment endpoint');
    // Every bound path agrees, including the one that decompresses late.
    for (const path of ['expert', 'commonError', 'recovery', 'noAction'] as const) {
      expect(outcomes(run(FIXTURES[path]))[4]).toBe('not-met');
    }
  });

  it('locates the fault in this scenario rather than the threshold or the model', () => {
    // The patient cleared 65 mmHg before the event, so the endpoint is not
    // absurd for them: decompression returns them to 0.81 mmHg BELOW where
    // they started, and the endpoint sits inside that gap.
    const expert = run(FIXTURES.expert);
    const preEvent = meanArterial(expert, 599);
    expect(preEvent).toBeGreaterThan(DECLARED_RECOVERY_MAP);
    expect(preEvent).toBeCloseTo(65.52, 1);
    expect(preEvent - peakMeanArterialAfter(expert, 900)).toBeCloseTo(0.81, 1);
    // And the saturation half of the same objective is comfortably satisfied,
    // so the pressure is the only reason the objective fails.
    expect(Math.max(...expert.history.slice(900)
      .map(({ state }) => state.spo2Percent ?? 0))).toBeGreaterThanOrEqual(94);
  });

  it('credits the reflex with the one objective it happens to satisfy', () => {
    // More oxygen and more breaths: the oxygenation objective asks for exactly
    // the first half of that, so the error path earns it and nothing else.
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'met', 'not-met', 'not-met']);
    expect(errored.findings[2]!.finding).toContain('High-concentration oxygen was established');
    // And the pressure never recovers, because nothing let the chest empty.
    expect(Math.round(meanArterial(errored, 3900))).toBe(33);
    expect(Math.round(meanArterial(run(FIXTURES.noAction), 3900))).toBe(33);
  });

  it('grades the timed objectives as gradients', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['partly-met', 'partly-met', 'met', 'met', 'not-met']);
    expect(recovered.findings[0]!.finding).toContain('assessed 40 seconds after');
    expect(recovered.findings[3]!.finding).toContain('accepted 55 seconds after');
    // The recovery decompresses late and the pressure still comes back.
    expect(peakMeanArterialAfter(recovered, 1150))
      .toBeCloseTo(peakMeanArterialAfter(run(FIXTURES.expert), 900), 0);
  });

  it('reads nothing when the pattern is never assessed', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.findings[3]!.finding).toContain('No accepted left-chest decompression intent');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('no-procedure-or-equipment-selection');
    expect(SCENARIO.metadata.limitations).toContain('no-airway-pressure-or-compliance-model');
    expect(SCENARIO.formulary).toEqual([]);
  });
});

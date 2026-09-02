/**
 * Reference transcripts for the pediatric dehydration lesson, replayed through
 * the real engine.
 *
 * Rehydration ownership and the ongoing-loss safety review are unordered
 * against each other, so the paths here exercise both orders as well as the
 * refusal that fires when only one of them is active.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-dehydration-with-hypovolemia';
import { PEDIATRIC_DEHYDRATION_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-dehydration-fixtures';
import type { PediatricDehydrationAction } from '../../src/modules/pediatrics/pediatric-dehydration-with-hypovolemia';
import { pediatricDehydrationCompletionEvidence } from '../../src/modules/pediatrics/pediatric-dehydration-completion';
import { pediatricDehydrationInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-dehydration-guidance';

type Choices = readonly (readonly [number, PediatricDehydrationAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricDehydrationAction): LearnerAction => ({ tick, type: 'pediatric-dehydration-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricDehydrationAssessment);
    const prompt = pediatricDehydrationInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricDehydrationAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricDehydrationAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricDehydrationAssessment! };
}

describe('Pediatric dehydration transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricDehydrationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricDehydrationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(pediatricDehydrationCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricDehydrationCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels and regions', (path) => {
    const actions: Choices = FIXTURES[path];
    const until = (actions.at(-1)?.[0] ?? 0) + 2;
    const reference = run(actions, until);
    for (const level of ['guided', 'coached'] as const) {
      expect(run(actions, until, level).hash).toBe(reference.hash);
    }
    expect(run(actions, until, 'unassisted', 'GB').hash).toBe(reference.hash);
  });

  it('meets every objective on the expert path and none with no action', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(findings(expert.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    expect(expert.patient.handoffAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.trajectoryAtTick).toBeNull();
  });

  it('refuses the later report while the rehydration has no watch on it', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.rehydrationAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null });
    expect(errored.patient.qualifiedRehydrationOwnershipActive).toBe(true);
    expect(errored.patient.qualifiedSafetyReviewActive).toBe(false);
    expect(JSON.stringify(errored.events))
      .toContain('Keep qualified rehydration ownership and ongoing-loss safety review active in parallel');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('accepts the unordered pair safety-first and still reaches a correct handoff', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The pair really was taken in the opposite order from the expert path.
    expect(recovered.patient.safetyAtTick).toBeLessThan(recovered.patient.rehydrationAtTick!);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the supplied losses, intake, weight, urine, hydration signs, and whole-child trajectory first');
    expect(transcript).toContain('Keep qualified rehydration ownership and ongoing-loss safety review active in parallel');
    expect(transcript).toContain('Allow elapsed simulated time after both rehydration and safety ownership are active');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    expect(recovered.patient.rehydrationAtTick).toBeLessThan(recovered.patient.laterResponseAtTick!);
    expect(recovered.patient.laterResponseAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('keeps the weight from becoming a deficit and the compensation from becoming safety', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.gastrointestinalLossesAuthored).toBe(true);
    expect(expert.patient.reducedIntakeAuthored).toBe(true);
    expect(expert.patient.clinicalDehydrationAuthored).toBe(true);
    expect(expert.patient.compensatedHypovolemiaAuthored).toBe(true);
    // Compensated, and the alternatives are snapshots rather than exclusions.
    expect(expert.patient.shockAuthored).toBe(false);
    expect(expert.patient.bleedingAuthored).toBe(false);
    expect(expert.patient.sepsisAuthored).toBe(false);
    expect(expert.patient.diabeticKetoacidosisAuthored).toBe(false);
    // No arithmetic anywhere.
    expect(expert.patient.patientWeighedByLearner).toBe(false);
    expect(expert.patient.dehydrationPercentageCalculatedByLearner).toBe(false);
    expect(expert.patient.fluidDeficitCalculatedByLearner).toBe(false);
    expect(expert.patient.maintenanceCalculatedByLearner).toBe(false);
    // And nothing that follows from the partial improvement.
    expect(expert.patient.treatmentEffectProven).toBe(false);
    expect(expert.patient.durableRecoveryProven).toBe(false);
    expect(expert.patient.dischargeReadinessProven).toBe(false);
    expect(expert.patient.dispositionDetermined).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
  });

  it('certifies that nothing about this child was ever touched by the learner', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.testAcquiredByLearner).toBe(false);
    expect(recovered.patient.testInterpretedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.glucoseSelectedByLearner).toBe(false);
    expect(recovered.patient.electrolyteSelectedByLearner).toBe(false);
    expect(recovered.patient.routeSelectedByLearner).toBe(false);
    expect(recovered.patient.accessPlacedByLearner).toBe(false);
    expect(recovered.patient.fluidSelectedByLearner).toBe(false);
    expect(recovered.patient.fluidVolumeSelectedByLearner).toBe(false);
    expect(recovered.patient.fluidRateSelectedByLearner).toBe(false);
    expect(recovered.patient.fluidDeliveredByLearner).toBe(false);
    expect(recovered.patient.feedingPlanSelectedByLearner).toBe(false);
    expect(recovered.patient.procedurePerformedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
  });
});

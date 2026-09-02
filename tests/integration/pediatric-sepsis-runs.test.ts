/**
 * Reference transcripts for the pediatric sepsis lesson, replayed through the
 * real engine.
 *
 * This is the first pediatrics lesson whose engine case authors no refusable
 * choice. What it refuses is order and time, so the error paths here are made
 * of impatience rather than of wrong answers.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_SEPSIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-sepsis';
import { PEDIATRIC_SEPSIS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-sepsis-fixtures';
import type { PediatricSepsisAction } from '../../src/modules/pediatrics/pediatric-sepsis';
import { pediatricSepsisCompletionEvidence } from '../../src/modules/pediatrics/pediatric-sepsis-completion';
import { pediatricSepsisInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-sepsis-guidance';

type Choices = readonly (readonly [number, PediatricSepsisAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricSepsisAction): LearnerAction => ({ tick, type: 'pediatric-sepsis-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricSepsisAssessment);
    const prompt = pediatricSepsisInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricSepsisAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricSepsisAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricSepsisAssessment! };
}

describe('Pediatric sepsis transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricSepsisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricSepsisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'infectious-disease')).toEqual([]);
    expect(pediatricSepsisCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricSepsisCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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
    expect(idle.patient.patternAtTick).toBeNull();
  });

  it('refuses a trajectory declared in the minute the source review was recorded', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.sourceReviewAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ laterResponseAtTick: null, handoffAtTick: null });
    expect(errored.patient.laterReportAuthored).toBe(false);
    expect(JSON.stringify(errored.events)).toContain('Allow elapsed simulated time before reviewing');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'not-met', 'not-met']);
  });

  it('lets the same run recover from both order refusals and both time gates', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the supplied infection, organ-dysfunction, care, and whole-child pattern first');
    expect(transcript).toContain('Distinguish the supplied current sepsis state from shock before activating ongoing care');
    expect(transcript).toContain('Allow elapsed simulated time before reviewing');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    // The steps that were refused still landed in the enforced order.
    expect(recovered.patient.patternAtTick).toBeLessThan(recovered.patient.shockBoundaryAtTick!);
    expect(recovered.patient.shockBoundaryAtTick).toBeLessThan(recovered.patient.careAtTick!);
    expect(recovered.patient.careAtTick).toBeLessThan(recovered.patient.sourceReviewAtTick!);
    expect(recovered.patient.sourceReviewAtTick).toBeLessThan(recovered.patient.laterResponseAtTick!);
    expect(recovered.patient.laterResponseAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('certifies that nothing about this child was ever touched by the learner', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.monitorInterpretedByLearner).toBe(false);
    expect(recovered.patient.scoreCalculatedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.testAcquiredByLearner).toBe(false);
    expect(recovered.patient.cultureAcquiredByLearner).toBe(false);
    expect(recovered.patient.antimicrobialSelectedByLearner).toBe(false);
    expect(recovered.patient.doseSelectedByLearner).toBe(false);
    expect(recovered.patient.routeSelectedByLearner).toBe(false);
    expect(recovered.patient.accessPlacedByLearner).toBe(false);
    expect(recovered.patient.fluidSelectedByLearner).toBe(false);
    expect(recovered.patient.fluidVolumeSelectedByLearner).toBe(false);
    expect(recovered.patient.fluidDeliveredByLearner).toBe(false);
    expect(recovered.patient.vasoactiveSelectedByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.procedurePerformedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
  });

  it('keeps a preserved blood pressure from being read as low risk', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.suspectedInfectionAuthored).toBe(true);
    expect(expert.patient.coagulationDysfunctionAuthored).toBe(true);
    expect(expert.patient.phoenixSepsisScoreAuthored).toBe(2);
    // No shock now, and no cardiovascular points to read as reassurance.
    expect(expert.patient.sepsisWithoutShockAuthored).toBe(true);
    expect(expert.patient.phoenixCardiovascularSubscoreAuthored).toBe(0);
    expect(expert.patient.hypotensionAuthored).toBe(false);
    expect(expert.patient.respiratoryDysfunctionAuthored).toBe(false);
    expect(expert.patient.neurologicDysfunctionAuthored).toBe(false);
    // And the ending certifies nothing about the source or the outcome.
    expect(expert.patient.sourceConfirmed).toBe(false);
    expect(expert.patient.pathogenIdentified).toBe(false);
    expect(expert.patient.treatmentEffectProven).toBe(false);
    expect(expert.patient.durableRecoveryProven).toBe(false);
    expect(expert.patient.dischargeReadinessProven).toBe(false);
    expect(expert.patient.dispositionDetermined).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
  });
});

/**
 * Reference transcripts for the hypoglycemic-seizure lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is the one a glucose of 86 makes
 * tempting: nothing in this lesson ever proves the cause, the durability, the
 * neurological recovery, or the absence of recurrence.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_HYPOGLYCEMIC_SEIZURE as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-hypoglycemic-seizure';
import { PEDIATRIC_HYPOGLYCEMIC_SEIZURE_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-hypoglycemic-seizure-fixtures';
import type { PediatricHypoglycemicSeizureAction } from '../../src/modules/pediatrics/pediatric-hypoglycemic-seizure';
import { pediatricHypoglycemicSeizureCompletionEvidence } from '../../src/modules/pediatrics/pediatric-hypoglycemic-seizure-completion';
import { pediatricHypoglycemicSeizureInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-hypoglycemic-seizure-guidance';

type Choices = readonly (readonly [number, PediatricHypoglycemicSeizureAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricHypoglycemicSeizureAction): LearnerAction => ({ tick, type: 'pediatric-hypoglycemic-seizure-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricHypoglycemicSeizureAssessment);
    const prompt = pediatricHypoglycemicSeizureInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricHypoglycemicSeizureAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricHypoglycemicSeizureAssessment)).toBe(before);
    // Nothing that happens in this lesson ever closes the question.
    const patient = frame.equipment.resuscitation.pediatricHypoglycemicSeizureAssessment;
    if (patient) {
      expect(patient.seizureCauseProven).toBe(false);
      expect(patient.durableEuglycemiaProven).toBe(false);
      expect(patient.neurologicRecoveryProven).toBe(false);
      expect(patient.recurrenceExcluded).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricHypoglycemicSeizureAssessment! };
}

describe('Hypoglycemic-seizure transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricHypoglycemicSeizureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricHypoglycemicSeizureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(pediatricHypoglycemicSeizureCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricHypoglycemicSeizureCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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

  it('refuses the later report while nobody has asked why', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.rescueAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null });
    expect(errored.patient.qualifiedRescueOwnershipActive).toBe(true);
    expect(errored.patient.qualifiedSafetyReviewActive).toBe(false);
    expect(JSON.stringify(errored.events))
      .toContain('Keep qualified rescue ownership and cause-recurrence safety review active in parallel');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('accepts the unordered pair cause-review-first and still reaches a correct handoff', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    expect(recovered.patient.safetyAtTick).toBeLessThan(recovered.patient.rescueAtTick!);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the supplied whole-child, seizure, and glucose pattern first');
    expect(transcript).toContain('Keep qualified rescue ownership and cause-recurrence safety review active in parallel');
    expect(transcript).toContain('Allow elapsed simulated time after both rescue and safety ownership are active');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    expect(recovered.patient.rescueAtTick).toBeLessThan(recovered.patient.laterResponseAtTick!);
    expect(recovered.patient.laterResponseAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('lets the glucose rise from 34 to 86 and explains nothing by it', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.seizureAuthored).toBe(true);
    expect(expert.patient.hypoglycemiaAuthored).toBe(true);
    expect(expert.patient.initialGlucoseMgPerDl).toBe(34);
    expect(expert.patient.laterGlucoseMgPerDl).toBe(86);
    expect(expert.patient.laterReportAuthored).toBe(true);
    // The number moved and nothing else did.
    expect(expert.patient.treatmentEffectProven).toBe(false);
    expect(expert.patient.seizureCauseProven).toBe(false);
    expect(expert.patient.durableEuglycemiaProven).toBe(false);
    expect(expert.patient.neurologicRecoveryProven).toBe(false);
    expect(expert.patient.recurrenceExcluded).toBe(false);
    expect(expert.patient.dispositionDetermined).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
  });

  it('certifies that nothing about this child was ever touched by the learner', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.glucoseAcquiredByLearner).toBe(false);
    expect(recovered.patient.glucoseInterpretedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.glucoseFormulationSelectedByLearner).toBe(false);
    expect(recovered.patient.doseSelectedByLearner).toBe(false);
    expect(recovered.patient.concentrationSelectedByLearner).toBe(false);
    expect(recovered.patient.routeSelectedByLearner).toBe(false);
    expect(recovered.patient.rateSelectedByLearner).toBe(false);
    expect(recovered.patient.accessPlacedByLearner).toBe(false);
    expect(recovered.patient.glucoseDeliveredByLearner).toBe(false);
    expect(recovered.patient.airwayManeuverPerformedByLearner).toBe(false);
    expect(recovered.patient.procedurePerformedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
  });
});

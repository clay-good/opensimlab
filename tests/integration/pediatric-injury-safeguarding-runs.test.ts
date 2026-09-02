/**
 * Reference transcripts for the safeguarding-escalation lesson, replayed
 * through the real engine.
 *
 * This lesson's refusal surface is ethical as much as clinical, and the
 * assertions here pin the ethical half on every frame of every path: no abuse
 * is diagnosed, nobody is named, no credibility is judged, no caregiver is
 * confronted or separated, no referral or report is submitted, no custody is
 * decided, and nothing identifying or free-text is ever collected.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-injury-safeguarding-escalation';
import { PEDIATRIC_INJURY_SAFEGUARDING_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-injury-safeguarding-fixtures';
import type { PediatricInjurySafeguardingAction } from '../../src/modules/pediatrics/pediatric-injury-safeguarding';
import { pediatricInjurySafeguardingCompletionEvidence } from '../../src/modules/pediatrics/pediatric-injury-safeguarding-completion';
import { pediatricInjurySafeguardingInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-injury-safeguarding-guidance';

type Choices = readonly (readonly [number, PediatricInjurySafeguardingAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricInjurySafeguardingAction): LearnerAction => ({ tick, type: 'pediatric-injury-safeguarding-escalation-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricInjurySafeguardingAssessment);
    const prompt = pediatricInjurySafeguardingInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricInjurySafeguardingAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricInjurySafeguardingAssessment)).toBe(before);
    // The ethical refusals hold on every frame, not only at the end.
    const patient = frame.equipment.resuscitation.pediatricInjurySafeguardingAssessment;
    if (patient) {
      expect(patient.abuseDiagnosedByLearner).toBe(false);
      expect(patient.perpetratorNamedByLearner).toBe(false);
      expect(patient.caregiverCredibilityJudgedByLearner).toBe(false);
      expect(patient.caregiverConfrontedByLearner).toBe(false);
      expect(patient.caregiverSeparatedByLearner).toBe(false);
      expect(patient.identifyingInformationCollected).toBe(false);
      expect(patient.freeTextDisclosureCollected).toBe(false);
      expect(patient.medicalAlternativesRemainOpen).toBe(true);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricInjurySafeguardingAssessment! };
}

describe('Safeguarding-escalation transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricInjurySafeguardingCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricInjurySafeguardingCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(pediatricInjurySafeguardingCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricInjurySafeguardingCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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

  it('refuses the later safety state while the alternatives were never reviewed', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.safeguardingAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      alternativesAtTick: null, laterSafetyAtTick: null, handoffAtTick: null,
    });
    expect(errored.patient.qualifiedSafeguardingOwnershipActive).toBe(true);
    expect(JSON.stringify(errored.events))
      .toContain('Review the open medical alternatives and protected-information boundary first');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('recovers from both order refusals and clears both time gates', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the supplied whole-child record before recognizing concern');
    expect(transcript).toContain('Activate qualified safeguarding and immediate-safety ownership before reviewing alternatives');
    expect(transcript).toContain('Allow elapsed simulated time before reviewing the fixed later safety state');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    expect(recovered.patient.trajectoryAtTick).toBeLessThan(recovered.patient.concernAtTick!);
    expect(recovered.patient.concernAtTick).toBeLessThan(recovered.patient.safeguardingAtTick!);
    expect(recovered.patient.safeguardingAtTick).toBeLessThan(recovered.patient.alternativesAtTick!);
    expect(recovered.patient.alternativesAtTick).toBeLessThan(recovered.patient.laterSafetyAtTick!);
    expect(recovered.patient.laterSafetyAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('raises a concern and concludes nothing', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.independentlyMobileAuthored).toBe(true);
    expect(expert.patient.concerningInjuryPatternAuthored).toBe(true);
    expect(expert.patient.suppliedHistoryDevelopmentMismatchAuthored).toBe(true);
    expect(expert.patient.safeguardingConcernAuthored).toBe(true);
    expect(expert.patient.qualifiedSafeguardingOwnershipActive).toBe(true);
    expect(expert.patient.qualifiedImmediateSafetyOwnershipActive).toBe(true);
    expect(expert.patient.laterChildRemainsInQualifiedCareAuthored).toBe(true);
    // A concern, and nothing else.
    expect(expert.patient.abuseFinallyProven).toBe(false);
    expect(expert.patient.perpetratorIdentified).toBe(false);
    expect(expert.patient.caregiverCredibilityDetermined).toBe(false);
    expect(expert.patient.medicalMimicExcluded).toBe(false);
    expect(expert.patient.occultInjuryExcluded).toBe(false);
    expect(expert.patient.immediateSafetyProven).toBe(false);
    expect(expert.patient.futureHarmExcluded).toBe(false);
    expect(expert.patient.referralCompletionProven).toBe(false);
    expect(expert.patient.legalReportingCompleted).toBe(false);
    expect(expert.patient.custodyDetermined).toBe(false);
    expect(expert.patient.durableSafetyProven).toBe(false);
    expect(expert.patient.dischargeReadinessProven).toBe(false);
    expect(expert.patient.dispositionDetermined).toBe(false);
    expect(expert.patient.prognosisPredicted).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
  });

  it('certifies that no process step was ever the learner’s to take', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.historyTakenByLearner).toBe(false);
    expect(recovered.patient.caregiverInterviewedByLearner).toBe(false);
    expect(recovered.patient.disclosureSolicitedByLearner).toBe(false);
    expect(recovered.patient.bruiseIdentifiedByLearner).toBe(false);
    expect(recovered.patient.bruiseDatedByLearner).toBe(false);
    expect(recovered.patient.photographCapturedByLearner).toBe(false);
    expect(recovered.patient.bodyMapCreatedByLearner).toBe(false);
    expect(recovered.patient.screeningRuleCalculatedByLearner).toBe(false);
    expect(recovered.patient.imagingAcquiredByLearner).toBe(false);
    expect(recovered.patient.reportingThresholdDeterminedByLearner).toBe(false);
    expect(recovered.patient.jurisdictionSelectedByLearner).toBe(false);
    expect(recovered.patient.agencySelectedByLearner).toBe(false);
    expect(recovered.patient.agencyContactedByLearner).toBe(false);
    expect(recovered.patient.referralSubmittedByLearner).toBe(false);
    expect(recovered.patient.reportSubmittedByLearner).toBe(false);
    expect(recovered.patient.custodyActionSelectedByLearner).toBe(false);
    expect(recovered.patient.childRemovedByLearner).toBe(false);
    expect(recovered.patient.safetyPlanDeterminedByLearner).toBe(false);
  });
});

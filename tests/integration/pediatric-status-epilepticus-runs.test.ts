/**
 * Reference transcripts for the status-epilepticus lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is the gap the minute-25 report makes
 * tempting to close: no visible convulsion is not electrographic control, not
 * durable control, and not recovery.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-status-epilepticus';
import { PEDIATRIC_STATUS_EPILEPTICUS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-status-epilepticus-fixtures';
import type { PediatricStatusEpilepticusAction } from '../../src/modules/pediatrics/pediatric-status-epilepticus';
import { pediatricStatusEpilepticusCompletionEvidence } from '../../src/modules/pediatrics/pediatric-status-epilepticus-completion';
import { pediatricStatusEpilepticusInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-status-epilepticus-guidance';

type Choices = readonly (readonly [number, PediatricStatusEpilepticusAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricStatusEpilepticusAction): LearnerAction => ({ tick, type: 'pediatric-status-epilepticus-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricStatusEpilepticusAssessment);
    const prompt = pediatricStatusEpilepticusInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricStatusEpilepticusAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricStatusEpilepticusAssessment)).toBe(before);
    // Stillness never closes the gap, on any frame of any path.
    const patient = frame.equipment.resuscitation.pediatricStatusEpilepticusAssessment;
    if (patient) {
      expect(patient.electrographicSeizureControlProven).toBe(false);
      expect(patient.durableSeizureControlProven).toBe(false);
      expect(patient.neurologicRecoveryProven).toBe(false);
      expect(patient.seizureCauseProven).toBe(false);
      expect(patient.recurrenceExcluded).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricStatusEpilepticusAssessment! };
}

describe('Status-epilepticus transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricStatusEpilepticusCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricStatusEpilepticusCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(pediatricStatusEpilepticusCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricStatusEpilepticusCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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

  it('refuses the later report while nothing is watching the airway', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.secondLineAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null });
    expect(errored.patient.qualifiedSecondLineOwnershipActive).toBe(true);
    expect(errored.patient.qualifiedSafetyReviewActive).toBe(false);
    expect(JSON.stringify(errored.events))
      .toContain('Keep qualified second-line ownership and airway-cause-refractory safety review active in parallel');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('accepts the unordered pair safety-first and still reaches a correct handoff', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    expect(recovered.patient.safetyAtTick).toBeLessThan(recovered.patient.secondLineAtTick!);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the supplied seizure clock, first-line care, and whole-child trajectory first');
    expect(transcript).toContain('Keep qualified second-line ownership and airway-cause-refractory safety review active in parallel');
    expect(transcript).toContain('Allow elapsed simulated time after both qualified second-line and safety ownership are active');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    expect(recovered.patient.secondLineAtTick).toBeLessThan(recovered.patient.laterResponseAtTick!);
    expect(recovered.patient.laterResponseAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('keeps the visible and the electrographic apart', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.initialOngoingConvulsionAuthored).toBe(true);
    expect(expert.patient.statusThresholdAuthored).toBe(true);
    expect(expert.patient.firstLineCareAuthored).toBe(true);
    expect(expert.patient.laterReportAuthored).toBe(true);
    // The movements stopped and that is all that stopped.
    expect(expert.patient.treatmentEffectProven).toBe(false);
    expect(expert.patient.electrographicSeizureControlProven).toBe(false);
    expect(expert.patient.durableSeizureControlProven).toBe(false);
    expect(expert.patient.neurologicRecoveryProven).toBe(false);
    expect(expert.patient.seizureCauseProven).toBe(false);
    expect(expert.patient.recurrenceExcluded).toBe(false);
    expect(expert.patient.dischargeReadinessProven).toBe(false);
    expect(expert.patient.dispositionDetermined).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
  });

  it('certifies that no timing, no verification and no drug was ever the learner’s', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.seizureTimedByLearner).toBe(false);
    expect(recovered.patient.monitoringAcquiredByLearner).toBe(false);
    expect(recovered.patient.glucoseAcquiredByLearner).toBe(false);
    expect(recovered.patient.glucoseInterpretedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.benzodiazepineSelectedByLearner).toBe(false);
    expect(recovered.patient.antiseizureDrugSelectedByLearner).toBe(false);
    expect(recovered.patient.doseSelectedByLearner).toBe(false);
    expect(recovered.patient.routeSelectedByLearner).toBe(false);
    expect(recovered.patient.accessPlacedByLearner).toBe(false);
    expect(recovered.patient.drugDeliveredByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.airwayManeuverPerformedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
  });
});

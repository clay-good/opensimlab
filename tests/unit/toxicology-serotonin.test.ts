import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SEROTONIN_TOXICITY_HYPERTHERMIA_CLONUS as SCENARIO } from '../../src/modules/toxicology/scenarios/serotonin-toxicity-hyperthermia-clonus';
import { ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM } from '../../src/modules/toxicology/scenarios/anticholinergic-hyperthermia-delirium';

const ACTIONS = [
  'reconcile-toxicology-serotonin-agents-clock-mental-autonomic-neuromuscular-temperature-and-whole-patient',
  'recognize-toxicology-serotonin-coupled-pattern-without-hunter-clonus-temperature-or-medication-list-only-closure',
  'activate-toxicology-serotonin-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership',
  'review-toxicology-serotonin-supplied-cns-autonomic-neuromuscular-temperature-ecg-renal-ck-and-differential-boundary',
  'record-toxicology-serotonin-bounded-qualified-source-cessation-cooling-support-sedation-seizure-surveillance-airway-and-antagonist-intent-with-strict-later-review',
  'handoff-toxicology-serotonin-rebound-hyperthermia-clonus-rigidity-seizure-rhabdomyolysis-coingestion-airway-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2301) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'serotonin-toxicity-hyperthermia-clonus-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology serotonin contract', () => {
  it('validates the interaction-clonus fixture and keeps the authored response bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['sinus-tachycardia', 'serotonin-toxicity-hyperthermia-clonus-transition', 'serotonin-toxicity-hyperthermia-clonus-transition', 'serotonin-toxicity-hyperthermia-clonus-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus-tachycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 128, systolicMmHg: 146, diastolicMmHg: 84, meanArterialMmHg: 105, respiratoryRateBpm: 26, spo2Percent: 97, coreTemperatureC: 40.1 });
    expect(frame.equipment.resuscitation.toxicologySerotoninAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, interactionMentalAutonomicNeuromuscularHyperthermiaPatternAuthored: true, serotoninPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus-tachycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 104, systolicMmHg: 132, diastolicMmHg: 76, meanArterialMmHg: 95, respiratoryRateBpm: 20, spo2Percent: 97, coreTemperatureC: 38.7 });
    expect(frame.equipment.resuscitation.toxicologySerotoninAssessment).toMatchObject({ serotoninPatternRecognized: true, qualifiedSupportActive: true, cnsAutonomicNeuromuscularTemperatureEcgRenalCkAndDifferentialEvidenceReviewed: true, qualifiedSourceCessationIntentRecorded: true, qualifiedCoolingSupportIntentRecorded: true, qualifiedSedationSeizureIntentRecorded: true, qualifiedTemperatureRenalCkSurveillanceRecorded: true, qualifiedAirwayPreparednessRecorded: true, qualifiedSerotoninAntagonistRescueIntentRecorded: true, responseStateAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, monitoringAcquiredByLearner: false, ecgInterpretedByLearner: false, temperatureMeasuredByLearner: false, diagnosisMadeByLearner: false, alternativeExcludedByLearner: false, coolingSelectedByLearner: false, restraintSelectedByLearner: false, fluidSelectedByLearner: false, drugSelectedByLearner: false, airwaySelectedByLearner: false, ventilationSelectedByLearner: false, neuromuscularBlockerSelectedByLearner: false, treatmentDeliveredByLearner: false, rescueEligibilityDetermined: false, durableTemperatureControlProven: false, neuromuscularRecoveryProven: false, renalSafetyProven: false, rhabdomyolysisExcluded: false, seizureExcluded: false, exposureCompletenessProven: false, treatmentEffectProven: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing cooling, sedation, antagonist, airway, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2302); const control = make(SCENARIO, 2302); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2303); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologySerotoninAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2304); const control = make(SCENARIO, 2304); hostile.step(); control.step(); for (const action of ['ice-bath', 'sedate-patient', 'dose-cyproheptadine', 'intubate', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['active-cooling', { active: true }], ['bolus', { drugId: 'cyproheptadine', amount: 12, unit: 'mg' }], ['airway-maneuver', { maneuver: 'intubate' }], ['anticholinergic-hyperthermia-delirium-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM, 2305); const adjacentControl = make(ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM, 2305); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

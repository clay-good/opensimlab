import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SYMPATHOMIMETIC_HYPERADRENERGIC_HYPERTHERMIA as SCENARIO } from '../../src/modules/toxicology/scenarios/sympathomimetic-hyperadrenergic-hyperthermia';
import { SEROTONIN_TOXICITY_HYPERTHERMIA_CLONUS } from '../../src/modules/toxicology/scenarios/serotonin-toxicity-hyperthermia-clonus';

const ACTIONS = [
  'reconcile-toxicology-sympathomimetic-exposure-clock-agitation-autonomic-temperature-and-whole-patient',
  'recognize-toxicology-sympathomimetic-coupled-pattern-without-screen-pupil-pressure-temperature-or-agitation-only-closure',
  'activate-toxicology-sympathomimetic-deescalation-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership',
  'review-toxicology-sympathomimetic-supplied-mental-autonomic-cardiac-temperature-renal-ck-and-differential-boundary',
  'record-toxicology-sympathomimetic-bounded-qualified-deescalation-support-sedation-cooling-surveillance-airway-and-adjunct-intent-with-strict-later-review',
  'handoff-toxicology-sympathomimetic-rebound-agitation-psychosis-suicidality-ischemia-arrhythmia-hyperthermia-rhabdomyolysis-coingestion-airway-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2401) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'sympathomimetic-hyperadrenergic-hyperthermia-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology sympathomimetic contract', () => {
  it('validates the hyperadrenergic fixture and keeps the authored response bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['sinus-tachycardia', 'sympathomimetic-hyperadrenergic-hyperthermia-transition', 'sympathomimetic-hyperadrenergic-hyperthermia-transition', 'sympathomimetic-hyperadrenergic-hyperthermia-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus-tachycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 150, systolicMmHg: 196, diastolicMmHg: 112, meanArterialMmHg: 140, respiratoryRateBpm: 30, spo2Percent: 98, coreTemperatureC: 40.4 });
    expect(frame.equipment.resuscitation.toxicologySympathomimeticAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, exposureMentalAutonomicHyperthermiaPatternAuthored: true, sympathomimeticPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 112, systolicMmHg: 152, diastolicMmHg: 88, meanArterialMmHg: 109, respiratoryRateBpm: 22, spo2Percent: 98, coreTemperatureC: 38.8 });
    expect(frame.equipment.resuscitation.toxicologySympathomimeticAssessment).toMatchObject({ sympathomimeticPatternRecognized: true, qualifiedSupportActive: true, mentalAutonomicCardiacTemperatureRenalCkAndDifferentialEvidenceReviewed: true, qualifiedDeescalationSupportIntentRecorded: true, qualifiedGabaergicSedationIntentRecorded: true, qualifiedCoolingIntentRecorded: true, qualifiedCardiacTemperatureRenalCkSurveillanceRecorded: true, qualifiedAirwayPreparednessRecorded: true, qualifiedPersistentHyperadrenergicAdjunctIntentRecorded: true, responseStateAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, monitoringAcquiredByLearner: false, ecgInterpretedByLearner: false, temperatureMeasuredByLearner: false, toxicologyScreenInterpretedByLearner: false, diagnosisMadeByLearner: false, alternativeExcludedByLearner: false, restraintSelectedByLearner: false, coolingSelectedByLearner: false, fluidSelectedByLearner: false, drugSelectedByLearner: false, cardiovascularTherapySelectedByLearner: false, airwaySelectedByLearner: false, ventilationSelectedByLearner: false, treatmentDeliveredByLearner: false, adjunctEligibilityDetermined: false, durableTemperatureControlProven: false, durablePressureControlProven: false, psychiatricSafetyProven: false, cardiacSafetyProven: false, renalSafetyProven: false, rhabdomyolysisExcluded: false, seizureExcluded: false, exposureCompletenessProven: false, treatmentEffectProven: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing restraint, cooling, sedation, cardiovascular, airway, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2402); const control = make(SCENARIO, 2402); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2403); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologySympathomimeticAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2404); const control = make(SCENARIO, 2404); hostile.step(); control.step(); for (const action of ['restrain-patient', 'ice-bath', 'sedate-patient', 'dose-antihypertensive', 'intubate', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['active-cooling', { active: true }], ['bolus', { drugId: 'midazolam', amount: 5, unit: 'mg' }], ['airway-maneuver', { maneuver: 'intubate' }], ['serotonin-toxicity-hyperthermia-clonus-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(SEROTONIN_TOXICITY_HYPERTHERMIA_CLONUS, 2405); const adjacentControl = make(SEROTONIN_TOXICITY_HYPERTHERMIA_CLONUS, 2405); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

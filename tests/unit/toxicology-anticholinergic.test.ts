import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM as SCENARIO } from '../../src/modules/toxicology/scenarios/anticholinergic-hyperthermia-delirium';
import { CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE } from '../../src/modules/toxicology/scenarios/cholinergic-pesticide-respiratory-failure';

const ACTIONS = [
  'reconcile-toxicology-anticholinergic-product-clock-delirium-temperature-dryness-retention-ecg-and-whole-patient',
  'recognize-toxicology-anticholinergic-central-and-peripheral-pattern-without-mnemonic-temperature-or-pupil-only-closure',
  'activate-toxicology-anticholinergic-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership',
  'review-toxicology-anticholinergic-supplied-temperature-cns-ecg-renal-ck-retention-and-differential-boundary',
  'record-toxicology-anticholinergic-bounded-qualified-cooling-support-sedation-seizure-surveillance-and-physostigmine-eligibility-intent-with-strict-later-review',
  'handoff-toxicology-anticholinergic-rebound-delirium-hyperthermia-retention-rhabdomyolysis-seizure-coingestion-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2201) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'anticholinergic-hyperthermia-delirium-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology anticholinergic contract', () => {
  it('validates the hyperthermia-delirium fixture and keeps the authored response bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['sinus-tachycardia', 'anticholinergic-hyperthermia-delirium-transition', 'anticholinergic-hyperthermia-delirium-transition', 'anticholinergic-hyperthermia-delirium-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus-tachycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 138, systolicMmHg: 132, diastolicMmHg: 78, meanArterialMmHg: 96, respiratoryRateBpm: 24, spo2Percent: 98, coreTemperatureC: 40.3 });
    expect(frame.equipment.resuscitation.toxicologyAnticholinergicAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, exposureDeliriumHyperthermiaRetentionAndEcgPatternAuthored: true, anticholinergicPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus-tachycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 106, systolicMmHg: 124, diastolicMmHg: 72, meanArterialMmHg: 89, respiratoryRateBpm: 20, spo2Percent: 98, coreTemperatureC: 38.6 });
    expect(frame.equipment.resuscitation.toxicologyAnticholinergicAssessment).toMatchObject({ anticholinergicPatternRecognized: true, qualifiedSupportActive: true, temperatureCnsEcgRenalCkRetentionAndDifferentialEvidenceReviewed: true, qualifiedCoolingSupportIntentRecorded: true, qualifiedSedationSeizureIntentRecorded: true, qualifiedTemperatureRenalCkBladderSurveillanceRecorded: true, qualifiedPhysostigmineEligibilityIntentRecorded: true, responseStateAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, monitoringAcquiredByLearner: false, ecgInterpretedByLearner: false, temperatureMeasuredByLearner: false, diagnosisMadeByLearner: false, alternativeExcludedByLearner: false, coolingSelectedByLearner: false, restraintSelectedByLearner: false, catheterSelectedByLearner: false, fluidSelectedByLearner: false, drugSelectedByLearner: false, airwaySelectedByLearner: false, treatmentDeliveredByLearner: false, antidoteEligibilityDetermined: false, durableTemperatureControlProven: false, renalSafetyProven: false, rhabdomyolysisExcluded: false, seizureExcluded: false, exposurePurityProven: false, treatmentEffectProven: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing cooling, restraint, catheter, dosing, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2202); const control = make(SCENARIO, 2202); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2203); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyAnticholinergicAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2204); const control = make(SCENARIO, 2204); hostile.step(); control.step(); for (const action of ['ice-bath', 'restrain-patient', 'place-catheter', 'dose-physostigmine', 'intubate', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['active-cooling', { active: true }], ['bolus', { drugId: 'physostigmine', amount: 2, unit: 'mg' }], ['airway-maneuver', { maneuver: 'intubate' }], ['cholinergic-pesticide-respiratory-failure-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE, 2205); const adjacentControl = make(CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE, 2205); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { POSTPARTUM_HEMORRHAGE_UTERINE_ATONY as SCENARIO } from '../../src/modules/obstetrics/scenarios/postpartum-hemorrhage-uterine-atony';
import { HEMORRHAGIC_SHOCK } from '../../src/modules/emergency-medicine/scenarios/hemorrhagic-shock';

const ACTIONS = [
  'reconcile-obstetrics-atony-hemorrhage-birth-clock-measured-loss-physiology-tone-and-whole-person',
  'recognize-obstetrics-atony-postpartum-hemorrhage-and-atony-pattern-without-threshold-tone-or-single-cause-closure',
  'activate-obstetrics-atony-hemorrhage-obstetric-anesthesia-nursing-blood-bank-operating-room-and-dignity-ownership',
  'review-obstetrics-atony-supplied-tone-placenta-tract-coagulation-perfusion-and-competing-cause-boundary',
  'record-obstetrics-atony-bounded-qualified-motive-bundle-escalation-intent-and-strict-later-review',
  'handoff-obstetrics-atony-recurrent-bleeding-shock-coagulopathy-blood-procedure-newborn-and-outcome-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2801) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'postpartum-hemorrhage-uterine-atony-response', payload: { action: action as never, ...extras } as never });

describe('Obstetrics postpartum hemorrhage from atony contract', () => {
  it('validates the fixture and keeps the strict later report bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['postpartum-hemorrhage-uterine-atony-transition', 'postpartum-hemorrhage-uterine-atony-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 118, systolicMmHg: 94, diastolicMmHg: 58, meanArterialMmHg: 70, respiratoryRateBpm: 24, spo2Percent: 98, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation.obstetricsAtonyAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, postpartumHemorrhageAndAtonyPatternAuthored: true, postpartumHemorrhageAndAtonyPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 104, systolicMmHg: 102, diastolicMmHg: 64, meanArterialMmHg: 77, respiratoryRateBpm: 20, spo2Percent: 99, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation.obstetricsAtonyAssessment).toMatchObject({ postpartumHemorrhageAndAtonyPatternRecognized: true, qualifiedSupportActive: true, uterinePlacentalTractCoagPerfusionAndDifferentialEvidenceReviewed: true, qualifiedMotiveBundleAndEscalationIntentRecorded: true, responseStateAuthored: true, bloodLossMeasuredByLearner: false, bloodLossCalculatedByLearner: false, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, uterineToneExaminedByLearner: false, placentaExaminedByLearner: false, genitalTractExaminedByLearner: false, diagnosisMadeByLearner: false, alternativeExcludedByLearner: false, massageSelectedByLearner: false, uterotonicSelectedByLearner: false, tranexamicAcidSelectedByLearner: false, fluidSelectedByLearner: false, bloodComponentSelectedByLearner: false, drugSelectedByLearner: false, doseSelectedByLearner: false, routeSelectedByLearner: false, accessSelectedByLearner: false, tamponadeSelectedByLearner: false, procedureSelectedByLearner: false, surgerySelectedByLearner: false, hysterectomySelectedByLearner: false, treatmentDeliveredByLearner: false, durableHemostasisProven: false, coagulationSafetyProven: false, concealedBleedingExcluded: false, transfusionNeedDetermined: false, procedureNeedDetermined: false, treatmentEffectProven: false, fertilityOutcomePredicted: false, maternalOutcomePredicted: false, newbornOutcomePredicted: false, outcomePredicted: false });
  });

  it('enforces order and elapsed gates while refusing treatment, PII, and trauma shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2802); const control = make(SCENARIO, 2802); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2803); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsAtonyAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2804); const control = make(SCENARIO, 2804); hostile.step(); control.step(); for (const action of ['measure-blood-loss', 'examine-uterus', 'massage-uterus', 'give-oxytocin', 'give-tranexamic-acid', 'give-crystalloid', 'give-packed-red-cells', 'perform-tamponade', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['bolus', { drugId: 'oxytocin', amount: 10, unit: 'units' }], ['hemorrhagic-shock-response', { action: 'recognize-traumatic-hemorrhagic-shock' }], ['opioid-xylazine-persistent-sedation-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(HEMORRHAGIC_SHOCK, 2805); const adjacentControl = make(HEMORRHAGIC_SHOCK, 2805); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

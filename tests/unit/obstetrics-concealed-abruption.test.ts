import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { CONCEALED_PLACENTAL_ABRUPTION_HEMORRHAGE as SCENARIO } from '../../src/modules/obstetrics/scenarios/concealed-placental-abruption-hemorrhage';
import { HEMORRHAGIC_SHOCK } from '../../src/modules/emergency-medicine/scenarios/hemorrhagic-shock';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 3001) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'concealed-placental-abruption-hemorrhage-response', payload: { action, ...extras } as never });

describe('Obstetrics concealed-abruption contract', () => {
  it('validates and exposes only the authored strict maternal-fetal report', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 126, systolicMmHg: 92, diastolicMmHg: 56, meanArterialMmHg: 68, respiratoryRateBpm: 26, spo2Percent: 98, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.obstetricsConcealedAbruptionAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, concealedHemorrhageMaternalFetalCoagulationPatternAuthored: true, concealedHemorrhagePatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action); subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 118, systolicMmHg: 98, diastolicMmHg: 60, meanArterialMmHg: 73, respiratoryRateBpm: 22, spo2Percent: 99, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.obstetricsConcealedAbruptionAssessment).toMatchObject({ concealedHemorrhagePatternRecognized: true, qualifiedSupportActive: true, maternalFetalCoagulationPlacentalAndDifferentialEvidenceReviewed: true, qualifiedResuscitationCoagulationAndUrgentDeliveryIntentRecorded: true, bloodLossMeasuredByLearner: false, totalBloodLossCalculatedByLearner: false, patientExaminedByLearner: false, fetalTraceInterpretedByLearner: false, ultrasoundAcquiredByLearner: false, diagnosisMadeByLearner: false, fluidSelectedByLearner: false, bloodComponentSelectedByLearner: false, anesthesiaSelectedByLearner: false, deliverySelectedByLearner: false, treatmentDeliveredByLearner: false, deliveryPerformedByLearner: false, treatmentEffectProven: false, concealedLossQuantified: false, coagulationSafetyProven: false, fetalRecoveryProven: false, deliveryCompleted: false, fertilityOutcomePredicted: false, maternalOutcomePredicted: false, newbornOutcomePredicted: false, outcomePredicted: false });
  });

  it('enforces order, elapsed time, hostile-input refusal, and adjacent-hemorrhage isolation', () => {
    const subject = make(); subject.step(); apply(subject, ACTIONS[3]); expect(subject.step().equipment.resuscitation.obstetricsConcealedAbruptionAssessment?.evidenceAtTick).toBeNull();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsConcealedAbruptionAssessment?.reassessmentAtTick).toBeNull(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsConcealedAbruptionAssessment?.handoffAtTick).toBeNull(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsConcealedAbruptionAssessment?.handoffAtTick).not.toBeNull();
    const hostile = make(SCENARIO, 3002); const control = make(SCENARIO, 3002); hostile.step(); control.step(); apply(hostile, '__proto__', { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['fluid', { fluidId: 'balanced-crystalloid', volumeMl: 1_000 }], ['hemorrhagic-shock-response', { action: 'recognize-traumatic-hemorrhagic-shock' }], ['postpartum-hemorrhage-uterine-atony-response', { action: 'give-packed-red-cells' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/); expect(refused.equipment.resuscitation.crystalloidTotalMl).toBe(0);
    const adjacent = make(HEMORRHAGIC_SHOCK, 3003); const adjacentControl = make(HEMORRHAGIC_SHOCK, 3003); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

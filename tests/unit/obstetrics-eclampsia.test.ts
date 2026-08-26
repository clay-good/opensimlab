import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { PREECLAMPSIA_URGENT_DELIVERY } from '@anesthesia/scenarios/preeclampsia-urgent-delivery';
import { ECLAMPSIA_FIRST_SEIZURE_RESPONSE as SCENARIO } from '../../src/modules/obstetrics/scenarios/eclampsia-first-seizure-response';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 3201) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'eclampsia-first-seizure-response', payload: { action, ...extras } as never });

describe('Obstetrics eclampsia contract', () => {
  it('validates, activates immediate qualified response, and exposes only fixed maternal-fetal reports', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 112, systolicMmHg: 176, diastolicMmHg: 118, meanArterialMmHg: 137, respiratoryRateBpm: 22, spo2Percent: 94, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.obstetricsEclampsiaAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, stoppedGeneralizedSeizurePressureOrganAndFetalPatternAuthored: true, eclampsiaEmergencyPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 3)) apply(subject, action); frame = subject.step();
    expect(frame.equipment.resuscitation.obstetricsEclampsiaAssessment).toMatchObject({ qualifiedSupportActive: true, evidenceAtTick: null });
    apply(subject, ACTIONS[3]); subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 102, systolicMmHg: 154, diastolicMmHg: 100, meanArterialMmHg: 118, respiratoryRateBpm: 18, spo2Percent: 97, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.obstetricsEclampsiaAssessment).toMatchObject({ eclampsiaEmergencyPatternRecognized: true, qualifiedSupportActive: true, neurologicAirwayAspirationOrganFetalMetabolicToxicInfectiousAndTraumaEvidenceReviewed: true, fixedLaterRecoveryPressureBreathingFetalAndOrganReportReviewed: true, seizureTimedByLearner: false, injuryProtectionPerformedByLearner: false, patientPositionedByLearner: false, patientExaminedByLearner: false, airwayOrAspirationAssessedByLearner: false, fetalStatusInterpretedByLearner: false, bloodPressureMeasuredByLearner: false, glucoseMeasuredByLearner: false, laboratoryAcquiredByLearner: false, imagingOrEegAcquiredByLearner: false, diagnosisMadeByLearner: false, alternativeExcludedByLearner: false, magnesiumSelectedByLearner: false, antihypertensiveSelectedByLearner: false, antiseizureDrugSelectedByLearner: false, doseSelectedByLearner: false, airwayOrVentilationSelectedByLearner: false, deliverySelectedByLearner: false, treatmentDeliveredByLearner: false, treatmentEffectProven: false, durableSeizureControlProven: false, durablePressureControlProven: false, neurologicRecoveryProven: false, fetalSafetyProven: false, maternalOutcomePredicted: false, newbornOutcomePredicted: false, outcomePredicted: false });
    expect(frame.equipment.resuscitation).toMatchObject({ preeclampsiaBloodPressureChecks: 0, labetalolTotalMg: 0, magnesiumSulfateTotalG: 0, seizureSuppressed: false });
  });

  it('enforces order and time while refusing legacy seizure, airway, drug, hostile-text, and adjacent actions', () => {
    const subject = make(); subject.step(); apply(subject, ACTIONS[3]); expect(subject.step().equipment.resuscitation.obstetricsEclampsiaAssessment?.evidenceAtTick).toBeNull();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsEclampsiaAssessment?.reassessmentAtTick).toBeNull(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsEclampsiaAssessment?.handoffAtTick).toBeNull(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsEclampsiaAssessment?.handoffAtTick).not.toBeNull();
    const hostile = make(SCENARIO, 3202); const control = make(SCENARIO, 3202); hostile.step(); control.step(); apply(hostile, '__proto__', { patientName: 'Patient Example', phone: '555-0100', notes: 'private note' });
    for (const [type, payload] of [['preeclampsia-response', { action: 'magnesium-sulfate-4g-iv' }], ['status-epilepticus-response', { action: 'give-lorazepam' }], ['seizure-suppression', {}], ['bolus', { drugId: 'magnesium-sulfate', amount: 4, unit: 'g' }], ['airway-maneuver', { maneuver: 'jaw-thrust' }], ['laryngoscopy', {}], ['ventilator', { fio2: 1 }]] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|555-0100|private note/); expect(refused.equipment.resuscitation).toMatchObject({ preeclampsiaBloodPressureChecks: 0, labetalolTotalMg: 0, magnesiumSulfateTotalG: 0, seizureSuppressed: false });
    const adjacent = make(PREECLAMPSIA_URGENT_DELIVERY, 3203); const adjacentControl = make(PREECLAMPSIA_URGENT_DELIVERY, 3203); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

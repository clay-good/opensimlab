import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { PREECLAMPSIA_URGENT_DELIVERY } from '@anesthesia/scenarios/preeclampsia-urgent-delivery';
import { POSTPARTUM_SEVERE_PREECLAMPSIA_WARNING_SIGNS as SCENARIO } from '../../src/modules/obstetrics/scenarios/postpartum-severe-preeclampsia-warning-signs';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 3101) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'postpartum-severe-preeclampsia-warning-signs-response', payload: { action, ...extras } as never });

describe('Obstetrics postpartum severe-preeclampsia contract', () => {
  it('validates, activates the urgent response before parallel review, and exposes only authored reports', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 96, systolicMmHg: 174, diastolicMmHg: 112, meanArterialMmHg: 133, respiratoryRateBpm: 20, spo2Percent: 97, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation.obstetricsPostpartumPreeclampsiaAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, postpartumSevereHypertensionSymptomAndOrganPatternAuthored: true, severePostpartumHypertensiveEmergencyRecognized: false });
    for (const action of ACTIONS.slice(0, 3)) apply(subject, action); frame = subject.step();
    expect(frame.equipment.resuscitation.obstetricsPostpartumPreeclampsiaAssessment).toMatchObject({ qualifiedSupportActive: true, evidenceAtTick: null });
    apply(subject, ACTIONS[3]); subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 92, systolicMmHg: 152, diastolicMmHg: 98, meanArterialMmHg: 116, respiratoryRateBpm: 18, spo2Percent: 98, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation.obstetricsPostpartumPreeclampsiaAssessment).toMatchObject({ severePostpartumHypertensiveEmergencyRecognized: true, qualifiedSupportActive: true, neurologicPulmonaryHematologicRenalHepaticMedicationAndDifferentialEvidenceReviewed: true, fixedLaterPressureSymptomOrganAndSupportReportReviewed: true, bloodPressureMeasuredByLearner: false, cuffSelectedByLearner: false, patientInterviewedByLearner: false, patientExaminedByLearner: false, laboratoryAcquiredByLearner: false, laboratoryInterpretedByLearner: false, imagingAcquiredByLearner: false, diagnosisMadeByLearner: false, antihypertensiveSelectedByLearner: false, magnesiumSelectedByLearner: false, doseSelectedByLearner: false, rateOrTargetSelectedByLearner: false, treatmentDeliveredByLearner: false, transferOrDispositionSelectedByLearner: false, followUpSelectedByLearner: false, treatmentEffectProven: false, durablePressureControlProven: false, symptomResolutionProven: false, seizureExcluded: false, organRecoveryProven: false, maternalOutcomePredicted: false, newbornOutcomePredicted: false, outcomePredicted: false });
    expect(frame.equipment.resuscitation).toMatchObject({ preeclampsiaBloodPressureChecks: 0, labetalolTotalMg: 0, magnesiumSulfateTotalG: 0 });
  });

  it('enforces order and time while refusing legacy treatment, hostile text, and adjacent-scenario crossover', () => {
    const subject = make(); subject.step(); apply(subject, ACTIONS[3]); expect(subject.step().equipment.resuscitation.obstetricsPostpartumPreeclampsiaAssessment?.evidenceAtTick).toBeNull();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsPostpartumPreeclampsiaAssessment?.reassessmentAtTick).toBeNull(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsPostpartumPreeclampsiaAssessment?.handoffAtTick).toBeNull(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsPostpartumPreeclampsiaAssessment?.handoffAtTick).not.toBeNull();
    const hostile = make(SCENARIO, 3102); const control = make(SCENARIO, 3102); hostile.step(); control.step(); apply(hostile, '__proto__', { patientName: 'Patient Example', phone: '555-0100', notes: 'private note' }); for (const [type, payload] of [['preeclampsia-response', { action: 'repeat-blood-pressure' }], ['preeclampsia-response', { action: 'labetalol-20mg-iv' }], ['preeclampsia-response', { action: 'magnesium-sulfate-4g-iv' }], ['bolus', { drugId: 'labetalol', amount: 20, unit: 'mg' }], ['hypertensive-emergency-response', { action: 'set-target-140' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|555-0100|private note/); expect(refused.equipment.resuscitation).toMatchObject({ preeclampsiaBloodPressureChecks: 0, labetalolTotalMg: 0, magnesiumSulfateTotalG: 0 });
    const adjacent = make(PREECLAMPSIA_URGENT_DELIVERY, 3103); const adjacentControl = make(PREECLAMPSIA_URGENT_DELIVERY, 3103); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

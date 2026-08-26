import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { OPIOID_XYLAZINE_PERSISTENT_SEDATION as SCENARIO } from '../../src/modules/toxicology/scenarios/opioid-xylazine-persistent-sedation';
import { OPIOID_TOXICITY } from '../../src/modules/emergency-medicine/scenarios/opioid-toxicity';

const ACTIONS = [
  'reconcile-toxicology-opioid-xylazine-exposure-rescue-breathing-sedation-perfusion-and-whole-patient',
  'recognize-toxicology-opioid-xylazine-opioid-emergency-and-possible-adulterant-without-pupil-naloxone-response-or-screen-only-closure',
  'activate-toxicology-opioid-xylazine-ventilation-oxygen-monitoring-toxicology-addiction-wound-and-dignity-ownership',
  'review-toxicology-opioid-xylazine-supplied-respiratory-response-circulation-temperature-glucose-ecg-screen-wound-and-differential-boundary',
  'record-toxicology-opioid-xylazine-bounded-qualified-continued-support-opioid-antagonist-symptomatic-care-no-veterinary-antagonist-and-strict-later-review',
  'handoff-toxicology-opioid-xylazine-recurrent-depression-persistent-sedation-shock-hypothermia-wound-withdrawal-addiction-and-outcome-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2701) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'opioid-xylazine-persistent-sedation-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology opioid-xylazine uncertainty contract', () => {
  it('validates the persistent-sedation fixture and keeps the authored respiratory response bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['sinus-bradycardia', 'opioid-xylazine-persistent-sedation-transition', 'opioid-xylazine-persistent-sedation-transition', 'opioid-xylazine-persistent-sedation-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus-bradycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 50, systolicMmHg: 86, diastolicMmHg: 48, meanArterialMmHg: 61, respiratoryRateBpm: 6, spo2Percent: 84, etco2MmHg: 62, coreTemperatureC: 35.5 });
    expect(frame.equipment.resuscitation.toxicologyOpioidXylazineAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, opioidEmergencyPersistentSedationAndPossibleAdulterantPatternAuthored: true, opioidEmergencyAndPossibleAdulterantPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 54, systolicMmHg: 90, diastolicMmHg: 52, meanArterialMmHg: 65, respiratoryRateBpm: 14, spo2Percent: 97, etco2MmHg: 43, coreTemperatureC: 35.5 });
    expect(frame.equipment.resuscitation.toxicologyOpioidXylazineAssessment).toMatchObject({ opioidEmergencyAndPossibleAdulterantPatternRecognized: true, qualifiedSupportActive: true, respiratoryCirculatoryTemperatureScreenSkinAndDifferentialEvidenceReviewed: true, qualifiedContinuedSupportOpioidAntagonistSymptomaticCareAndNoVeterinaryAntagonistIntentRecorded: true, responseStateAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, monitoringAcquiredByLearner: false, ecgInterpretedByLearner: false, bloodSampleAcquiredByLearner: false, toxicologyScreenInterpretedByLearner: false, skinExaminedByLearner: false, streetProductIdentifiedByLearner: false, diagnosisMadeByLearner: false, alternativeExcludedByLearner: false, oxygenSelectedByLearner: false, ventilationSelectedByLearner: false, opioidAntagonistSelectedByLearner: false, veterinaryAntagonistSelectedByLearner: false, drugSelectedByLearner: false, doseSelectedByLearner: false, routeSelectedByLearner: false, airwaySelectedByLearner: false, woundCareSelectedByLearner: false, treatmentDeliveredByLearner: false, adulterantConfirmedByLearner: false, naloxoneResistanceProven: false, durableVentilationProven: false, durablePerfusionProven: false, neurologicRecoveryProven: false, airwayRecoveryProven: false, aspirationExcluded: false, pulmonarySafetyProven: false, temperatureSafetyProven: false, woundSafetyProven: false, withdrawalSafetyProven: false, treatmentEffectProven: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing airway, drug, screen, wound, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2702); const control = make(SCENARIO, 2702); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2703); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyOpioidXylazineAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2704); const control = make(SCENARIO, 2704); hostile.step(); control.step(); for (const action of ['give-oxygen', 'bag-mask-ventilate', 'give-naloxone', 'give-atipamezole', 'order-xylazine-screen', 'treat-wound', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['bolus', { drugId: 'naloxone', amount: 2, unit: 'mg' }], ['opioid-toxicity-response', { action: 'review' }], ['delayed-local-anesthetic-cns-cardiac-toxicity-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(OPIOID_TOXICITY, 2705); const adjacentControl = make(OPIOID_TOXICITY, 2705); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

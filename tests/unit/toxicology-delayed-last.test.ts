import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { DELAYED_LOCAL_ANESTHETIC_CNS_CARDIAC_TOXICITY as SCENARIO } from '../../src/modules/toxicology/scenarios/delayed-local-anesthetic-cns-cardiac-toxicity';
import { LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY } from '../../src/modules/anesthesia/scenarios/local-anesthetic-systemic-toxicity';

const ACTIONS = [
  'reconcile-toxicology-delayed-last-source-clock-prodrome-seizure-cardiac-and-whole-patient',
  'recognize-toxicology-delayed-last-coupled-pattern-without-classic-sequence-clock-symptom-or-ecg-only-closure',
  'activate-toxicology-delayed-last-source-airway-seizure-cardiac-toxicology-lipid-and-refractory-rescue-ownership',
  'review-toxicology-delayed-last-supplied-source-delivery-cns-ecg-perfusion-acid-base-electrolyte-and-differential-boundary',
  'record-toxicology-delayed-last-bounded-qualified-source-airway-seizure-lipid-acid-base-modified-resuscitation-and-ecls-intent-with-strict-later-review',
  'handoff-toxicology-delayed-last-recurrent-seizure-arrhythmia-shock-airway-acidemia-source-lipid-and-refractory-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2601) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'delayed-local-anesthetic-cns-cardiac-toxicity-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology delayed LAST contract', () => {
  it('validates the delayed CNS-cardiac fixture and keeps the authored response bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['sinus-bradycardia', 'delayed-local-anesthetic-cns-cardiac-toxicity-transition', 'delayed-local-anesthetic-cns-cardiac-toxicity-transition', 'delayed-local-anesthetic-cns-cardiac-toxicity-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus-bradycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 48, systolicMmHg: 82, diastolicMmHg: 46, meanArterialMmHg: 58, respiratoryRateBpm: 10, spo2Percent: 92, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation.toxicologyDelayedLastAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, delayedSourceCnsCardiacPatternAuthored: true, delayedLastPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus');
    expect(frame.state).toMatchObject({ heartRateBpm: 76, systolicMmHg: 104, diastolicMmHg: 64, meanArterialMmHg: 77, respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation.toxicologyDelayedLastAssessment).toMatchObject({ delayedLastPatternRecognized: true, qualifiedSupportActive: true, sourceCnsEcgPerfusionAcidBaseElectrolyteAndDifferentialEvidenceReviewed: true, qualifiedSourceAirwaySeizureLipidAcidBaseModifiedResuscitationAndEclsIntentRecorded: true, responseStateAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, monitoringAcquiredByLearner: false, ecgInterpretedByLearner: false, bloodSampleAcquiredByLearner: false, sourceDeliveryInterpretedByLearner: false, catheterHandledByLearner: false, diagnosisMadeByLearner: false, alternativeExcludedByLearner: false, oxygenSelectedByLearner: false, ventilationSelectedByLearner: false, seizureCareSelectedByLearner: false, lipidSelectedByLearner: false, drugSelectedByLearner: false, doseSelectedByLearner: false, routeSelectedByLearner: false, airwaySelectedByLearner: false, rhythmCareSelectedByLearner: false, eclsSelectedByLearner: false, treatmentDeliveredByLearner: false, rescueEligibilityDetermined: false, durableSeizureControlProven: false, durableRhythmStabilityProven: false, durablePerfusionStabilityProven: false, neurologicRecoveryProven: false, airwayRecoveryProven: false, acidBaseSafetyProven: false, electrolyteSafetyProven: false, lipidSafetyProven: false, sourceCompletenessProven: false, treatmentEffectProven: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing catheter, oxygen, seizure, lipid, cardiac, ECLS, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2602); const control = make(SCENARIO, 2602); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2603); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyDelayedLastAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2604); const control = make(SCENARIO, 2604); hostile.step(); control.step(); for (const action of ['disconnect-catheter', 'give-oxygen', 'suppress-seizure', 'dose-lipid', 'start-ecls', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['seizure-suppression', {}], ['lipid-emulsion', {}], ['bolus', { drugId: 'epinephrine', amount: 1, unit: 'mg' }], ['methanol-visual-acidosis-gaps-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY, 2605); const adjacentControl = make(LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY, 2605); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

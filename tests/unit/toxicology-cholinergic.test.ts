import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE as SCENARIO } from '../../src/modules/toxicology/scenarios/cholinergic-pesticide-respiratory-failure';
import { DIGOXIN_RHYTHM_POTASSIUM } from '../../src/modules/toxicology/scenarios/digoxin-rhythm-potassium';

const ACTIONS = [
  'reconcile-toxicology-cholinergic-product-route-secondary-contamination-secretions-breathing-weakness-cns-and-whole-patient',
  'recognize-toxicology-cholinergic-muscarinic-nicotinic-and-cns-pattern-without-mnemonic-or-cholinesterase-only-closure',
  'activate-toxicology-cholinergic-ppe-decontamination-airway-resuscitation-poison-center-and-safety-ownership',
  'review-toxicology-cholinergic-supplied-respiratory-neuromuscular-cns-exposure-cholinesterase-and-airway-boundary',
  'record-toxicology-cholinergic-bounded-qualified-atropine-pralidoxime-benzodiazepine-airway-and-surveillance-intent-with-strict-later-review',
  'handoff-toxicology-cholinergic-recurrent-secretions-bronchospasm-weakness-intermediate-syndrome-exposure-seizure-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2101) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'cholinergic-pesticide-respiratory-failure-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology cholinergic contract', () => {
  it('validates the exposure-respiratory fixture and keeps the authored response bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['sinus-bradycardia', 'cholinergic-pesticide-respiratory-failure-transition', 'cholinergic-pesticide-respiratory-failure-transition', 'cholinergic-pesticide-respiratory-failure-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus-bradycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 48, systolicMmHg: 86, diastolicMmHg: 50, meanArterialMmHg: 62, respiratoryRateBpm: 30, spo2Percent: 86, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation.toxicologyCholinergicAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, safetyAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, exposureRespiratoryNeuromuscularAndCnsPatternAuthored: true, cholinergicPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus');
    expect(frame.state).toMatchObject({ heartRateBpm: 82, systolicMmHg: 104, diastolicMmHg: 64, meanArterialMmHg: 77, respiratoryRateBpm: 18, spo2Percent: 96 });
    expect(frame.equipment.resuscitation.toxicologyCholinergicAssessment).toMatchObject({ cholinergicPatternRecognized: true, qualifiedSafetyOwnershipActive: true, respiratoryNeuromuscularCnsExposureAndLaboratoryEvidenceReviewed: true, qualifiedAtropineIntentRecorded: true, qualifiedPralidoximeIntentRecorded: true, qualifiedBenzodiazepineIfNeededIntentRecorded: true, qualifiedAirwayVentilationIntentRecorded: true, qualifiedDecontaminationIntentRecorded: true, responseStateAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, monitoringAcquiredByLearner: false, cholinesteraseInterpretedByLearner: false, diagnosisMadeByLearner: false, ppeSelectedByLearner: false, decontaminationPerformedByLearner: false, fluidSelectedByLearner: false, drugSelectedByLearner: false, airwaySelectedByLearner: false, ventilationSelectedByLearner: false, neuromuscularBlockerSelectedByLearner: false, treatmentDeliveredByLearner: false, durableVentilationProven: false, neuromuscularRecoveryProven: false, decontaminationCompleteProven: false, coWorkerSafetyProven: false, seizureExcluded: false, treatmentEffectProven: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing decontamination, dosing, airway, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2102); const control = make(SCENARIO, 2102); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2103); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyCholinergicAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, safetyAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2104); const control = make(SCENARIO, 2104); hostile.step(); control.step(); for (const action of ['remove-clothing', 'wash-patient', 'dose-atropine', 'intubate', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['bolus', { drugId: 'atropine', amount: 10, unit: 'mg' }], ['airway-maneuver', { maneuver: 'intubate' }], ['digoxin-rhythm-potassium-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(DIGOXIN_RHYTHM_POTASSIUM, 2105); const adjacentControl = make(DIGOXIN_RHYTHM_POTASSIUM, 2105); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

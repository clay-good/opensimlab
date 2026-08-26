import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY as SCENARIO } from '../../src/modules/toxicology/scenarios/tricyclic-sodium-channel-cardiotoxicity';
import { SALICYLATE_FALLING_NUMBER } from '../../src/modules/toxicology/scenarios/salicylate-falling-number';

const ACTIONS = [
  'reconcile-toxicology-tricyclic-product-clock-cns-seizure-perfusion-ecg-and-whole-patient',
  'recognize-toxicology-tricyclic-sodium-channel-cardiotoxicity-pattern-without-qrs-only-closure',
  'activate-toxicology-tricyclic-poison-center-resuscitation-cardiac-airway-seizure-and-safety-ownership',
  'review-toxicology-tricyclic-supplied-ecg-perfusion-acid-base-electrolyte-coingestion-and-rescue-boundary',
  'record-toxicology-tricyclic-bounded-qualified-bicarbonate-and-rescue-intent-with-strict-later-review',
  'handoff-toxicology-tricyclic-recurrent-conduction-shock-seizure-acidemia-rescue-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2081) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'tricyclic-sodium-channel-cardiotoxicity-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology tricyclic contract', () => {
  it('validates the electrical fixture and keeps the authored response bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['tricyclic-sodium-channel-tachycardia', 'tricyclic-sodium-channel-cardiotoxicity-transition', 'tricyclic-sodium-channel-cardiotoxicity-transition', 'tricyclic-sodium-channel-cardiotoxicity-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('tricyclic-sodium-channel-tachycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 132, systolicMmHg: 82, diastolicMmHg: 48, meanArterialMmHg: 59, respiratoryRateBpm: 20, coreTemperatureC: 37.4 });
    expect(frame.equipment.resuscitation.toxicologyTricyclicAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, exposureAndElectricalPatternAuthored: true, sodiumChannelPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus-tachycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 112, systolicMmHg: 106, diastolicMmHg: 66, meanArterialMmHg: 79 });
    expect(frame.equipment.resuscitation.toxicologyTricyclicAssessment).toMatchObject({ sodiumChannelPatternRecognized: true, qualifiedSupportActive: true, ecgAndLaboratoryEvidenceReviewed: true, qualifiedBicarbonateIntentRecorded: true, qualifiedRescuePreparednessRecorded: true, responseStateAuthored: true, ecgAcquiredByLearner: false, ecgInterpretedByLearner: false, diagnosisMadeByLearner: false, fluidSelectedByLearner: false, drugSelectedByLearner: false, airwaySelectedByLearner: false, ventilationSelectedByLearner: false, rhythmTreatmentSelectedByLearner: false, rescueSelectedByLearner: false, treatmentDeliveredByLearner: false, durableElectricalStabilityProven: false, seizureRecurrenceExcluded: false, coingestionExcluded: false, rescueEligibilityDetermined: false, treatmentEffectProven: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing dosing, airway, rescue, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2082); const control = make(SCENARIO, 2082); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2083); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyTricyclicAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2084); const control = make(SCENARIO, 2084); hostile.step(); control.step(); for (const action of ['set-bicarbonate-dose', 'intubate', 'select-lipid-emulsion', 'start-ecls', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['ventilator', { respiratoryRateBpm: 10 }], ['bolus', { drugId: 'bicarbonate', amount: 100, unit: 'mEq' }], ['salicylate-falling-number-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(SALICYLATE_FALLING_NUMBER, 2085); const adjacentControl = make(SALICYLATE_FALLING_NUMBER, 2085); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

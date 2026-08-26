import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { CALCIUM_CHANNEL_BLOCKER_SHOCK as SCENARIO } from '../../src/modules/toxicology/scenarios/calcium-channel-blocker-shock';
import { BETA_BLOCKER_CARDIOGENIC_SHOCK } from '../../src/modules/toxicology/scenarios/beta-blocker-cardiogenic-shock';

const ACTIONS = [
  'reconcile-toxicology-calcium-channel-blocker-product-formulation-clock-perfusion-rhythm-glucose-and-whole-patient',
  'recognize-toxicology-calcium-channel-blocker-mixed-shock-pattern-without-glucose-or-pulse-only-closure',
  'activate-toxicology-calcium-channel-blocker-poison-center-resuscitation-cardiac-metabolic-airway-and-safety-ownership',
  'review-toxicology-calcium-channel-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary',
  'record-toxicology-calcium-channel-blocker-bounded-qualified-vasopressor-calcium-insulin-euglycemia-and-rescue-intent-with-strict-later-review',
  'handoff-toxicology-calcium-channel-blocker-recurrent-shock-av-block-hyperglycemia-electrolyte-volume-rescue-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2091) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'calcium-channel-blocker-shock-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology calcium-channel-blocker contract', () => {
  it('validates the mixed-shock fixture and keeps the authored response bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['complete-heart-block', 'calcium-channel-blocker-shock-transition', 'calcium-channel-blocker-shock-transition', 'calcium-channel-blocker-shock-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('complete-heart-block');
    expect(frame.state).toMatchObject({ heartRateBpm: 34, systolicMmHg: 68, diastolicMmHg: 36, meanArterialMmHg: 47, respiratoryRateBpm: 18, coreTemperatureC: 36.3 });
    expect(frame.equipment.resuscitation.toxicologyCalciumChannelBlockerAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, exposurePerfusionConductionAndMetabolicPatternAuthored: true, calciumChannelBlockerShockPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus');
    expect(frame.state).toMatchObject({ heartRateBpm: 64, systolicMmHg: 96, diastolicMmHg: 58, meanArterialMmHg: 71 });
    expect(frame.equipment.resuscitation.toxicologyCalciumChannelBlockerAssessment).toMatchObject({ calciumChannelBlockerShockPatternRecognized: true, qualifiedSupportActive: true, ecgCardiacMetabolicPriorCareAndAbsorptionEvidenceReviewed: true, qualifiedVasopressorIntentRecorded: true, qualifiedCalciumIntentRecorded: true, qualifiedInsulinEuglycemiaIntentRecorded: true, qualifiedRescuePreparednessRecorded: true, responseStateAuthored: true, ecgAcquiredByLearner: false, ecgInterpretedByLearner: false, cardiacImagingAcquiredByLearner: false, diagnosisMadeByLearner: false, decontaminationSelectedByLearner: false, glucoseOrElectrolyteSelectedByLearner: false, fluidSelectedByLearner: false, drugSelectedByLearner: false, airwaySelectedByLearner: false, pacingSelectedByLearner: false, rescueSelectedByLearner: false, treatmentDeliveredByLearner: false, durablePerfusionStabilityProven: false, absorptionComplete: false, glucoseStabilityProven: false, electrolyteStabilityProven: false, coingestionExcluded: false, rescueEligibilityDetermined: false, treatmentEffectProven: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing dosing, pacing, rescue, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2092); const control = make(SCENARIO, 2092); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2093); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyCalciumChannelBlockerAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2094); const control = make(SCENARIO, 2094); hostile.step(); control.step(); for (const action of ['set-insulin-dose', 'pace', 'select-calcium', 'start-ecls', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['vasopressor', { agentId: 'norepinephrine' }], ['bolus', { drugId: 'calcium-chloride', amount: 1, unit: 'g' }], ['rhythm', { rhythmId: 'paced' }], ['beta-blocker-cardiogenic-shock-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(BETA_BLOCKER_CARDIOGENIC_SHOCK, 2095); const adjacentControl = make(BETA_BLOCKER_CARDIOGENIC_SHOCK, 2095); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

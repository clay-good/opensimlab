import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { BETA_BLOCKER_CARDIOGENIC_SHOCK as SCENARIO } from '../../src/modules/toxicology/scenarios/beta-blocker-cardiogenic-shock';
import { TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY } from '../../src/modules/toxicology/scenarios/tricyclic-sodium-channel-cardiotoxicity';

const ACTIONS = [
  'reconcile-toxicology-beta-blocker-product-clock-pulse-perfusion-mentation-glucose-ecg-and-whole-patient',
  'recognize-toxicology-beta-blocker-cardiogenic-shock-pattern-without-pulse-only-closure',
  'activate-toxicology-beta-blocker-poison-center-resuscitation-cardiac-glucose-airway-and-safety-ownership',
  'review-toxicology-beta-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary',
  'record-toxicology-beta-blocker-bounded-qualified-vasopressor-glucagon-insulin-euglycemia-and-rescue-intent-with-strict-later-review',
  'handoff-toxicology-beta-blocker-recurrent-shock-bradycardia-hypoglycemia-electrolyte-volume-rescue-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2086) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'beta-blocker-cardiogenic-shock-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology beta-blocker contract', () => {
  it('validates the shock fixture and keeps the authored response bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['sinus-bradycardia', 'beta-blocker-cardiogenic-shock-transition', 'beta-blocker-cardiogenic-shock-transition', 'beta-blocker-cardiogenic-shock-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus-bradycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 42, systolicMmHg: 72, diastolicMmHg: 40, meanArterialMmHg: 51, respiratoryRateBpm: 18, coreTemperatureC: 36.5 });
    expect(frame.equipment.resuscitation.toxicologyBetaBlockerAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, exposurePerfusionAndMetabolicPatternAuthored: true, betaBlockerShockPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 58, systolicMmHg: 98, diastolicMmHg: 60, meanArterialMmHg: 73 });
    expect(frame.equipment.resuscitation.toxicologyBetaBlockerAssessment).toMatchObject({ betaBlockerShockPatternRecognized: true, qualifiedSupportActive: true, ecgCardiacMetabolicAndPriorCareEvidenceReviewed: true, qualifiedVasopressorIntentRecorded: true, qualifiedGlucagonIntentRecorded: true, qualifiedInsulinEuglycemiaIntentRecorded: true, qualifiedRescuePreparednessRecorded: true, responseStateAuthored: true, ecgAcquiredByLearner: false, ecgInterpretedByLearner: false, cardiacImagingAcquiredByLearner: false, diagnosisMadeByLearner: false, glucoseOrElectrolyteSelectedByLearner: false, fluidSelectedByLearner: false, drugSelectedByLearner: false, airwaySelectedByLearner: false, pacingSelectedByLearner: false, dialysisSelectedByLearner: false, rescueSelectedByLearner: false, treatmentDeliveredByLearner: false, durablePerfusionStabilityProven: false, glucoseStabilityProven: false, electrolyteStabilityProven: false, coingestionExcluded: false, rescueEligibilityDetermined: false, treatmentEffectProven: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing dosing, pacing, rescue, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2087); const control = make(SCENARIO, 2087); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2088); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyBetaBlockerAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2089); const control = make(SCENARIO, 2089); hostile.step(); control.step(); for (const action of ['set-insulin-dose', 'pace', 'select-lipid-emulsion', 'start-ecls', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['vasopressor', { agentId: 'norepinephrine' }], ['bolus', { drugId: 'glucagon', amount: 5, unit: 'mg' }], ['rhythm', { rhythmId: 'paced' }], ['tricyclic-sodium-channel-cardiotoxicity-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY, 2090); const adjacentControl = make(TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY, 2090); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

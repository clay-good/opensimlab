import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { DIGOXIN_RHYTHM_POTASSIUM as SCENARIO } from '../../src/modules/toxicology/scenarios/digoxin-rhythm-potassium';
import { CALCIUM_CHANNEL_BLOCKER_SHOCK } from '../../src/modules/toxicology/scenarios/calcium-channel-blocker-shock';

const ACTIONS = [
  'reconcile-toxicology-digoxin-product-clock-gi-visual-perfusion-rhythm-potassium-and-whole-patient',
  'recognize-toxicology-digoxin-life-threatening-pattern-without-level-rhythm-or-potassium-only-closure',
  'activate-toxicology-digoxin-poison-center-resuscitation-cardiac-electrolyte-airway-and-safety-ownership',
  'review-toxicology-digoxin-supplied-ecg-level-timing-potassium-renal-coingestion-and-antidote-boundary',
  'record-toxicology-digoxin-bounded-qualified-immune-fab-surveillance-and-rescue-intent-with-strict-later-review',
  'handoff-toxicology-digoxin-recurrent-arrhythmia-potassium-shift-level-interference-renal-rescue-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2096) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'digoxin-rhythm-potassium-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology digoxin contract', () => {
  it('validates the rhythm-potassium fixture and keeps the authored response bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['complete-heart-block', 'digoxin-rhythm-potassium-transition', 'digoxin-rhythm-potassium-transition', 'digoxin-rhythm-potassium-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('complete-heart-block');
    expect(frame.state).toMatchObject({ heartRateBpm: 36, systolicMmHg: 76, diastolicMmHg: 42, meanArterialMmHg: 53, respiratoryRateBpm: 18, coreTemperatureC: 36.4 });
    expect(frame.equipment.resuscitation.toxicologyDigoxinAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, exposureRhythmPotassiumAndLevelPatternAuthored: true, lifeThreateningDigoxinPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus');
    expect(frame.state).toMatchObject({ heartRateBpm: 62, systolicMmHg: 100, diastolicMmHg: 62, meanArterialMmHg: 75 });
    expect(frame.equipment.resuscitation.toxicologyDigoxinAssessment).toMatchObject({ lifeThreateningDigoxinPatternRecognized: true, qualifiedSupportActive: true, ecgLevelTimingPotassiumRenalPriorCareAndAntidoteEvidenceReviewed: true, qualifiedImmuneFabIntentRecorded: true, qualifiedRhythmPotassiumSurveillanceRecorded: true, qualifiedRescuePreparednessRecorded: true, responseStateAuthored: true, ecgAcquiredByLearner: false, ecgInterpretedByLearner: false, levelInterpretedByLearner: false, diagnosisMadeByLearner: false, decontaminationSelectedByLearner: false, glucoseOrElectrolyteSelectedByLearner: false, fluidSelectedByLearner: false, drugSelectedByLearner: false, vialCountSelectedByLearner: false, airwaySelectedByLearner: false, pacingSelectedByLearner: false, dialysisSelectedByLearner: false, rescueSelectedByLearner: false, treatmentDeliveredByLearner: false, durablePerfusionStabilityProven: false, potassiumStabilityProven: false, assayInterferenceResolved: false, coingestionExcluded: false, antidoteEligibilityDetermined: false, rescueEligibilityDetermined: false, treatmentEffectProven: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing Fab dosing, electrolytes, pacing, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2097); const control = make(SCENARIO, 2097); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2098); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyDigoxinAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2099); const control = make(SCENARIO, 2099); hostile.step(); control.step(); for (const action of ['calculate-fab-vials', 'give-potassium', 'pace', 'dialyze', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['bolus', { drugId: 'digoxin-immune-fab', amount: 8, unit: 'vials' }], ['rhythm', { rhythmId: 'paced' }], ['calcium-channel-blocker-shock-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(CALCIUM_CHANNEL_BLOCKER_SHOCK, 2100); const adjacentControl = make(CALCIUM_CHANNEL_BLOCKER_SHOCK, 2100); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

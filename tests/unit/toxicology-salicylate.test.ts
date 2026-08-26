import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SALICYLATE_FALLING_NUMBER as SCENARIO } from '../../src/modules/toxicology/scenarios/salicylate-falling-number';
import { ACETAMINOPHEN_CLOCK_AND_NOMOGRAM } from '../../src/modules/toxicology/scenarios/acetaminophen-clock-and-nomogram';

const ACTIONS = [
  'reconcile-toxicology-salicylate-product-exposure-clock-symptoms-breathing-and-whole-patient',
  'recognize-toxicology-salicylate-mixed-acid-base-pattern-without-single-concentration-closure',
  'activate-toxicology-salicylate-poison-center-emergency-critical-care-nephrology-and-safety-ownership',
  'review-toxicology-salicylate-supplied-serial-level-acid-base-volume-electrolyte-and-airway-boundary',
  'record-toxicology-salicylate-bounded-qualified-alkalinization-and-dialysis-preparedness-with-strict-later-review',
  'handoff-toxicology-salicylate-cns-pulmonary-acidemia-absorption-extracorporeal-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2076) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'salicylate-falling-number-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology salicylate contract', () => {
  it('validates the mixed fixture and makes a falling number clinically worse', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['salicylate-falling-number-transition', 'salicylate-falling-number-transition', 'salicylate-falling-number-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 108, systolicMmHg: 116, diastolicMmHg: 74, meanArterialMmHg: 88, respiratoryRateBpm: 30, coreTemperatureC: 37.6 });
    expect(frame.equipment.resuscitation.toxicologySalicylateAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, acuteExposureAuthored: true, mixedAcidBasePatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 114, respiratoryRateBpm: 30 });
    expect(frame.equipment.resuscitation.toxicologySalicylateAssessment).toMatchObject({ mixedAcidBasePatternRecognized: true, qualifiedSupportActive: true, serialEvidenceReviewed: true, qualifiedAlkalinizationIntentRecorded: true, qualifiedDialysisPreparednessRecorded: true, deteriorationStateAuthored: true, acidBaseCalculatedByLearner: false, diagnosisMadeByLearner: false, fluidSelectedByLearner: false, drugSelectedByLearner: false, airwayPlanSelectedByLearner: false, ventilationSelectedByLearner: false, dialysisSelectedByLearner: false, treatmentDeliveredByLearner: false, tissueConcentrationProven: false, ongoingAbsorptionExcluded: false, pulmonaryComplicationsExcluded: false, dialysisEligibilityDetermined: false, treatmentEffectProven: false, safetyDispositionDetermined: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing airway, dialysis, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 2077); const control = make(SCENARIO, 2077); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 2078); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologySalicylateAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2079); const control = make(SCENARIO, 2079); hostile.step(); control.step(); for (const action of ['set-bicarbonate-rate', 'intubate', 'select-hemodialysis', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['ventilator', { respiratoryRateBpm: 10 }], ['bolus', { drugId: 'bicarbonate', amount: 100, unit: 'mEq' }], ['acetaminophen-clock-and-nomogram-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(ACETAMINOPHEN_CLOCK_AND_NOMOGRAM, 2080); const adjacentControl = make(ACETAMINOPHEN_CLOCK_AND_NOMOGRAM, 2080); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

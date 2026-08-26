import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { METHANOL_VISUAL_ACIDOSIS_GAPS as SCENARIO } from '../../src/modules/toxicology/scenarios/methanol-visual-acidosis-gaps';
import { SYMPATHOMIMETIC_HYPERADRENERGIC_HYPERTHERMIA } from '../../src/modules/toxicology/scenarios/sympathomimetic-hyperadrenergic-hyperthermia';

const ACTIONS = [
  'reconcile-toxicology-methanol-source-clock-vision-acid-base-gaps-and-whole-patient',
  'recognize-toxicology-methanol-coupled-pattern-without-source-vision-anion-osmolar-or-level-only-closure',
  'activate-toxicology-methanol-resuscitation-airway-antidote-extracorporeal-toxicology-laboratory-and-vision-ownership',
  'review-toxicology-methanol-supplied-acid-base-osmolar-electrolyte-renal-visual-coingestion-and-differential-boundary',
  'record-toxicology-methanol-bounded-qualified-source-antidote-cofactor-acid-base-extracorporeal-surveillance-and-airway-intent-with-strict-later-review',
  'handoff-toxicology-methanol-rebound-acidosis-vision-neurologic-airway-renal-electrolyte-coingestion-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2501) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'methanol-visual-acidosis-gaps-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology methanol contract', () => {
  it('validates the visual-acidosis fixture and keeps the authored response bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['sinus-tachycardia', 'methanol-visual-acidosis-gaps-transition', 'methanol-visual-acidosis-gaps-transition', 'methanol-visual-acidosis-gaps-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.equipment.rhythmId).toBe('sinus-tachycardia');
    expect(frame.state).toMatchObject({ heartRateBpm: 118, systolicMmHg: 110, diastolicMmHg: 68, meanArterialMmHg: 82, respiratoryRateBpm: 30, spo2Percent: 98, coreTemperatureC: 36.6 });
    expect(frame.equipment.resuscitation.toxicologyMethanolAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, exposureVisualAcidosisAndGapsPatternAuthored: true, methanolPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 106, systolicMmHg: 112, diastolicMmHg: 70, meanArterialMmHg: 84, respiratoryRateBpm: 26, spo2Percent: 98, coreTemperatureC: 36.6 });
    expect(frame.equipment.resuscitation.toxicologyMethanolAssessment).toMatchObject({ methanolPatternRecognized: true, qualifiedSupportActive: true, acidBaseOsmolarRenalVisualAndDifferentialEvidenceReviewed: true, qualifiedSourceAntidoteCofactorAcidBaseExtracorporealAndAirwayIntentRecorded: true, responseStateAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, monitoringAcquiredByLearner: false, ecgInterpretedByLearner: false, bloodSampleAcquiredByLearner: false, gapCalculatedByLearner: false, laboratoryInterpretedByLearner: false, diagnosisMadeByLearner: false, alternativeExcludedByLearner: false, drugSelectedByLearner: false, doseSelectedByLearner: false, routeSelectedByLearner: false, airwaySelectedByLearner: false, ventilationSelectedByLearner: false, extracorporealTreatmentSelectedByLearner: false, treatmentDeliveredByLearner: false, antidoteEligibilityDetermined: false, extracorporealEligibilityDetermined: false, toxinClearanceProven: false, durableAcidBaseControlProven: false, visualRecoveryProven: false, neurologicRecoveryProven: false, renalSafetyProven: false, electrolyteSafetyProven: false, exposureCompletenessProven: false, treatmentEffectProven: false, outcomePredicted: false });
  });

  it('enforces sequence and elapsed gates while refusing calculations, antidote, airway, dialysis, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) { const subject = make(SCENARIO, 2502); const control = make(SCENARIO, 2502); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation); }
    const subject = make(SCENARIO, 2503); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyMethanolAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2504); const control = make(SCENARIO, 2504); hostile.step(); control.step(); for (const action of ['calculate-osmolar-gap', 'give-fomepizole', 'set-dialysis-threshold', 'intubate', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['bolus', { drugId: 'fomepizole', amount: 1, unit: 'mg' }], ['airway-maneuver', { maneuver: 'intubate' }], ['sympathomimetic-hyperadrenergic-hyperthermia-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(SYMPATHOMIMETIC_HYPERADRENERGIC_HYPERTHERMIA, 2505); const adjacentControl = make(SYMPATHOMIMETIC_HYPERADRENERGIC_HYPERTHERMIA, 2505); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

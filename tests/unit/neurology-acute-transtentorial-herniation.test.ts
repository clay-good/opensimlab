import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ACUTE_TRANSTENTORIAL_HERNIATION_PATTERN as SCENARIO } from '../../src/modules/neurology/scenarios/acute-transtentorial-herniation-pattern';
import { RAISED_INTRACRANIAL_PRESSURE_VISUAL_THREAT } from '../../src/modules/neurology/scenarios/raised-intracranial-pressure-visual-threat';

const ACTIONS = [
  'reconcile-neurology-herniation-clock-consciousness-pupils-motor-physiology-and-whole-patient',
  'recognize-neurology-converging-transtentorial-herniation-pattern-without-isolated-pupil-or-complete-triad',
  'activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership',
  'review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary',
  'review-neurology-herniation-strict-later-qualified-rescue-and-unresolved-neurologic-trajectory',
  'handoff-neurology-herniation-lesion-airway-pressure-seizure-surgery-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 1841) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'acute-transtentorial-herniation-pattern-response', payload: { action: action as never, ...extras } as never });

describe('Neurology acute transtentorial herniation contract', () => {
  it('validates the exact fixture and reveals only the supplied emergency trajectory', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'acute-transtentorial-herniation-pattern-reassessment',
      'acute-transtentorial-herniation-pattern-reassessment',
      'acute-transtentorial-herniation-pattern-reassessment-boundary',
    ]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 54, respiratoryRateBpm: 14,
      meanArterialMmHg: 130, coreTemperatureC: 36.9 });
    expect(frame.state.systolicMmHg).toBeCloseTo(168, 0);
    expect(frame.state.diastolicMmHg).toBeCloseTo(111, 0);
    expect(frame.state.spo2Percent).toBeCloseTo(97, 0);
    expect(frame.equipment.resuscitation.neurologyHerniationAssessment).toMatchObject({
      trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null,
      boundaryAtTick: null, laterAtTick: null, handoffAtTick: null,
      acuteTranstentorialHerniationPatternAuthored: true,
      convergingPatternRecognized: false, qualifiedOwnershipActive: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.resuscitation.neurologyHerniationAssessment).toMatchObject({
      convergingPatternRecognized: true, qualifiedOwnershipActive: true,
      qualifiedBrainRescueBoundaryReviewed: true, laterQualifiedRescueAuthored: true,
      patientHistoryTakenByLearner: false, patientExaminedByLearner: false,
      scoreCalculatedByLearner: false, imagingInterpretedByLearner: false,
      diagnosisMadeByLearner: false, airwayProcedurePerformedByLearner: false,
      drugSelectedByLearner: false, doseSelectedByLearner: false,
      procedureSelectedByLearner: false, treatmentDeliveredByLearner: false,
      treatmentEffectProven: false, neurologicRecoveryProven: false,
      durablePressureControlProven: false, definitiveSourceControlProven: false,
      outcomePredicted: false,
    });
  });

  it('enforces order and elapsed gates while refusing treatment, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 1842); const control = make(SCENARIO, 1842);
      subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 1843); subject.step();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]);
    apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyHerniationAssessment)
      .toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, ownershipAtTick: 1,
        boundaryAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 1844); const control = make(SCENARIO, 1844);
    hostile.step(); control.step();
    for (const action of ['intubate', 'give-mannitol', 'select-craniectomy', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' });
    for (const [type, payload] of [['intracranial-hypertension-response', { action: 'activate-individualized-hyperosmolar-rescue' }], ['airway-device', { device: 'endotracheal-tube' }], ['bolus', { drugId: 'mannitol', amount: 80, unit: 'g' }], ['raised-intracranial-pressure-visual-threat-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state);
    expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(RAISED_INTRACRANIAL_PRESSURE_VISUAL_THREAT, 1845);
    const adjacentControl = make(RAISED_INTRACRANIAL_PRESSURE_VISUAL_THREAT, 1845);
    adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]);
    expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

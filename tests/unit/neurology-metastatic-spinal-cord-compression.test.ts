import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { METASTATIC_SPINAL_CORD_COMPRESSION as SCENARIO } from '../../src/modules/neurology/scenarios/metastatic-spinal-cord-compression';
import { ACUTE_TRANSTENTORIAL_HERNIATION_PATTERN } from '../../src/modules/neurology/scenarios/acute-transtentorial-herniation-pattern';

const ACTIONS = [
  'reconcile-neurology-mscc-cancer-pain-motor-sensory-bladder-and-whole-patient-clock',
  'recognize-neurology-mscc-oncologic-emergency-before-imaging-confirmation',
  'activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership',
  'review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary',
  'review-neurology-mscc-strict-later-qualified-mri-and-unresolved-function-trajectory',
  'handoff-neurology-mscc-level-stability-function-bladder-definitive-care-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 1941) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'metastatic-spinal-cord-compression-response', payload: { action: action as never, ...extras } as never });

describe('Neurology metastatic spinal cord compression contract', () => {
  it('validates the exact fixture and reveals only the supplied cord trajectory', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'metastatic-spinal-cord-compression-reassessment',
      'metastatic-spinal-cord-compression-reassessment',
      'metastatic-spinal-cord-compression-reassessment-boundary',
    ]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 88, respiratoryRateBpm: 14,
      coreTemperatureC: 36.8 });
    expect(frame.state.meanArterialMmHg).toBeCloseTo(96, 5);
    expect(frame.state.systolicMmHg).toBeCloseTo(126, 0);
    expect(frame.state.diastolicMmHg).toBeCloseTo(81, 0);
    expect(frame.state.spo2Percent).toBeCloseTo(97, 0);
    expect(frame.equipment.resuscitation.neurologyMsccAssessment).toMatchObject({
      trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null,
      boundaryAtTick: null, laterAtTick: null, handoffAtTick: null,
      suspectedMetastaticSpinalCordCompressionAuthored: true,
      emergencyRecognizedBeforeImaging: false, qualifiedOwnershipActive: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.resuscitation.neurologyMsccAssessment).toMatchObject({
      emergencyRecognizedBeforeImaging: true, qualifiedOwnershipActive: true,
      qualifiedCareBoundaryReviewed: true, laterQualifiedMriAuthored: true,
      patientHistoryTakenByLearner: false, patientExaminedByLearner: false,
      patientMovedByLearner: false, imagingOrderedByLearner: false,
      imagingInterpretedByLearner: false, diagnosisMadeByLearner: false,
      drugSelectedByLearner: false, doseSelectedByLearner: false,
      procedureSelectedByLearner: false, treatmentDeliveredByLearner: false,
      treatmentEffectProven: false, neurologicRecoveryProven: false,
      definitiveTreatmentProven: false, outcomePredicted: false,
    });
  });

  it('enforces order and elapsed gates while refusing treatment, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 1942); const control = make(SCENARIO, 1942);
      subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 1943); subject.step();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]);
    apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyMsccAssessment)
      .toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, ownershipAtTick: 1,
        boundaryAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 1944); const control = make(SCENARIO, 1944);
    hostile.step(); control.step();
    for (const action of ['give-dexamethasone', 'move-patient', 'order-mri', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' });
    for (const [type, payload] of [['acute-transtentorial-herniation-pattern-response', { action: 'review' }], ['bolus', { drugId: 'dexamethasone', amount: 16, unit: 'mg' }], ['airway-device', { device: 'endotracheal-tube' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state);
    expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(ACUTE_TRANSTENTORIAL_HERNIATION_PATTERN, 1945);
    const adjacentControl = make(ACUTE_TRANSTENTORIAL_HERNIATION_PATTERN, 1945);
    adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]);
    expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

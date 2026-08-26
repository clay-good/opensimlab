import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ACUTE_DELIRIUM_REVERSIBLE_CAUSES as SCENARIO } from '../../src/modules/neurology/scenarios/acute-delirium-reversible-causes';
import { NONCONVULSIVE_STATUS_EPILEPTICUS_RECOGNITION } from '../../src/modules/neurology/scenarios/nonconvulsive-status-epilepticus-recognition';

const ACTIONS = [
  'reconcile-neurology-delirium-baseline-clock-fluctuation-attention-perception-function-and-whole-patient',
  'recognize-neurology-delirium-indicators-and-qualified-assessment-boundary-without-dementia-or-single-cause-closure',
  'activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership',
  'review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary',
  'review-neurology-delirium-strict-later-contributor-and-unresolved-cognitive-trajectory',
  'handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2041) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'acute-delirium-reversible-causes-response', payload: { action: action as never, ...extras } as never });

describe('Neurology acute delirium contract', () => {
  it('validates the exact fixture and reveals only the supplied trajectory', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['acute-delirium-reversible-causes-reassessment', 'acute-delirium-reversible-causes-reassessment', 'acute-delirium-reversible-causes-reassessment-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 92, respiratoryRateBpm: 14, coreTemperatureC: 37 });
    expect(frame.state.meanArterialMmHg).toBeCloseTo(97, 5);
    expect(frame.state.spo2Percent).toBeCloseTo(97, 0);
    expect(frame.equipment.resuscitation.neurologyDeliriumAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null, boundaryAtTick: null, laterAtTick: null, handoffAtTick: null, acuteFluctuationAuthored: true, qualifiedAssessmentBoundaryRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.resuscitation.neurologyDeliriumAssessment).toMatchObject({ qualifiedAssessmentBoundaryRecognized: true, qualifiedOwnershipActive: true, qualifiedContributorBoundaryReviewed: true, laterContributorsAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, scoreCalculatedByLearner: false, capacityAssessedByLearner: false, diagnosisMadeByLearner: false, restraintSelectedByLearner: false, observationSelectedByLearner: false, drugSelectedByLearner: false, treatmentDeliveredByLearner: false, singleCauseProven: false, treatmentEffectProven: false, cognitiveRecoveryProven: false, outcomePredicted: false });
  });

  it('enforces order and elapsed gates while refusing treatment, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 2042); const control = make(SCENARIO, 2042); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 2043); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.neurologyDeliriumAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, ownershipAtTick: 1, boundaryAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2044); const control = make(SCENARIO, 2044); hostile.step(); control.step(); for (const action of ['give-haloperidol', 'apply-restraint', 'test-capacity', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['nonconvulsive-status-epilepticus-recognition-response', { action: 'review' }], ['bolus', { drugId: 'haloperidol', amount: 5, unit: 'mg' }], ['metastatic-spinal-cord-compression-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(NONCONVULSIVE_STATUS_EPILEPTICUS_RECOGNITION, 2045); const adjacentControl = make(NONCONVULSIVE_STATUS_EPILEPTICUS_RECOGNITION, 2045); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

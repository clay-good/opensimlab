import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { AUTONOMIC_DYSREFLEXIA_AUTHORED_TRIGGER as SCENARIO } from '../../src/modules/neurology/scenarios/autonomic-dysreflexia-authored-trigger';
import { GUILLAIN_BARRE_RESPIRATORY_DECLINE } from '../../src/modules/neurology/scenarios/guillain-barre-respiratory-decline';

const ACTIONS = [
  'reconcile-neurology-autonomic-dysreflexia-lesion-baseline-pressure-symptoms-rhythm-and-whole-patient',
  'recognize-neurology-autonomic-dysreflexia-pattern-without-closing-alternatives-or-definitive-diagnosis',
  'activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership',
  'review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role',
  'reassess-neurology-autonomic-dysreflexia-strict-pressure-pulse-symptom-and-trigger-transition',
  'handoff-neurology-autonomic-dysreflexia-baseline-triggers-recurrence-complications-prevention-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2051) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'autonomic-dysreflexia-authored-trigger-response', payload: { action: action as never, ...extras } as never });

describe('Neurology autonomic dysreflexia contract', () => {
  it('validates the exact fixture and changes canonical pressure and pulse through bounded states', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['autonomic-dysreflexia-authored-trigger-transition', 'autonomic-dysreflexia-authored-trigger-transition', 'autonomic-dysreflexia-authored-trigger-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 48, systolicMmHg: 178, diastolicMmHg: 106, meanArterialMmHg: 130, respiratoryRateBpm: 16, coreTemperatureC: 36.8 });
    expect(frame.state.spo2Percent).toBeCloseTo(98, 0);
    expect(frame.equipment.resuscitation.neurologyAutonomicDysreflexiaAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, triggerAtTick: null, reassessmentAtTick: null, handoffAtTick: null, baselineRelativePatternAuthored: true, syndromePatternRecognized: false });
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, ACTIONS[2]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 50, systolicMmHg: 166, diastolicMmHg: 98, meanArterialMmHg: 121 });
    apply(subject, ACTIONS[3]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 60, systolicMmHg: 124, diastolicMmHg: 76, meanArterialMmHg: 92 });
    apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 64, systolicMmHg: 108, diastolicMmHg: 66, meanArterialMmHg: 80 });
    expect(frame.equipment.resuscitation.neurologyAutonomicDysreflexiaAssessment).toMatchObject({ syndromePatternRecognized: true, qualifiedSupportActive: true, externalTubingKinkReleased: true, responseStateAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, monitoringAcquiredByLearner: false, diagnosisMadeByLearner: false, catheterManipulatedByLearner: false, bowelCarePerformedByLearner: false, drugSelectedByLearner: false, procedurePerformedByLearner: false, soleCauseProven: false, individualizedResponsePredicted: false, durableResolutionProven: false, complicationsExcluded: false, recurrenceExcluded: false, outcomePredicted: false });
  });

  it('enforces order and elapsed gates while refusing treatment, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 2052); const control = make(SCENARIO, 2052); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 2053); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.neurologyAutonomicDysreflexiaAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, triggerAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2054); const control = make(SCENARIO, 2054); hostile.step(); control.step(); for (const action of ['give-nifedipine', 'irrigate-catheter', 'perform-bowel-care', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['guillain-barre-respiratory-decline-response', { action: 'review' }], ['bolus', { drugId: 'nifedipine', amount: 10, unit: 'mg' }], ['acute-delirium-reversible-causes-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(GUILLAIN_BARRE_RESPIRATORY_DECLINE, 2055); const adjacentControl = make(GUILLAIN_BARRE_RESPIRATORY_DECLINE, 2055); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

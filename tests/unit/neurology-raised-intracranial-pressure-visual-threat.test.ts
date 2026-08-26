import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { RAISED_INTRACRANIAL_PRESSURE_VISUAL_THREAT as SCENARIO } from '../../src/modules/neurology/scenarios/raised-intracranial-pressure-visual-threat';
import { SUSPECTED_HERPES_SIMPLEX_ENCEPHALITIS } from '../../src/modules/neurology/scenarios/suspected-herpes-simplex-encephalitis';

const ACTIONS = [
  'reconcile-neurology-raised-icp-headache-visual-tinnitus-diplopia-and-whole-patient',
  'activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership',
  'review-neurology-raised-icp-confirmed-papilledema-visual-function-and-pseudopapilledema-boundary',
  'review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary',
  'review-neurology-raised-icp-strict-later-worsening-visual-field-and-imminent-sight-threat',
  'handoff-neurology-raised-icp-vision-rescue-cause-disease-headache-follow-up-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 1836) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'raised-intracranial-pressure-visual-threat-response', payload: { action: action as never, ...extras } as never });

describe('Neurology raised intracranial pressure visual-threat contract', () => {
  it('validates the exact fixture and reveals only the supplied visual trajectory', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'raised-intracranial-pressure-visual-threat-reassessment',
      'raised-intracranial-pressure-visual-threat-reassessment',
      'raised-intracranial-pressure-visual-threat-reassessment-boundary',
    ]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 82, respiratoryRateBpm: 16,
      systolicMmHg: 132, diastolicMmHg: 78, meanArterialMmHg: 96,
      spo2Percent: 99, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.neurologyRaisedIcpAssessment).toMatchObject({
      trajectoryAtTick: null, ownershipAtTick: null, eyesAtTick: null,
      diagnosticsAtTick: null, laterAtTick: null, handoffAtTick: null,
      raisedPressureVisualSyndromeAuthored: true, qualifiedOwnershipActive: false,
      confirmedPapilledemaReviewed: false, laterVisualFieldDeteriorationAuthored: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.resuscitation.neurologyRaisedIcpAssessment).toMatchObject({
      qualifiedOwnershipActive: true, confirmedPapilledemaReviewed: true,
      qualifiedDiagnosticsReviewed: true, laterVisualFieldDeteriorationAuthored: true,
      patientHistoryTakenByLearner: false, patientExaminedByLearner: false,
      ophthalmicTestInterpretedByLearner: false, imagingInterpretedByLearner: false,
      lumbarPuncturePerformedByLearner: false, diagnosisMadeByLearner: false,
      drugSelectedByLearner: false, procedureSelectedByLearner: false,
      treatmentDeliveredByLearner: false, visualRescueProven: false,
      herniationAuthored: false, outcomePredicted: false,
    });
  });

  it('enforces order and elapsed gates while refusing treatment, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 1837); const control = make(SCENARIO, 1837);
      subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 1838); subject.step();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]);
    apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyRaisedIcpAssessment)
      .toMatchObject({ trajectoryAtTick: 1, ownershipAtTick: 1, eyesAtTick: 1,
        diagnosticsAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 1839); const control = make(SCENARIO, 1839);
    hostile.step(); control.step();
    for (const action of ['give-acetazolamide', 'perform-lp', 'select-shunt', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' });
    for (const [type, payload] of [['intracranial-hypertension-response', { action: 'hyperosmolar-rescue' }], ['bolus', { drugId: 'acetazolamide', amount: 500, unit: 'mg' }], ['suspected-herpes-simplex-encephalitis-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state);
    expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(SUSPECTED_HERPES_SIMPLEX_ENCEPHALITIS, 1840);
    const adjacentControl = make(SUSPECTED_HERPES_SIMPLEX_ENCEPHALITIS, 1840);
    adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]);
    expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

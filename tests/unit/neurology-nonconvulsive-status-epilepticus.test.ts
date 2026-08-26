import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { NONCONVULSIVE_STATUS_EPILEPTICUS_RECOGNITION as SCENARIO } from '../../src/modules/neurology/scenarios/nonconvulsive-status-epilepticus-recognition';
import { FOCAL_MOTOR_STATUS_EPILEPTICUS_ESCALATION } from '../../src/modules/neurology/scenarios/focal-motor-status-epilepticus-escalation';

const ACTIONS = [
  'reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient',
  'recognize-neurology-ncse-suspicion-and-urgent-eeg-boundary-without-clinical-diagnosis',
  'activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership',
  'review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives',
  'review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory',
  'handoff-neurology-ncse-cause-treatment-recurrence-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 1811) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) =>
  subject.apply({ tick: subject.tick, type: 'nonconvulsive-status-epilepticus-recognition-response',
    payload: { action: action as never, ...extras } as never });

describe('Neurology nonconvulsive-status engine contract', () => {
  it('validates the exact narrative fixture and reveals only the fixed qualified report', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'nonconvulsive-status-epilepticus-recognition-reassessment',
      'nonconvulsive-status-epilepticus-recognition-reassessment-boundary',
    ]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 88, respiratoryRateBpm: 17,
      systolicMmHg: 148, diastolicMmHg: 78, meanArterialMmHg: 102,
      spo2Percent: 97, coreTemperatureC: 36.9 });
    expect(frame.equipment.resuscitation.neurologyNcseAssessment).toMatchObject({
      trajectoryAtTick: null, suspicionAtTick: null, ownershipAtTick: null,
      alternativesAtTick: null, laterAtTick: null, handoffAtTick: null,
      fluctuatingDysfunctionAuthored: true, noConvulsionAuthored: true,
      urgentEegBoundaryRecognized: false, laterElectrographicStatusReportAuthored: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 92, respiratoryRateBpm: 18,
      systolicMmHg: 144, diastolicMmHg: 76, meanArterialMmHg: 99,
      spo2Percent: 96, coreTemperatureC: 37 });
    expect(frame.equipment.resuscitation.neurologyNcseAssessment).toMatchObject({
      urgentEegBoundaryRecognized: true, qualifiedNeurologyOwnershipActive: true,
      qualifiedEegOwnershipActive: true, laterElectrographicStatusReportAuthored: true,
      patientExaminedByLearner: false, rawEegInterpretedByLearner: false,
      clinicalOnlyNcseDiagnosisMade: false, treatmentDeliveredByLearner: false,
      causeProven: false, treatmentEffectProven: false,
      durableElectrographicControlProven: false, outcomePredicted: false,
    });
  });

  it('enforces every prerequisite and both elapsed gates', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 1812); const control = make(SCENARIO, 1812);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 1813); subject.step();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]);
    apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyNcseAssessment).toMatchObject({
      trajectoryAtTick: 1, suspicionAtTick: 1, ownershipAtTick: 1,
      alternativesAtTick: 1, laterAtTick: 2, handoffAtTick: 3,
    });
  });

  it('refuses malformed, treatment, raw-EEG, and adjacent-scenario shortcuts without retaining PII', () => {
    const subject = make(SCENARIO, 1814); const control = make(SCENARIO, 1814);
    subject.step(); control.step();
    for (const malformed of [undefined, null, {}, '__proto__', 'interpret-raw-eeg',
      'give-benzodiazepine', 'intubate']) apply(subject, malformed,
      { patientName: 'Patient Example', phone: '312-555-0199', notes: 'private note' });
    for (const [type, payload] of [['bolus', { drugId: 'lorazepam', amount: 4, unit: 'mg' }],
      ['airway-device', { deviceId: 'ett' }], ['seizure-suppression', { route: 'iv' }]] as const)
      subject.apply({ tick: -999, type, payload: payload as never });
    const refused = subject.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|312-555-0199|private note/);
    for (const scenario of [FOCAL_MOTOR_STATUS_EPILEPTICUS_ESCALATION,
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }]) {
      const candidate = make(scenario, 1815); const adjacentControl = make(scenario, 1815);
      candidate.step(); adjacentControl.step(); apply(candidate, ACTIONS[0]);
      expect(candidate.step().equipment.resuscitation)
        .toEqual(adjacentControl.step().equipment.resuscitation);
    }
  });
});

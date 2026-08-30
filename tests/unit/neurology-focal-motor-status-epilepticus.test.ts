import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay-engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import type { LearnerAction } from '@platform/kernel/protocol';
import { FOCAL_MOTOR_STATUS_EPILEPTICUS_ESCALATION as SCENARIO } from '../../src/modules/neurology/scenarios/focal-motor-status-epilepticus-escalation';
import { STATUS_EPILEPTICUS as EM_STATUS } from '../../src/modules/emergency-medicine/scenarios/status-epilepticus';
import { STATUS_EPILEPTICUS as ICU_STATUS } from '../../src/modules/critical-care/scenarios/status-epilepticus';
import { PEDIATRIC_STATUS_EPILEPTICUS } from '../../src/modules/pediatrics/scenarios/pediatric-status-epilepticus';

const ACTIONS = [
  'reconcile-neurology-focal-motor-status-clock-semiology-recovery-and-whole-patient',
  'recognize-neurology-focal-motor-status-despite-reduced-convulsions',
  'activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership',
  'review-neurology-focal-motor-status-airway-glucose-causes-and-injury-boundary',
  'review-neurology-focal-motor-status-strict-later-visible-motor-trajectory',
  'handoff-neurology-focal-motor-status-recovery-cause-and-active-risk',
] as const;
const responseType = 'focal-motor-status-epilepticus-escalation-response';
const make = (scenario = SCENARIO, seed = 1805) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown,
  extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick,
  type: responseType, payload: { action: action as never, ...extras } as never });

describe('Neurology focal motor status engine contract', () => {
  it('validates the exact narrative-only fixture and two targets', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.id).toBe('focal-motor-status-epilepticus-escalation');
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 58, sex: 'female', heightCm: 166,
      weightKg: 68 });
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'focal-motor-status-epilepticus-escalation-reassessment',
      'focal-motor-status-epilepticus-escalation-reassessment-boundary',
    ]);
    expect(SCENARIO.timeline.every(({ type }) => type === 'narrative')).toBe(true);
  });

  it('reveals only the fixed strict-later visible-motor trajectory', () => {
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 118, respiratoryRateBpm: 22,
      systolicMmHg: 132, diastolicMmHg: 80, meanArterialMmHg: 97,
      spo2Percent: 96, coreTemperatureC: 37.2 });
    expect(frame.equipment.resuscitation.neurologyFocalMotorStatusAssessment).toMatchObject({
      trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null,
      safetyAtTick: null, laterAtTick: null, handoffAtTick: null,
      overtFocalClonusAuthored: true, meaningfulRecoveryAbsentAuthored: true,
      focalMotorStatusRecognized: false, qualifiedSeizureOwnershipActive: false,
      laterVisibleClonusAuthored: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    frame = subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 122, respiratoryRateBpm: 23,
      systolicMmHg: 128, diastolicMmHg: 78, meanArterialMmHg: 95,
      spo2Percent: 95, coreTemperatureC: 37.3 });
    expect(frame.equipment.resuscitation.neurologyFocalMotorStatusAssessment).toMatchObject({
      focalMotorStatusRecognized: true, qualifiedSeizureOwnershipActive: true,
      qualifiedAirwayOwnershipActive: true, laterVisibleClonusAuthored: true,
      patientExaminedByLearner: false, seizureTimedByLearner: false,
      monitoringAcquiredByLearner: false, glucoseAcquiredByLearner: false,
      eegAcquiredByLearner: false, eegInterpretedByLearner: false,
      drugSelectedByLearner: false, doseSelectedByLearner: false,
      routeSelectedByLearner: false, medicationDeliveredByLearner: false,
      oxygenSelectedByLearner: false, airwayDeviceSelectedByLearner: false,
      treatmentDeliveredByLearner: false, nonconvulsiveStatusDiagnosedByLearner: false,
      causeProven: false, movementCessationProven: false,
      electrographicControlProven: false, treatmentEffectProven: false,
      durableNeurologicRecoveryProven: false, outcomePredicted: false,
    });
  });

  it('enforces all serial prerequisites and both strict elapsed gates without mutation', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, attempted] of cases) {
      const subject = make(SCENARIO, 1806); const control = make(SCENARIO, 1806);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 1807); const control = make(SCENARIO, 1807);
    subject.step(); control.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(control, action); }
    apply(subject, ACTIONS[4]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[4]); apply(control, ACTIONS[4]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyFocalMotorStatusAssessment)
      .toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, ownershipAtTick: 1,
        safetyAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });
  });

  it('refuses malformed, PII-bearing, treatment, EEG, airway, and adjacent shortcuts', () => {
    const subject = make(SCENARIO, 1808); const control = make(SCENARIO, 1808);
    subject.step(); control.step();
    const secrets = ['Patient Example', '312-555-0199', '101 Example Street', 'private note'];
    for (const malformed of [undefined, null, [], {}, Object.create(null), '__proto__',
      'give-benzodiazepine', 'give-antiseizure-drug', 'order-eeg', 'intubate', 'declare-control'])
      apply(subject, malformed, { patientName: secrets[0], phone: secrets[1],
        address: secrets[2], notes: secrets[3] });
    for (const [type, payload] of [
      ['status-epilepticus-response', { action: 'give-lorazepam-4-mg-iv' }],
      ['critical-care-status-epilepticus-response', { action: 'activate-refractory-status-pathway' }],
      ['pediatric-status-epilepticus-response', { action: 'activate-pediatric-status-epilepticus-qualified-second-line-ownership' }],
      ['bolus', { drugId: 'lorazepam', amount: 4, unit: 'mg' }],
      ['airway-device', { deviceId: 'ett' }], ['laryngoscopy', {}],
      ['seizure-suppression', { route: 'iv', medicationClass: 'benzodiazepine' }],
      ['chest-compressions', { active: true }], ['defibrillation', { energyJ: 200 }],
    ] as const) subject.apply({ tick: -999, type, payload: payload as never });
    const refused = subject.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    for (const secret of secrets) expect(JSON.stringify(refused.events)).not.toContain(secret);
  });

  it('preserves exact evidence, duplicates, deterministic replay, and adjacent isolation', () => {
    const subject = make(SCENARIO, 1809); const events = [...subject.step().events];
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
    let frame = subject.step(); events.push(...frame.events);
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]); frame = subject.step(); events.push(...frame.events);
    apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]); frame = subject.step(); events.push(...frame.events);
    for (const suffix of ['trajectory-reconciled', 'recognized', 'qualified-ownership-activated',
      'safety-and-causes-reviewed', 'later-motor-trajectory-reviewed', 'active-risk-handoff-recorded'])
      expect(events.some(({ eventId }) => new RegExp(`^neurology-focal-motor-status-${suffix}-\\d+$`).test(eventId))).toBe(true);
    const actions: LearnerAction[] = ACTIONS.map((action, index) => ({ tick: index < 4 ? 0 : index - 3,
      type: responseType, payload: { action } }));
    const options = { scenario: SCENARIO, seed: 1809, practiceRegion: 'US', ticks: 11 };
    expect(replay(actions, options)).toEqual(replay(actions, options));
    const wrong = [{ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'focal-status' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, EM_STATUS, ICU_STATUS,
      PEDIATRIC_STATUS_EPILEPTICUS];
    for (const scenario of wrong) {
      const candidate = make(scenario, 1810); const control = make(scenario, 1810);
      candidate.step(); control.step(); apply(candidate, ACTIONS[0]);
      expect(candidate.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
  });
});

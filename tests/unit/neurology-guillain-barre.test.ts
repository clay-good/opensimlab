import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { GUILLAIN_BARRE_RESPIRATORY_DECLINE as SCENARIO } from '../../src/modules/neurology/scenarios/guillain-barre-respiratory-decline';
import { MYASTHENIC_CRISIS_ESCALATION } from '../../src/modules/neurology/scenarios/myasthenic-crisis-escalation';

const ACTIONS = [
  'reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient',
  'review-neurology-gbs-supportive-evidence-mimics-and-diagnostic-boundary',
  'recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff',
  'activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership',
  'review-neurology-gbs-strict-later-respiratory-bulbar-and-autonomic-trajectory',
  'handoff-neurology-gbs-airway-dysautonomia-treatment-recurrence-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 1821) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) =>
  subject.apply({ tick: subject.tick, type: 'guillain-barre-respiratory-decline-response',
    payload: { action: action as never, ...extras } as never });

describe('Neurology Guillain-Barré engine contract', () => {
  it('validates the exact fixture and reveals only the supplied later decline', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'guillain-barre-respiratory-decline-reassessment',
      'guillain-barre-respiratory-decline-reassessment',
      'guillain-barre-respiratory-decline-reassessment-boundary',
    ]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 112, respiratoryRateBpm: 24,
      systolicMmHg: 132, diastolicMmHg: 74, meanArterialMmHg: 93,
      spo2Percent: 98, coreTemperatureC: 37.1 });
    expect(frame.equipment.resuscitation.neurologyGbsAssessment).toMatchObject({
      trajectoryAtTick: null, evidenceAtTick: null, recognitionAtTick: null,
      ownershipAtTick: null, laterAtTick: null, handoffAtTick: null,
      ascendingWeaknessAuthored: true, autonomicLabilityAuthored: true,
      highRiskRespiratoryDeclineRecognized: false, laterRespiratoryDeclineAuthored: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 118, respiratoryRateBpm: 30,
      systolicMmHg: 142, diastolicMmHg: 86, meanArterialMmHg: 105,
      spo2Percent: 96, coreTemperatureC: 37.2 });
    expect(frame.equipment.resuscitation.neurologyGbsAssessment).toMatchObject({
      highRiskRespiratoryDeclineRecognized: true,
      qualifiedNeurocriticalOwnershipActive: true, qualifiedAirwayOwnershipActive: true,
      qualifiedCardiacMonitoringOwnershipActive: true,
      laterRespiratoryDeclineAuthored: true, laterAutonomicLabilityAuthored: true,
      patientExaminedByLearner: false, scoreCalculatedByLearner: false,
      respiratoryMechanicsAcquiredByLearner: false, ventilationSelectedByLearner: false,
      airwayProcedurePerformedByLearner: false, rhythmTreatmentDeliveredByLearner: false,
      treatmentDeliveredByLearner: false, diagnosisProven: false,
      treatmentEffectProven: false, respiratoryArrestAuthored: false, outcomePredicted: false,
    });
  });

  it('enforces strict order and time while refusing treatment, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 1822); const control = make(SCENARIO, 1822);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 1823); subject.step();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]);
    apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyGbsAssessment)
      .toMatchObject({ trajectoryAtTick: 1, evidenceAtTick: 1, recognitionAtTick: 1,
        ownershipAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 1824); const control = make(SCENARIO, 1824);
    hostile.step(); control.step();
    for (const action of ['give-ivig', 'start-plasma-exchange', 'intubate', '__proto__'])
      apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' });
    for (const [type, payload] of [['myasthenic-crisis-escalation-response', { action: 'recognize-neurology-impending-myasthenic-crisis-without-spo2-or-single-cutoff-reassurance' }],
      ['ventilator', { mode: 'volume-control' }], ['airway-device', { deviceId: 'ett' }],
      ['bolus', { drugId: 'immune-globulin', amount: 30, unit: 'g' }]] as const)
      hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state);
    expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(MYASTHENIC_CRISIS_ESCALATION, 1825);
    const adjacentControl = make(MYASTHENIC_CRISIS_ESCALATION, 1825);
    adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]);
    expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { MYASTHENIC_CRISIS_ESCALATION as SCENARIO } from '../../src/modules/neurology/scenarios/myasthenic-crisis-escalation';
import { NEUROMUSCULAR_RESPIRATORY_FAILURE_REASSESSMENT } from '../../src/modules/respiratory-medicine/scenarios/neuromuscular-respiratory-failure-reassessment';

const ACTIONS = [
  'reconcile-neurology-myasthenic-crisis-clock-fatigability-bulbar-respiratory-and-whole-patient',
  'recognize-neurology-impending-myasthenic-crisis-without-spo2-or-single-cutoff-reassurance',
  'activate-neurology-myasthenic-crisis-qualified-neurocritical-and-airway-capable-ownership',
  'review-neurology-myasthenic-crisis-secretion-aspiration-infection-medication-and-alternative-causes',
  'review-neurology-myasthenic-crisis-strict-later-bulbar-ventilatory-and-supplied-airway-trajectory',
  'handoff-neurology-myasthenic-crisis-trigger-treatment-weaning-recurrence-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 1816) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) =>
  subject.apply({ tick: subject.tick, type: 'myasthenic-crisis-escalation-response',
    payload: { action: action as never, ...extras } as never });

describe('Neurology myasthenic-crisis engine contract', () => {
  it('validates the exact fixture and reveals only the supplied later crisis transition', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'myasthenic-crisis-escalation-reassessment', 'myasthenic-crisis-escalation-reassessment',
      'myasthenic-crisis-escalation-reassessment-boundary',
    ]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 104, respiratoryRateBpm: 22,
      systolicMmHg: 128, diastolicMmHg: 76, meanArterialMmHg: 94,
      spo2Percent: 97, coreTemperatureC: 38.1 });
    expect(frame.equipment.resuscitation.neurologyMyasthenicCrisisAssessment).toMatchObject({
      trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null, causesAtTick: null,
      laterAtTick: null, handoffAtTick: null, rapidFatigableWeaknessAuthored: true,
      impendingCrisisRecognized: false, laterManifestCrisisAuthored: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 112, respiratoryRateBpm: 30,
      systolicMmHg: 124, diastolicMmHg: 74, meanArterialMmHg: 91,
      spo2Percent: 95, coreTemperatureC: 38.3 });
    expect(frame.equipment.resuscitation.neurologyMyasthenicCrisisAssessment).toMatchObject({
      impendingCrisisRecognized: true, qualifiedNeurocriticalOwnershipActive: true,
      qualifiedAirwayOwnershipActive: true, laterManifestCrisisAuthored: true,
      suppliedInvasiveVentilationAuthored: true, patientExaminedByLearner: false,
      respiratoryMechanicsAcquiredByLearner: false, ventilationSelectedByLearner: false,
      airwayProcedurePerformedByLearner: false, treatmentDeliveredByLearner: false,
      triggerProven: false, treatmentEffectProven: false, outcomePredicted: false,
    });
  });

  it('enforces strict order and time while refusing treatment, reversal, PII, and ALS shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 1817); const control = make(SCENARIO, 1817);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 1818); subject.step();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]);
    apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyMyasthenicCrisisAssessment)
      .toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, ownershipAtTick: 1,
        causesAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 1819); const control = make(SCENARIO, 1819);
    hostile.step(); control.step();
    for (const action of ['give-ivig', 'start-plasma-exchange', 'intubate', '__proto__'])
      apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' });
    for (const [type, payload] of [['neuromuscular-reversal', { agent: 'sugammadex' }],
      ['ventilator', { mode: 'volume-control' }], ['airway-device', { deviceId: 'ett' }],
      ['bolus', { drugId: 'pyridostigmine', amount: 60, unit: 'mg' }]] as const)
      hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state);
    expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(NEUROMUSCULAR_RESPIRATORY_FAILURE_REASSESSMENT, 1820);
    const adjacentControl = make(NEUROMUSCULAR_RESPIRATORY_FAILURE_REASSESSMENT, 1820);
    adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]);
    expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});

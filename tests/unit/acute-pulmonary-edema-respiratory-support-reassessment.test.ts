import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { ACUTE_PULMONARY_EDEMA_RESPIRATORY_SUPPORT_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-pulmonary-edema-respiratory-support-reassessment';
import { ACUTE_PULMONARY_EDEMA } from '../../src/modules/emergency-medicine/scenarios/acute-pulmonary-edema';
import { ACUTE_DECOMPENSATED_HEART_FAILURE } from '../../src/modules/cardiology/scenarios/acute-decompensated-heart-failure';

const ACTIONS = ['reconcile-ape-initial-care-and-trajectory',
  'review-ape-progressive-respiratory-failure',
  'review-ape-pressure-perfusion-congestion-and-causes',
  'activate-ape-airway-capable-escalation',
  'handoff-ape-respiratory-support-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'acute-pulmonary-edema-respiratory-support-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('acute pulmonary edema respiratory-support reassessment', () => {
  it('is valid and distinct from initial rescue and inpatient transition labs', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect([ACUTE_PULMONARY_EDEMA.metadata.id,
      ACUTE_DECOMPENSATED_HEART_FAILURE.metadata.id]).not.toContain(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['Thirty minutes later', 'SpO₂ is 86%', 'pH 7.18',
      'PaCO₂ 68 mmHg', 'fatigue, not improvement']) expect(narrative).toContain(anchor);
    expect(narrative).toMatch(/do not examine/i);
  });

  it('calibrates the live monitor to the active-failure report', () => {
    const result = new AnesthesiaEngine({ scenario: SCENARIO, seed: 701,
      practiceRegion: 'US' }).step();
    expect(result.state).toMatchObject({ heartRateBpm: 104, respiratoryRateBpm: 12,
      spo2Percent: 86, etco2MmHg: 60, systolicMmHg: 108, diastolicMmHg: 68,
      meanArterialMmHg: 81, coreTemperatureC: 36.8 });
    expect(result.equipment.ventilator).toMatchObject({ delivering: true, fio2: 0.6 });
  });

  it('enforces every serial gate and a strictly later handoff', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 702, practiceRegion: 'US' });
    const onset = subject.step();
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    const refused = subject.step();
    expect(refused.equipment.resuscitation.apeSupportAssessment).toMatchObject({
      trajectoryAtTick: null, failureAtTick: null, wholePatientAtTick: null,
      escalationAtTick: null, handoffAtTick: null, pulmonaryEdemaAuthored: true,
      supportAlreadyActiveAuthored: true, oxygenDeliveredByLearner: false,
      nivStartedByLearner: false, supportSettingSelected: false,
      medicationDeliveredByLearner: false, testAcquiredByLearner: false,
      airwayProcedurePerformedByLearner: false, treatmentDeliveredByLearner: false,
      dispositionDetermined: false, outcomePredicted: false,
    });
    expect(refused.events.filter(({ eventId }) => eventId.includes('order-refused'))).toHaveLength(4);
    for (const action of ACTIONS.slice(0, -1)) apply(subject, action);
    apply(subject, ACTIONS[4]);
    const premature = subject.step();
    expect(premature.events.some(({ eventId }) =>
      eventId.startsWith('ape-support-handoff-time-refused-'))).toBe(true);
    apply(subject, ACTIONS[4]);
    const completed = subject.step();
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events,
      ...refused.events, ...premature.events, ...completed.events])
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('blocks generic treatment controls without mutating patient or equipment', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'epinephrine', 'fluid',
      'airway-maneuver', 'rhythm', 'obstruction'] as const;
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 703, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 703, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type,
      payload: { amount: 100, drugId: 'propofol', fio2: 1 } });
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('ape-support-generic-action-refused-'))).toHaveLength(blocked.length);
  });

  it('requires the exact target and isolates shortcuts and neighboring actions', () => {
    const scenario = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'acute-pulmonary-edema-respiratory-support-reassessment'
        ? 'acute-pulmonary-edema-respiratory-support-reassessment-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario, seed: 704, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    for (const shortcut of ['start-niv', 'set-fio2-40', 'set-peep-8', 'give-furosemide',
      'start-nitroglycerin', 'give-morphine', 'intubate', 'declare-improved', 'discharge',
      '__proto__']) apply(subject, shortcut);
    apply(subject, 'review-pattern-mimics-and-precipitants', 'acute-pulmonary-edema-response');
    apply(subject, 'reconcile-heart-failure-congestion-and-perfusion', 'heart-failure-response');
    const result = subject.step();
    expect(result.equipment.resuscitation.apeSupportAssessment).toBeUndefined();
    expect(result.events.filter(({ eventId }) =>
      eventId.startsWith('ape-support-response-refused-'))).toHaveLength(11);
  });
});

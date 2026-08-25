import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { ACUTE_SEVERE_ASTHMA as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-severe-asthma';
import { ADULT_ASTHMA } from '../../src/modules/emergency-medicine/scenarios/adult-asthma';

const ACTIONS = [
  'reconcile-acute-severe-asthma-treatment-and-trajectory',
  'recognize-acute-severe-asthma-respiratory-failure',
  'activate-acute-severe-asthma-critical-care-escalation',
  'review-acute-severe-asthma-alternatives-and-ventilation-risks',
  'handoff-acute-severe-asthma-reassessment',
] as const;

function apply(subject: AnesthesiaEngine, action: string,
  type = 'acute-severe-asthma-response') {
  subject.apply({ tick: subject.tick, type, payload: { action } });
}

describe('respiratory medicine acute severe-asthma reassessment', () => {
  it('is a valid post-treatment respiratory-failure lesson distinct from initial ED care', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.timeline.some(({ type, target }) => type === 'narrative'
      && target === 'acute-severe-asthma-reassessment')).toBe(true);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .not.toEqual(ADULT_ASTHMA.metadata.objectives.map(({ id }) => id));
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['3 inhaled', 'minute 45', 'drowsy', 'quiet chest', 'RR 18',
      'pH 7.24', 'PaCO₂ 58', 'without pneumothorax']) expect(narrative).toContain(anchor);
    expect(narrative).toMatch(/no single value is a universal isolated threshold/i);
    expect(narrative).toMatch(/no treatment-response or resolution panel follows/i);
    expect(SCENARIO.timeline.find(({ id }) =>
      id === 'acute-severe-asthma-obstruction')).toMatchObject({
      type: 'obstruction', value: 0.95,
    });
    expect(narrative).toMatch(/generic severe lower-airway-obstruction waveform cue/i);
  });

  it('calibrates the live monitor to the authored current reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 301,
      practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 132, respiratoryRateBpm: 18,
      spo2Percent: 93, systolicMmHg: 102, diastolicMmHg: 64,
      meanArterialMmHg: 77 });
  });

  it('enforces the serial safety gates and a strictly later handoff', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 302,
      practiceRegion: 'US' });
    const onset = subject.step();
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    const refused = subject.step();
    expect(refused.equipment.resuscitation.acuteSevereAsthmaAssessment).toMatchObject({
      treatmentAtTick: null, failureAtTick: null, escalationAtTick: null,
      risksAtTick: null, handoffAtTick: null, respiratoryFailureAuthored: true,
      medicationDeliveredByLearner: false, oxygenDeliveredByLearner: false,
      airwayProcedurePerformedByLearner: false, ventilatorSettingSelected: false,
      dispositionDetermined: false, outcomePredicted: false,
    });
    expect(refused.events.filter(({ eventId }) =>
      eventId.includes('order-refused'))).toHaveLength(4);

    for (const action of ACTIONS.slice(0, -1)) apply(subject, action);
    apply(subject, ACTIONS[4]);
    const premature = subject.step();
    expect(premature.events.some(({ eventId }) =>
      eventId.startsWith('acute-severe-asthma-handoff-time-refused-'))).toBe(true);
    apply(subject, ACTIONS[4]);
    const completed = subject.step();
    const assessment = completed.equipment.resuscitation.acuteSevereAsthmaAssessment;
    expect(assessment?.handoffAtTick).toBeGreaterThan(assessment?.risksAtTick ?? 0);
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events,
      ...refused.events, ...premature.events, ...completed.events])
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses generic treatment and airway controls without mutating the patient', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'epinephrine', 'fluid',
      'airway-maneuver', 'rhythm', 'obstruction'] as const;
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 303,
      practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 303,
      practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type,
      payload: { amount: 100, drugId: 'propofol', fio2: 1, device: 'tracheal-tube' } });
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('acute-severe-asthma-generic-action-refused-')))
      .toHaveLength(blocked.length);
  });

  it('requires the exact scenario target and rejects invented shortcuts', () => {
    const scenario = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'acute-severe-asthma-reassessment'
        ? 'acute-severe-asthma-reassessment-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario, seed: 304, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    for (const shortcut of ['repeat-bronchodilator', 'set-fio2-100', 'start-niv',
      'intubate-now', 'set-peep-5', 'declare-recovery', '__proto__']) apply(subject, shortcut);
    const result = subject.step();
    expect(result.equipment.resuscitation.acuteSevereAsthmaAssessment).toBeUndefined();
    expect(result.events.filter(({ eventId }) =>
      eventId.startsWith('acute-severe-asthma-response-refused-'))).toHaveLength(8);
  });
});

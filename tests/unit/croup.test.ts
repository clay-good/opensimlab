import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { CROUP as SCENARIO } from '../../src/modules/pediatrics/scenarios/croup';

const ACTIONS = ['reconcile-croup-whole-child-upper-airway-pattern',
  'review-croup-severity-and-alternative-red-flags',
  'record-croup-minimal-distress-support-and-qualified-treatment-intent',
  'review-croup-early-response',
  'review-croup-recurrence-and-preserve-airway-readiness',
  'handoff-croup-active-upper-airway-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: string, type = 'croup-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action } });

describe('croup', () => {
  it('is valid, fixed to one child, and contains no treatment recipe', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 3, sex: 'female', weightKg: 15 });
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['barking cough', 'stridor clearly audible at calm rest',
      'SpO2 96%', 'hypoxemia can be late', 'No drooling']) expect(narrative).toContain(anchor);
    expect(narrative).not.toMatch(/mg\/kg|mcg\/kg|mL|L\/min|racemic|repeat every|tube size/i);
  });

  it('moves only through the initial, early, and recurrent fixed states', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 921, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 132, respiratoryRateBpm: 34,
      spo2Percent: 96, systolicMmHg: 96, diastolicMmHg: 58, meanArterialMmHg: 71 });
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, ACTIONS[2]);
    subject.step(); apply(subject, ACTIONS[3]);
    expect(subject.step().state).toMatchObject({ heartRateBpm: 138, respiratoryRateBpm: 26,
      spo2Percent: 97, systolicMmHg: 98, diastolicMmHg: 62, meanArterialMmHg: 74 });
    apply(subject, ACTIONS[4]);
    const recurrent = subject.step();
    expect(recurrent.state).toMatchObject({ heartRateBpm: 130, respiratoryRateBpm: 30,
      spo2Percent: 96, systolicMmHg: 96, diastolicMmHg: 60, meanArterialMmHg: 72 });
    expect(recurrent.equipment.resuscitation.croupAssessment).toMatchObject({
      croupWorkingPatternAuthored: true, stridorAtRestAuthored: true,
      recurrenceAuthored: true, treatmentDeliveredByLearner: false,
      dischargeReadinessProven: false,
    });
  });

  it('enforces serial order and both elapsed gates through debrief', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 922, practiceRegion: 'US' });
    const first = subject.step(); const events = [...first.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    events.push(...subject.step().events);
    expect(events.filter(({ eventId }) => eventId.includes('pattern-order-refused')))
      .toHaveLength(5);
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, ACTIONS[2]);
    apply(subject, ACTIONS[3]); let frame = subject.step(); events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('early-response-time-refused'))).toBe(true);
    apply(subject, ACTIONS[3]); apply(subject, ACTIONS[4]); frame = subject.step();
    events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('recurrence-time-refused'))).toBe(true);
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); frame = subject.step();
    events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
    apply(subject, ACTIONS[5]); frame = subject.step(); events.push(...frame.events);
    const history = [{ tick: first.tick, state: first.state, concentrations: [] },
      { tick: frame.tick, state: frame.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
  });

  it.each([['select-croup-albuterol-for-stridor', 'albuterol'],
    ['wait-for-croup-neck-radiograph', 'radiograph']] as const)(
    'keeps %s calm and nonmutating', (choice, recorded) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 923, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 923, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]); apply(control, ACTIONS[0]);
      subject.step(); control.step(); apply(subject, choice);
      const after = subject.step(); const untouched = control.step();
      expect(after.state).toEqual(untouched.state);
      expect(after.equipment.resuscitation.croupAssessment)
        .toMatchObject({ lastUnsupportedChoice: recorded, severityAtTick: null,
          treatmentDeliveredByLearner: false });
    },
  );

  it('immutably refuses generic, adjacent, device, dose, and procedural shortcuts', () => {
    const blocked = ['bolus', 'infusion', 'fluid', 'ventilator', 'inhaled-bronchodilator',
      'call-for-help', 'airway-device', 'airway-maneuver', 'laryngoscopy',
      'pediatric-respiratory-distress-response', 'bronchiolitis-response',
      'pediatric-status-asthmaticus-response', 'emergency-anaphylaxis-response'] as const;
    const shortcuts = ['give-dexamethasone-0.6-mg-kg', 'repeat-epinephrine',
      'force-oxygen-mask', 'inspect-throat', 'intubate', 'discharge', '__proto__', 'constructor'];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 924, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 924, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: -999, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation.croupAssessment)
      .toEqual(untouched.equipment.resuscitation.croupAssessment);
    expect(refused.events.filter(({ eventId }) => eventId.startsWith('croup-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) => eventId.startsWith('croup-response-refused-')))
      .toHaveLength(shortcuts.length);
  });
});

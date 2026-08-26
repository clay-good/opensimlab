import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { BRONCHIOLITIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/bronchiolitis';

const ACTIONS = ['reconcile-bronchiolitis-risk-and-trajectory',
  'recognize-bronchiolitis-supportive-care-pattern',
  'activate-bronchiolitis-oxygenation-and-monitoring',
  'review-bronchiolitis-feeding-and-hydration',
  'review-bronchiolitis-later-response',
  'handoff-bronchiolitis-active-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: string, type = 'bronchiolitis-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action } });

describe('bronchiolitis', () => {
  it('is valid, fixed to one toddler, and contains no treatment recipe', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 1, sex: 'male', weightKg: 10 });
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['day 4', 'SpO2 88%', 'intake near 40%', 'No apnea']) {
      expect(narrative).toContain(anchor);
    }
    expect(narrative).not.toMatch(/\d+ ?L\/min|mL\/kg|FiO2 target|albuterol \d|suction depth/i);
  });

  it('moves only from the authored initial state to the fixed partial response', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 911, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 156, respiratoryRateBpm: 58,
      spo2Percent: 88, systolicMmHg: 92, diastolicMmHg: 54, meanArterialMmHg: 67 });
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, ACTIONS[2]);
    subject.step(); apply(subject, ACTIONS[3]); subject.step(); apply(subject, ACTIONS[4]);
    const later = subject.step();
    expect(later.state).toMatchObject({ heartRateBpm: 142, respiratoryRateBpm: 48,
      spo2Percent: 93, systolicMmHg: 92, diastolicMmHg: 56, meanArterialMmHg: 68 });
    expect(later.equipment.resuscitation.bronchiolitisAssessment).toMatchObject({
      bronchiolitisWorkingPatternAuthored: true, currentApneaAuthored: false,
      treatmentDeliveredByLearner: false, dischargeReadinessProven: false,
    });
  });

  it('enforces serial order and both elapsed gates through debrief', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 912, practiceRegion: 'US' });
    const first = subject.step(); const events = [...first.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    events.push(...subject.step().events);
    expect(events.filter(({ eventId }) => eventId.includes('recognition-order-refused')))
      .toHaveLength(5);
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, ACTIONS[2]);
    apply(subject, ACTIONS[3]); let frame = subject.step(); events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('feeding-time-refused'))).toBe(true);
    apply(subject, ACTIONS[3]); apply(subject, ACTIONS[4]); frame = subject.step();
    events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('later-time-refused'))).toBe(true);
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); frame = subject.step();
    events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
    apply(subject, ACTIONS[5]); frame = subject.step(); events.push(...frame.events);
    const history = [{ tick: first.tick, state: first.state, concentrations: [] },
      { tick: frame.tick, state: frame.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
  });

  it.each([['wait-for-bronchiolitis-routine-radiograph', 'radiograph-first'],
    ['observe-bronchiolitis-saturation-alone', 'single-saturation']] as const)(
    'keeps %s calm and nonmutating', (choice, recorded) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 913, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 913, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]); apply(control, ACTIONS[0]);
      subject.step(); control.step(); apply(subject, choice);
      const after = subject.step(); const untouched = control.step();
      expect(after.state).toEqual(untouched.state);
      expect(after.equipment.resuscitation.bronchiolitisAssessment)
        .toMatchObject({ lastUnsupportedChoice: recorded, supportAtTick: null,
          treatmentDeliveredByLearner: false });
    },
  );

  it('immutably refuses generic, adjacent, device, dose, and procedural shortcuts', () => {
    const blocked = ['bolus', 'infusion', 'fluid', 'ventilator', 'inhaled-bronchodilator',
      'call-for-help', 'airway-device', 'airway-maneuver', 'laryngoscopy',
      'pediatric-respiratory-distress-response', 'croup-response',
      'pediatric-status-asthmaticus-response', 'high-flow-nasal-oxygen-escalation-response'] as const;
    const shortcuts = ['diagnose-bronchiolitis', 'give-fluid-20-ml-kg', 'choose-ng-route',
      'routine-deep-suction', 'set-fio2-100', 'discharge', '__proto__', 'constructor'];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 914, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 914, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: -999, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation.bronchiolitisAssessment)
      .toEqual(untouched.equipment.resuscitation.bronchiolitisAssessment);
    expect(refused.events.filter(({ eventId }) => eventId.startsWith('bronchiolitis-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) => eventId.startsWith('bronchiolitis-response-refused-')))
      .toHaveLength(shortcuts.length);
  });
});

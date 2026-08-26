import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { PEDIATRIC_STATUS_ASTHMATICUS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-status-asthmaticus';

const ACTIONS = ['reconcile-pediatric-status-asthmaticus-treatment-and-trajectory',
  'recognize-pediatric-status-asthmaticus-severe-nonresponse',
  'activate-pediatric-status-asthmaticus-critical-care-escalation',
  'record-pediatric-status-asthmaticus-qualified-second-line-care-intent',
  'review-pediatric-status-asthmaticus-later-response',
  'handoff-pediatric-status-asthmaticus-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: unknown,
  type = 'pediatric-status-asthmaticus-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action: action as never } });

describe('pediatric status asthmaticus', () => {
  it('is valid, fixed to one child, and contains no treatment recipe', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(ACTIONS.join(' ')).not.toMatch(/magnesium|albuterol|aminophylline|epinephrine/i);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 10, sex: 'female', weightKg: 32 });
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['personal-best peak expiratory flow of 330 L/min',
      'room-air SpO2 89%', 'minute 60', 'persistent severe nonresponse',
      'If systemic allergic features emerge']) expect(narrative).toContain(anchor);
    expect(narrative).not.toMatch(/mg\/kg|mcg\/kg|mg\/mL|repeat every|mL\/h|tube size|PEEP \d/i);
  });

  it('moves only from the fixed minute-60 state to the fixed partial response', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 931, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 154, respiratoryRateBpm: 40,
      spo2Percent: 93, systolicMmHg: 108, diastolicMmHg: 66, meanArterialMmHg: 80 });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]);
    const later = subject.step();
    expect(later.state).toMatchObject({ heartRateBpm: 142, respiratoryRateBpm: 32,
      spo2Percent: 95, systolicMmHg: 106, diastolicMmHg: 64, meanArterialMmHg: 78 });
    expect(later.equipment.resuscitation.pediatricStatusAsthmaticusAssessment).toMatchObject({
      asthmaHistoryAuthored: true, treatmentRecordAuthored: true,
      persistentSevereNonresponseAuthored: true, experiencedSecondLineCareAuthored: true,
      partialResponseAuthored: true, quietChestAuthored: false,
      treatmentDeliveredByLearner: false, dischargeReadinessProven: false,
    });
  });

  it('enforces serial order and both elapsed gates through debrief', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 932, practiceRegion: 'US' });
    const first = subject.step(); const events = [...first.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    events.push(...subject.step().events);
    expect(events.filter(({ eventId }) => eventId.includes('trajectory-order-refused')))
      .toHaveLength(5);
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); let frame = subject.step(); events.push(...frame.events);
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

  it.each([['wait-for-pediatric-status-asthmaticus-routine-radiograph', 'radiograph-delay'],
    ['force-pediatric-status-asthmaticus-peak-flow', 'force-peak-flow']] as const)(
    'keeps %s calm and nonmutating', (choice, recorded) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 933, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 933, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]); apply(control, ACTIONS[0]);
      subject.step(); control.step(); apply(subject, choice);
      const after = subject.step(); const untouched = control.step();
      expect(after.state).toEqual(untouched.state);
      expect(after.equipment.resuscitation.pediatricStatusAsthmaticusAssessment)
        .toMatchObject({ lastUnsupportedChoice: recorded, nonresponseAtTick: null,
          treatmentDeliveredByLearner: false });
    },
  );

  it('immutably refuses generic, adjacent, device, dose, procedural, and hostile shortcuts', () => {
    const blocked = ['bolus', 'infusion', 'fluid', 'ventilator', 'inhaled-bronchodilator',
      'call-for-help', 'airway-device', 'airway-maneuver', 'laryngoscopy',
      'pediatric-respiratory-distress-response', 'bronchiolitis-response', 'croup-response',
      'acute-severe-asthma-response', 'emergency-anaphylaxis-response'] as const;
    const shortcuts: unknown[] = ['give-magnesium-50-mg-kg', 'set-oxygen-94-percent',
      'intubate', 'diagnose-asthma', 'discharge', '__proto__', 'constructor', null,
      { action: ACTIONS[0] }, ['handoff']];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 934, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 934, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: -999, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation.pediatricStatusAsthmaticusAssessment)
      .toEqual(untouched.equipment.resuscitation.pediatricStatusAsthmaticusAssessment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('pediatric-status-asthmaticus-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('pediatric-status-asthmaticus-response-refused-')))
      .toHaveLength(shortcuts.length);
  });
});

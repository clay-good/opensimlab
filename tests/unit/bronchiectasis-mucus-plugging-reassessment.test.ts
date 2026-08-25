import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { BRONCHIECTASIS_MUCUS_PLUGGING_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/bronchiectasis-mucus-plugging-reassessment';

const ACTIONS = ['reconcile-bronchiectasis-mucus-plugging-trajectory',
  'review-bronchiectasis-mucus-plugging-evidence-and-alternatives',
  'record-bronchiectasis-mucus-plugging-supported-airway-clearance-intent',
  'review-bronchiectasis-mucus-plugging-later-response',
  'escalate-bronchiectasis-mucus-plugging-persistent-collapse',
  'handoff-bronchiectasis-mucus-plugging-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'bronchiectasis-mucus-plugging-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('bronchiectasis mucus plugging reassessment', () => {
  it('is valid, exact-targeted, and distinct from the artificial-airway lesson', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['2 days', 'SpO₂ 88%', 'dense endobronchial material',
      'residual left-lower-lobe volume loss']) expect(narrative).toContain(anchor);
    expect(narrative).toMatch(/no artificial airway/i);
    expect(narrative).not.toMatch(/sawtooth|plateau pressure|suction pressure/i);
  });

  it('uses the fixed pre- and post-clearance monitor states', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 731, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 108, respiratoryRateBpm: 28,
      spo2Percent: 88, systolicMmHg: 118, diastolicMmHg: 72, meanArterialMmHg: 87 });
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, ACTIONS[2]); subject.step();
    apply(subject, ACTIONS[3]);
    expect(subject.step().state).toMatchObject({ heartRateBpm: 98, respiratoryRateBpm: 22,
      spo2Percent: 93, systolicMmHg: 116, diastolicMmHg: 70, meanArterialMmHg: 85 });
  });

  it('enforces both elapsed gates and maps only accepted actions to debrief', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 732, practiceRegion: 'US' });
    const onset = subject.step(); const events = [...onset.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    const refused = subject.step(); events.push(...refused.events);
    expect(refused.events.filter(({ eventId }) => eventId.includes('order-refused'))).toHaveLength(5);
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, ACTIONS[2]);
    apply(subject, ACTIONS[3]); const early = subject.step(); events.push(...early.events);
    expect(early.events.some(({ eventId }) =>
      eventId.startsWith('bronchiectasis-mucus-response-time-refused-'))).toBe(true);
    apply(subject, ACTIONS[3]); const response = subject.step(); events.push(...response.events);
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]);
    const premature = subject.step(); events.push(...premature.events);
    expect(premature.events.some(({ eventId }) =>
      eventId.startsWith('bronchiectasis-mucus-handoff-time-refused-'))).toBe(true);
    apply(subject, ACTIONS[5]); const completed = subject.step(); events.push(...completed.events);
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
  });

  it('blocks generic, legacy suction, and hostile shortcut actions immutably', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'epinephrine', 'fluid', 'airway-maneuver',
      'rhythm', 'obstruction', 'mucus-plugging-response'] as const;
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 733, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 733, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type, payload: {} });
    for (const shortcut of ['suction-now', 'deep-suction', 'instill-saline',
      'give-nebulized-nac', 'give-bronchodilator', 'start-antibiotic', 'perform-bronchoscopy',
      'remove-plug', 'intubate', 'select-pep-device', 'choose-frequency',
      'diagnose-mucus-plug', 'diagnose-malignancy', 'discharge', '__proto__']) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state); expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('bronchiectasis-mucus-generic-action-refused-'))).toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('bronchiectasis-mucus-response-refused-'))).toHaveLength(15);
    expect(refused.equipment.resuscitation.mucusPluggingAssessment).toMatchObject({
      supportAtTick: null, indicatorsAtTick: null, suctionAtTick: null,
      reassessmentAtTick: null, escalationAtTick: null,
    });
    expect(refused.events.some(({ eventId }) => eventId.startsWith('mucus-suction-recorded-'))).toBe(false);
  });

  it('requires the exact target suffix', () => {
    const wrong = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'bronchiectasis-mucus-plugging-reassessment'
        ? 'bronchiectasis-mucus-plugging-reassessment-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario: wrong, seed: 734, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    expect(subject.step().equipment.resuscitation.bronchiectasisMucusPluggingAssessment).toBeUndefined();
  });
});

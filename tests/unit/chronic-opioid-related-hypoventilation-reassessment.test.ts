import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { CHRONIC_OPIOID_RELATED_HYPOVENTILATION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/chronic-opioid-related-hypoventilation-reassessment';

const ACTIONS = ['reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory',
  'review-chronic-opioid-related-hypoventilation-awake-and-sleep-evidence',
  'review-chronic-opioid-related-hypoventilation-contributors-and-alternatives',
  'coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan',
  'handoff-chronic-opioid-related-hypoventilation-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'chronic-opioid-related-hypoventilation-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('chronic opioid-related hypoventilation reassessment', () => {
  it('is valid, exact-targeted, and distinct from both acute opioid lessons', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['8 years', 'SpO₂ 94%', '58 mmHg', '24 minutes', 'BMI is 23.7']) {
      expect(narrative).toContain(anchor);
    }
    expect(narrative).toMatch(/no authored.*acute intoxication/i);
    expect(narrative).not.toMatch(/bag-mask|pinpoint pupils|postoperative recovery after/i);
    expect(SCENARIO.timeline.some(({ type }) =>
      type === 'opioid-ventilatory-impairment')).toBe(false);
  });

  it('keeps the quiet awake monitor state fixed', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 741, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 76, respiratoryRateBpm: 10,
      spo2Percent: 94, systolicMmHg: 124, diastolicMmHg: 74, meanArterialMmHg: 91 });
  });

  it.each([[ACTIONS[1], ACTIONS[2]], [ACTIONS[2], ACTIONS[1]]])(
    'allows either evidence-lane order and requires elapsed handoff', (first, second) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 742, practiceRegion: 'US' });
      const onset = subject.step(); const events = [...onset.events];
      apply(subject, ACTIONS[3]); apply(subject, ACTIONS[4]);
      const refused = subject.step(); events.push(...refused.events);
      expect(refused.events.filter(({ eventId }) => eventId.includes('order-refused'))).toHaveLength(2);
      apply(subject, ACTIONS[0]); apply(subject, first); apply(subject, second); apply(subject, ACTIONS[3]);
      apply(subject, ACTIONS[4]); const early = subject.step(); events.push(...early.events);
      expect(early.events.some(({ eventId }) =>
        eventId.startsWith('chronic-opioid-hypoventilation-handoff-time-refused-'))).toBe(true);
      apply(subject, ACTIONS[4]); const completed = subject.step(); events.push(...completed.events);
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
        .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
    },
  );

  it('blocks generic, legacy opioid, and hostile shortcut actions immutably', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'fluid', 'airway-maneuver', 'rhythm',
      'obstruction', 'opioid-ventilatory-response', 'opioid-toxicity-response'] as const;
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 743, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 743, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type, payload: {} });
    for (const shortcut of ['give-naloxone', 'hold-opioid', 'stop-opioid-now',
      'taper-10-percent', 'convert-to-mme', 'select-cpap', 'select-bilevel', 'select-asv',
      'set-backup-rate', 'start-oxygen', 'diagnose-central-sleep-apnea',
      'diagnose-obesity-hypoventilation', 'discharge', '__proto__']) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('chronic-opioid-hypoventilation-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('chronic-opioid-hypoventilation-response-refused-')))
      .toHaveLength(14);
    expect(refused.equipment.resuscitation.opioidVentilatoryResponse).toMatchObject({
      severity: 0, furtherOpioidHeldAtTick: null, naloxoneIntentAtTick: null,
    });
    expect(refused.equipment.resuscitation.opioidToxicityAssessment).toMatchObject({
      patternReviewedAtTick: null, ventilationAtTick: null, antagonistAtTick: null,
      initialReassessmentAtTick: null, recurrenceReviewedAtTick: null,
      recurrencePlanAtTick: null,
    });
    expect(refused.events.some(({ eventId }) => /naloxone|further-opioid-held/.test(eventId))).toBe(false);
  });

  it('requires the exact target and replays deterministically', () => {
    const wrong = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'chronic-opioid-related-hypoventilation-reassessment'
        ? 'chronic-opioid-related-hypoventilation-reassessment-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario: wrong, seed: 744, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    expect(subject.step().equipment.resuscitation.chronicOpioidHypoventilationAssessment)
      .toBeUndefined();
    const a = new AnesthesiaEngine({ scenario: SCENARIO, seed: 745, practiceRegion: 'US' });
    const b = new AnesthesiaEngine({ scenario: SCENARIO, seed: 745, practiceRegion: 'US' });
    a.step(); b.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(a, action); apply(b, action); }
    expect(a.step()).toEqual(b.step());
  });
});

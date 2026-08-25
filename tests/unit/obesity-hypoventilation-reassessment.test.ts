import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { OBESITY_HYPOVENTILATION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/obesity-hypoventilation-reassessment';

const ACTIONS = ['reconcile-obesity-hypoventilation-phenotype-and-trajectory',
  'review-obesity-hypoventilation-awake-evidence',
  'review-obesity-hypoventilation-sleep-evidence-and-open-causes',
  'recognize-obesity-hypoventilation-working-pattern',
  'coordinate-obesity-hypoventilation-shared-plan',
  'handoff-obesity-hypoventilation-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'obesity-hypoventilation-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('obesity hypoventilation reassessment', () => {
  it('is valid, exact-targeted, person-centered, and distinct from adjacent labs', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(118 / ((165 / 100) ** 2)).toBeCloseTo(43.3, 1);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['12 months', 'BMI is 43.3', 'PaCO₂ 52 mmHg',
      'AHI 48/hour', '64 mmHg']) expect(narrative).toContain(anchor);
    expect(narrative).not.toMatch(/morbidly obese|Pickwick|noncompliant|naloxone|rocuronium/i);
    expect(SCENARIO.timeline.every(({ type }) => type === 'narrative')).toBe(true);
  });

  it('uses a stable fixed awake monitor state without a treatment response', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 761, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 82, respiratoryRateBpm: 18,
      spo2Percent: 91, etco2MmHg: 46, systolicMmHg: 132, diastolicMmHg: 78,
      meanArterialMmHg: 96 });
    const later = Array.from({ length: 60 }, () => subject.step()).at(-1)?.state;
    expect(later).toMatchObject({ heartRateBpm: 82, respiratoryRateBpm: 18,
      spo2Percent: 91, etco2MmHg: 46 });
  });

  it.each([[ACTIONS[1], ACTIONS[2]], [ACTIONS[2], ACTIONS[1]]])(
    'allows awake and sleep evidence in either order', (first, second) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 762, practiceRegion: 'US' });
      const onset = subject.step(); const events = [...onset.events];
      for (const action of ACTIONS.slice(1)) apply(subject, action);
      const refused = subject.step(); events.push(...refused.events);
      expect(refused.events.filter(({ eventId }) => eventId.includes('phenotype-order-refused')))
        .toHaveLength(5);
      apply(subject, ACTIONS[0]); apply(subject, first); apply(subject, ACTIONS[3]);
      const oneLane = subject.step(); events.push(...oneLane.events);
      expect(oneLane.events.some(({ eventId }) =>
        eventId.startsWith('obesity-hypoventilation-recognition-order-refused-'))).toBe(true);
      apply(subject, second); apply(subject, ACTIONS[3]); apply(subject, ACTIONS[4]);
      apply(subject, ACTIONS[5]); const early = subject.step(); events.push(...early.events);
      expect(early.events.some(({ eventId }) =>
        eventId.startsWith('obesity-hypoventilation-handoff-time-refused-'))).toBe(true);
      apply(subject, ACTIONS[5]); const completed = subject.step(); events.push(...completed.events);
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
        .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    },
  );

  it('blocks generic, adjacent-family, and hostile treatment shortcuts immutably', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'fluid', 'airway-maneuver', 'rhythm',
      'obstruction', 'neuromuscular-reversal', 'mucus-plugging-response',
      'opioid-ventilatory-response', 'opioid-toxicity-response'] as const;
    const shortcuts = ['diagnose-ohs', 'diagnose-from-bmi', 'diagnose-from-bicarbonate',
      'calculate-bmi', 'select-cpap', 'select-bilevel', 'select-niv', 'set-ipap', 'set-epap',
      'set-backup-rate', 'start-oxygen', 'give-acetazolamide', 'prescribe-glp1',
      'set-30-percent-weight-loss', 'refer-bariatric-surgery', 'intubate', 'discharge',
      'predict-resolution', '__proto__', 'constructor'];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 763, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 763, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.concentrations).toEqual(untouched.concentrations);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('obesity-hypoventilation-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('obesity-hypoventilation-response-refused-')))
      .toHaveLength(shortcuts.length);
  });

  it('requires the exact target and replays deterministically', () => {
    const wrong = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'obesity-hypoventilation-reassessment'
        ? 'obesity-hypoventilation-reassessment-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario: wrong, seed: 764, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    expect(subject.step().equipment.resuscitation.obesityHypoventilationAssessment).toBeUndefined();
    const a = new AnesthesiaEngine({ scenario: SCENARIO, seed: 765, practiceRegion: 'US' });
    const b = new AnesthesiaEngine({ scenario: SCENARIO, seed: 765, practiceRegion: 'US' });
    a.step(); b.step();
    for (const action of ACTIONS.slice(0, 5)) { apply(a, action); apply(b, action); }
    expect(a.step()).toEqual(b.step());
  });
});

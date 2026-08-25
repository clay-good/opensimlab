import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { NEUROMUSCULAR_RESPIRATORY_FAILURE_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/neuromuscular-respiratory-failure-reassessment';

const ACTIONS = ['reconcile-neuromuscular-respiratory-failure-trajectory',
  'recognize-neuromuscular-respiratory-failure',
  'activate-neuromuscular-respiratory-failure-escalation',
  'review-neuromuscular-respiratory-failure-bulbar-cough-and-alternatives',
  'coordinate-neuromuscular-respiratory-failure-goals-and-ownership',
  'handoff-neuromuscular-respiratory-failure-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'neuromuscular-respiratory-failure-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('neuromuscular respiratory-failure reassessment', () => {
  it('is valid, exact-targeted, and distinct from acute neurologic and anesthesia labs', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['amyotrophic lateral sclerosis', 'FVC falling from 68% to 46%',
      'SNIP falling from 50 to 28', '210 L/min', 'PaCO₂ 52 mmHg']) {
      expect(narrative).toContain(anchor);
    }
    expect(narrative).not.toMatch(/Guillain|myastheni|train-of-four|rocuronium|reversal dose/i);
    expect(SCENARIO.timeline.every(({ type }) => type === 'narrative')).toBe(true);
  });

  it('uses the fixed awake respiratory-failure monitor state', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 751, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 96, respiratoryRateBpm: 24,
      spo2Percent: 94, etco2MmHg: 44, systolicMmHg: 122, diastolicMmHg: 76,
      meanArterialMmHg: 91 });
  });

  it.each([[ACTIONS[2], ACTIONS[3]], [ACTIONS[3], ACTIONS[2]]])(
    'allows urgent escalation and safety review in either order', (first, second) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 752, practiceRegion: 'US' });
      const onset = subject.step(); const events = [...onset.events];
      for (const action of ACTIONS.slice(1)) apply(subject, action);
      const refused = subject.step(); events.push(...refused.events);
      expect(refused.events.filter(({ eventId }) => eventId.includes('trajectory-order-refused')))
        .toHaveLength(5);
      apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, first);
      apply(subject, ACTIONS[4]); const oneLane = subject.step(); events.push(...oneLane.events);
      expect(oneLane.events.some(({ eventId }) =>
        eventId.startsWith('neuromuscular-respiratory-failure-ownership-order-refused-'))).toBe(true);
      apply(subject, second); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]);
      const early = subject.step(); events.push(...early.events);
      expect(early.events.some(({ eventId }) =>
        eventId.startsWith('neuromuscular-respiratory-failure-handoff-time-refused-'))).toBe(true);
      apply(subject, ACTIONS[5]); const completed = subject.step(); events.push(...completed.events);
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
        .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    },
  );

  it('blocks generic, legacy, reversal, and hostile shortcut actions immutably', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'fluid', 'airway-maneuver', 'rhythm',
      'obstruction', 'neuromuscular-reversal', 'mucus-plugging-response',
      'opioid-ventilatory-response', 'opioid-toxicity-response'] as const;
    const shortcuts = ['give-sugammadex', 'give-neostigmine', 'give-pyridostigmine',
      'start-steroids', 'give-ivig', 'start-plasma-exchange', 'select-cpap', 'select-bilevel',
      'set-ipap', 'set-epap', 'set-backup-rate', 'start-oxygen', 'perform-cough-assist',
      'deep-suction', 'intubate-now', 'perform-tracheostomy', 'diagnose-myasthenic-crisis',
      'use-20-30-40-rule', 'wait-for-desaturation', 'declare-futility', 'predict-survival',
      'discharge', '__proto__'];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 753, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 753, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.concentrations).toEqual(untouched.concentrations);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('neuromuscular-respiratory-failure-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('neuromuscular-respiratory-failure-response-refused-')))
      .toHaveLength(shortcuts.length);
    expect(refused.equipment.resuscitation.neuromuscularReversalFraction).toBe(0);
    expect(refused.events.some(({ eventId }) =>
      /neuromuscular-reversal-accepted|mucus-suction-recorded|naloxone/.test(eventId))).toBe(false);
  });

  it('requires the exact target and replays deterministically', () => {
    const wrong = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'neuromuscular-respiratory-failure-reassessment'
        ? 'neuromuscular-respiratory-failure-reassessment-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario: wrong, seed: 754, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    expect(subject.step().equipment.resuscitation.neuromuscularRespiratoryFailureAssessment)
      .toBeUndefined();
    const a = new AnesthesiaEngine({ scenario: SCENARIO, seed: 755, practiceRegion: 'US' });
    const b = new AnesthesiaEngine({ scenario: SCENARIO, seed: 755, practiceRegion: 'US' });
    a.step(); b.step();
    for (const action of ACTIONS.slice(0, 5)) { apply(a, action); apply(b, action); }
    expect(a.step()).toEqual(b.step());
  });
});

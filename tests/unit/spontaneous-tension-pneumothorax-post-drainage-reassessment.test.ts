import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { SPONTANEOUS_TENSION_PNEUMOTHORAX_POST_DRAINAGE_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/spontaneous-tension-pneumothorax-post-drainage-reassessment';
import { OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX } from '../../src/modules/emergency-medicine/scenarios/obstructive-shock-tension-pneumothorax';
import { PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE } from '../../src/modules/anesthesia/scenarios/pneumothorax-under-positive-pressure';

const ACTIONS = ['reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care',
  'review-spontaneous-tension-pneumothorax-drainage-response',
  'review-spontaneous-tension-pneumothorax-drain-system-and-complications',
  'review-spontaneous-tension-pneumothorax-etiology-recurrence-and-definitive-planning',
  'handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'spontaneous-tension-pneumothorax-post-drainage-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('spontaneous tension pneumothorax post-drainage reassessment', () => {
  it('is valid, distinct, and cannot activate either live decompression pathway', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect([OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX.metadata.id,
      PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE.metadata.id]).not.toContain(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.filter(({ type }) => type === 'tension-pneumothorax')).toEqual([]);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['Six hours ago', 'BP 108/64 mmHg', 'partial right-lung re-expansion',
      'intermittent bubbling']) expect(narrative).toContain(anchor);
    expect(narrative).toMatch(/do not examine/i);
  });

  it('calibrates the monitor to the fixed current report', () => {
    const result = new AnesthesiaEngine({ scenario: SCENARIO, seed: 711,
      practiceRegion: 'US' }).step();
    expect(result.state).toMatchObject({ heartRateBpm: 96, respiratoryRateBpm: 22,
      spo2Percent: 93, systolicMmHg: 108, diastolicMmHg: 64,
      meanArterialMmHg: 79, coreTemperatureC: 36.7 });
  });

  it.each([[ACTIONS[2], ACTIONS[3]], [ACTIONS[3], ACTIONS[2]]])(
    'accepts both parallel lane orders and requires a strictly later handoff',
    (firstLane, secondLane) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 712,
        practiceRegion: 'US' });
      const onset = subject.step();
      apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]);
      apply(subject, firstLane); apply(subject, secondLane); apply(subject, ACTIONS[4]);
      const premature = subject.step();
      expect(premature.events.some(({ eventId }) =>
        eventId.startsWith('post-tension-pneumothorax-handoff-time-refused-'))).toBe(true);
      apply(subject, ACTIONS[4]);
      const completed = subject.step();
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events,
        ...premature.events, ...completed.events]).map(({ outcome }) => outcome))
        .toEqual(['met', 'met', 'met', 'met', 'met']);
    },
  );

  it('refuses premature, duplicate, generic, shortcut, and wrong-target actions immutably', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'epinephrine', 'fluid',
      'airway-maneuver', 'rhythm', 'obstruction', 'tension-pneumothorax'] as const;
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 713, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 713, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type,
      payload: { amount: 100, drugId: 'propofol', fio2: 1 } });
    for (const shortcut of ['assess-bilateral-ventilation', 'decompress-left-chest',
      'insert-chest-drain', 'clamp-drain', 'apply-suction', 'flush-drain', 'remove-drain',
      'choose-site', 'give-oxygen', 'declare-sealed', 'discharge', '__proto__']) {
      apply(hostile, shortcut);
    }
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('post-tension-pneumothorax-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('post-tension-pneumothorax-response-refused-')))
      .toHaveLength(12);

    const wrong = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'spontaneous-tension-pneumothorax-post-drainage-reassessment'
        ? 'spontaneous-tension-pneumothorax-post-drainage-reassessment-extra' : entry.target })) };
    const isolated = new AnesthesiaEngine({ scenario: wrong, seed: 714, practiceRegion: 'US' });
    isolated.step(); apply(isolated, ACTIONS[0]);
    expect(isolated.step().equipment.resuscitation.postTensionPneumothoraxAssessment)
      .toBeUndefined();
  });
});

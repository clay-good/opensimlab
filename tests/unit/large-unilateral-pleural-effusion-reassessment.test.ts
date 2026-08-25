import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { LARGE_UNILATERAL_PLEURAL_EFFUSION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/large-unilateral-pleural-effusion-reassessment';

const ACTIONS = ['reconcile-large-unilateral-pleural-effusion-trajectory',
  'record-large-unilateral-pleural-effusion-pleural-team-and-drainage-intent',
  'review-large-unilateral-pleural-effusion-drainage-response',
  'review-large-unilateral-pleural-effusion-fluid-pattern-and-causes',
  'coordinate-large-unilateral-pleural-effusion-definitive-evaluation',
  'handoff-large-unilateral-pleural-effusion-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'large-unilateral-pleural-effusion-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('large unilateral pleural effusion reassessment', () => {
  it('is valid, exact-targeted, and contains no pleural-air crisis event', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.filter(({ type }) => type === 'tension-pneumothorax')).toEqual([]);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['6 weeks', 'SpO₂ 91%', '850 mL is a case fact',
      'classifies the paired sample as exudative']) expect(narrative).toContain(anchor);
    expect(narrative).toMatch(/do not examine/i);
  });

  it('uses the fixed pre- and post-checkpoint monitor states', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 721, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 104, respiratoryRateBpm: 26,
      spo2Percent: 91, systolicMmHg: 128, diastolicMmHg: 76, meanArterialMmHg: 93 });
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); subject.step();
    apply(subject, ACTIONS[2]);
    expect(subject.step().state).toMatchObject({ heartRateBpm: 92, respiratoryRateBpm: 20,
      spo2Percent: 95, systolicMmHg: 124, diastolicMmHg: 74, meanArterialMmHg: 91 });
  });

  it('enforces both elapsed gates and maps only accepted actions to debrief', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 722, practiceRegion: 'US' });
    const onset = subject.step();
    const events = [...onset.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    const refused = subject.step(); events.push(...refused.events);
    expect(refused.events.filter(({ eventId }) => eventId.includes('order-refused')))
      .toHaveLength(5);
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, ACTIONS[2]);
    const early = subject.step(); events.push(...early.events);
    expect(early.events.some(({ eventId }) =>
      eventId.startsWith('large-pleural-effusion-response-time-refused-'))).toBe(true);
    apply(subject, ACTIONS[2]); const response = subject.step(); events.push(...response.events);
    apply(subject, ACTIONS[3]); const fluid = subject.step(); events.push(...fluid.events);
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]);
    const premature = subject.step(); events.push(...premature.events);
    expect(premature.events.some(({ eventId }) =>
      eventId.startsWith('large-pleural-effusion-handoff-time-refused-'))).toBe(true);
    apply(subject, ACTIONS[5]); const completed = subject.step(); events.push(...completed.events);
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
  });

  it('blocks generic treatment and hostile procedure shortcuts immutably', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'epinephrine', 'fluid',
      'airway-maneuver', 'rhythm', 'obstruction', 'tension-pneumothorax'] as const;
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 723, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 723, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type, payload: {} });
    for (const shortcut of ['drain-now', 'perform-thoracentesis', 'insert-chest-drain',
      'choose-site', 'drain-1500-ml', 'clamp-drain', 'apply-suction', 'calculate-lights-criteria',
      'diagnose-malignancy', 'give-diuretic', 'give-antibiotic', 'discharge', '__proto__']) {
      apply(hostile, shortcut);
    }
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state); expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('large-pleural-effusion-generic-action-refused-'))).toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('large-pleural-effusion-response-refused-'))).toHaveLength(13);
  });

  it('requires the exact target suffix', () => {
    const wrong = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'large-unilateral-pleural-effusion-reassessment'
        ? 'large-unilateral-pleural-effusion-reassessment-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario: wrong, seed: 724, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    expect(subject.step().equipment.resuscitation.largePleuralEffusionAssessment).toBeUndefined();
  });
});

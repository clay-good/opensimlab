import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { NONINVASIVE_VENTILATION_SELECTION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/noninvasive-ventilation-selection';

const ACTIONS = ['reconcile-noninvasive-ventilation-selection-treatment-and-trajectory',
  'review-noninvasive-ventilation-selection-suitability-and-rescue-readiness',
  'select-bilevel-noninvasive-ventilation',
  'review-noninvasive-ventilation-selection-early-response',
  'review-noninvasive-ventilation-selection-failure-guards',
  'handoff-noninvasive-ventilation-selection-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'noninvasive-ventilation-selection-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('noninvasive ventilation selection', () => {
  it('is valid, exact-targeted, and anchored to persistent acute acidotic COPD', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['pH 7.28', 'PaCO₂ 68 mmHg', 'RR 30/min',
      'bilevel NIV trial']) expect(narrative).toContain(anchor);
    expect(narrative).not.toMatch(/CO2 retainer|failed patient|noncompliant|live ventilator/i);
    expect(SCENARIO.timeline.every(({ type }) => type === 'narrative')).toBe(true);
  });

  it('holds the fixed current state until the authored first-hour response', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 771, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 102, respiratoryRateBpm: 30,
      spo2Percent: 90, etco2MmHg: 62, systolicMmHg: 128, diastolicMmHg: 76,
      meanArterialMmHg: 93 });
    for (const action of ACTIONS.slice(0, 3)) apply(subject, action);
    const sameTick = subject.step();
    apply(subject, ACTIONS[3]);
    const response = subject.step();
    expect(sameTick.state).toMatchObject({ heartRateBpm: 102, respiratoryRateBpm: 30,
      spo2Percent: 90, etco2MmHg: 62 });
    expect(response.state).toMatchObject({ heartRateBpm: 94, respiratoryRateBpm: 24,
      spo2Percent: 90, etco2MmHg: 55, systolicMmHg: 126, diastolicMmHg: 74,
      meanArterialMmHg: 91 });
  });

  it('enforces sequence and both strictly elapsed reassessment gates', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 772, practiceRegion: 'US' });
    const onset = subject.step(); const events = [...onset.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    events.push(...subject.step().events);
    expect(events.filter(({ eventId }) => eventId.includes('trajectory-order-refused'))).toHaveLength(5);
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, ACTIONS[2]);
    apply(subject, ACTIONS[3]);
    const early = subject.step(); events.push(...early.events);
    expect(early.events.some(({ eventId }) => eventId.includes('response-time-refused'))).toBe(true);
    apply(subject, ACTIONS[3]); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]);
    const earlyHandoff = subject.step(); events.push(...earlyHandoff.events);
    expect(earlyHandoff.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
    apply(subject, ACTIONS[5]); const completed = subject.step(); events.push(...completed.events);
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
  });

  it.each([['select-cpap-alone', 'cpap'],
    ['select-high-flow-nasal-oxygen-alone', 'high-flow']] as const)(
    'explains unsupported modality %s without changing physiology', (choice, recorded) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 773, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 773, practiceRegion: 'US' });
      subject.step(); control.step();
      apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]);
      apply(control, ACTIONS[0]); apply(control, ACTIONS[1]);
      subject.step(); control.step(); apply(subject, choice);
      const after = subject.step(); const untouched = control.step();
      expect(after.state).toEqual(untouched.state);
      expect(after.equipment.resuscitation.noninvasiveVentilationSelectionAssessment)
        .toMatchObject({ lastUnsupportedChoice: recorded, selectionAtTick: null,
          bilevelNivSelectedByLearner: false });
      expect(after.events.some(({ eventId }) =>
        eventId.startsWith('noninvasive-ventilation-selection-modality-not-selected-'))).toBe(true);
    },
  );

  it('blocks generic, adjacent-family, and hostile treatment shortcuts immutably', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'fluid', 'airway-maneuver', 'rhythm',
      'obstruction', 'neuromuscular-reversal', 'mucus-plugging-response',
      'opioid-ventilatory-response', 'opioid-toxicity-response', 'copd-exacerbation-response',
      'acute-pulmonary-edema-response', 'obesity-hypoventilation-response',
      'neuromuscular-respiratory-failure-response'] as const;
    const shortcuts = ['diagnose-copd', 'set-ipap', 'set-epap', 'set-backup-rate',
      'fit-mask', 'start-oxygen', 'give-sedation', 'intubate', 'discharge',
      'predict-success', '__proto__', 'constructor'];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 774, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 774, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.concentrations).toEqual(untouched.concentrations);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('noninvasive-ventilation-selection-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('noninvasive-ventilation-selection-response-refused-')))
      .toHaveLength(shortcuts.length);
  });

  it('requires the exact target and replays deterministically', () => {
    const wrong = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'noninvasive-ventilation-selection'
        ? 'noninvasive-ventilation-selection-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario: wrong, seed: 775, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    expect(subject.step().equipment.resuscitation.noninvasiveVentilationSelectionAssessment)
      .toBeUndefined();
    const a = new AnesthesiaEngine({ scenario: SCENARIO, seed: 776, practiceRegion: 'US' });
    const b = new AnesthesiaEngine({ scenario: SCENARIO, seed: 776, practiceRegion: 'US' });
    a.step(); b.step();
    for (const action of ACTIONS.slice(0, 3)) { apply(a, action); apply(b, action); }
    expect(a.step()).toEqual(b.step());
  });
});

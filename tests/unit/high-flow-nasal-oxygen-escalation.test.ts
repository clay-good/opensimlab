import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { HIGH_FLOW_NASAL_OXYGEN_ESCALATION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/high-flow-nasal-oxygen-escalation';

const ACTIONS = ['reconcile-high-flow-oxygen-conventional-support-trajectory',
  'review-high-flow-oxygen-suitability-and-rescue-readiness',
  'select-high-flow-nasal-oxygen-escalation', 'review-high-flow-oxygen-early-response',
  'preserve-high-flow-oxygen-monitoring-and-failure-guards',
  'handoff-high-flow-oxygen-escalation'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'high-flow-nasal-oxygen-escalation-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('high-flow nasal oxygen escalation', () => {
  it('is valid, exact-targeted, and bounded to de novo nonhypercapnic hypoxemia', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['SpO₂ 88%', 'RR 34/min', 'pH 7.46', 'PaCO₂ 31 mmHg',
      'PaO₂ 55 mmHg', 'high-flow nasal oxygen trial']) expect(narrative).toContain(anchor);
    expect(narrative).toMatch(/delivered reservoir-mask FiO₂ is uncertain/i);
    expect(narrative).not.toMatch(/CO2 retainer|noncompliant|ROX above|intubation threshold/i);
    expect(SCENARIO.timeline.every(({ type }) => type === 'narrative')).toBe(true);
  });

  it('holds the fixed current state until the authored 30-minute response', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 781, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 110, respiratoryRateBpm: 34,
      spo2Percent: 88, etco2MmHg: 30, systolicMmHg: 122, diastolicMmHg: 72,
      meanArterialMmHg: 89 });
    for (const action of ACTIONS.slice(0, 3)) apply(subject, action);
    const sameTick = subject.step(); apply(subject, ACTIONS[3]); const response = subject.step();
    expect(sameTick.state).toMatchObject({ heartRateBpm: 110, respiratoryRateBpm: 34,
      spo2Percent: 88, etco2MmHg: 30 });
    expect(response.state).toMatchObject({ heartRateBpm: 98, respiratoryRateBpm: 26,
      spo2Percent: 94, etco2MmHg: 32, systolicMmHg: 120, diastolicMmHg: 72,
      meanArterialMmHg: 88 });
  });

  it('enforces sequence and both strictly elapsed gates', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 782, practiceRegion: 'US' });
    const onset = subject.step(); const events = [...onset.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    events.push(...subject.step().events);
    expect(events.filter(({ eventId }) => eventId.includes('trajectory-order-refused'))).toHaveLength(5);
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, ACTIONS[2]);
    apply(subject, ACTIONS[3]); const early = subject.step(); events.push(...early.events);
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

  it.each([['continue-conventional-oxygen', 'conventional'],
    ['select-bilevel-niv-first', 'bilevel']] as const)(
    'explains unsupported initial choice %s without changing physiology', (choice, recorded) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 783, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 783, practiceRegion: 'US' });
      subject.step(); control.step();
      for (const action of ACTIONS.slice(0, 2)) { apply(subject, action); apply(control, action); }
      subject.step(); control.step(); apply(subject, choice);
      const after = subject.step(); const untouched = control.step();
      expect(after.state).toEqual(untouched.state);
      expect(after.equipment.resuscitation.highFlowOxygenEscalationAssessment)
        .toMatchObject({ lastUnsupportedChoice: recorded, selectionAtTick: null,
          highFlowTrialIntentRecorded: false });
    },
  );

  it.each([['mark-high-flow-respiratory-failure-resolved', 'resolved'],
    ['reduce-high-flow-monitoring', 'reduced-monitoring']] as const)(
    'explains unsafe continuation choice %s without changing physiology', (choice, recorded) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 784, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 784, practiceRegion: 'US' });
      subject.step(); control.step();
      for (const action of ACTIONS.slice(0, 3)) { apply(subject, action); apply(control, action); }
      subject.step(); control.step(); apply(subject, ACTIONS[3]); apply(control, ACTIONS[3]);
      subject.step(); control.step(); apply(subject, choice);
      const after = subject.step(); const untouched = control.step();
      expect(after.state).toEqual(untouched.state);
      expect(after.equipment.resuscitation.highFlowOxygenEscalationAssessment)
        .toMatchObject({ lastUnsupportedChoice: recorded, guardsAtTick: null,
          durableSuccessProven: false });
    },
  );

  it('blocks generic, adjacent-family, and hostile treatment shortcuts immutably', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'fluid', 'airway-maneuver', 'rhythm',
      'obstruction', 'neuromuscular-reversal', 'mucus-plugging-response',
      'copd-exacerbation-response', 'acute-pulmonary-edema-response',
      'noninvasive-ventilation-selection-response',
      'community-acquired-pneumonia-hypoxemia-response', 'acute-severe-asthma-response',
      'escalating-hypoxemia-response', 'unplanned-extubation-response',
      'bronchiectasis-mucus-plugging-response', 'oxygen-device-failure-response'] as const;
    const shortcuts = ['start-hfnc', 'set-flow-60', 'set-fio2-100', 'set-temperature-37',
      'choose-cannula', 'target-spo2-100', 'calculate-rox', 'declare-hfno-success',
      'continue-despite-deterioration', 'delay-intubation', 'intubate-now', 'give-antibiotic',
      'give-diuretic', 'discharge', '__proto__', 'constructor'];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 785, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 785, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.concentrations).toEqual(untouched.concentrations);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('high-flow-oxygen-escalation-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('high-flow-oxygen-escalation-response-refused-')))
      .toHaveLength(shortcuts.length);
  });

  it('requires the exact target and replays deterministically', () => {
    const wrong = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'high-flow-nasal-oxygen-escalation'
        ? 'high-flow-nasal-oxygen-escalation-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario: wrong, seed: 786, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    expect(subject.step().equipment.resuscitation.highFlowOxygenEscalationAssessment).toBeUndefined();
    const a = new AnesthesiaEngine({ scenario: SCENARIO, seed: 787, practiceRegion: 'US' });
    const b = new AnesthesiaEngine({ scenario: SCENARIO, seed: 787, practiceRegion: 'US' });
    a.step(); b.step();
    for (const action of ACTIONS.slice(0, 3)) { apply(a, action); apply(b, action); }
    expect(a.step()).toEqual(b.step());
  });
});

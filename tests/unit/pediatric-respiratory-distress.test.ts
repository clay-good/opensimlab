import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { PEDIATRIC_RESPIRATORY_DISTRESS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-respiratory-distress';

const ACTIONS = ['reconcile-pediatric-respiratory-distress-whole-child',
  'activate-pediatric-respiratory-distress-support',
  'review-pediatric-respiratory-distress-early-response',
  'review-pediatric-respiratory-distress-later-panel',
  'activate-pediatric-respiratory-failure-rescue',
  'handoff-pediatric-respiratory-distress-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'pediatric-respiratory-distress-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('pediatric respiratory distress', () => {
  it('is valid, bounded to one child, cause-open, and free of treatment recipes', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 6, sex: 'female', weightKg: 20 });
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['SpO2 87%', 'RR 46/min', 'clean pulse-coherent pleth',
      'spontaneous breathing and a pulse', 'causes remain open']) expect(narrative).toContain(anchor);
    expect(narrative).toMatch(/do not examine, diagnose/i);
    expect(narrative).not.toMatch(/albuterol|epinephrine dose|oxygen at \d|tube size/i);
  });

  it('moves through authored initial, early single-number improvement, and later fatigue states', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 901, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 138, respiratoryRateBpm: 46,
      spo2Percent: 87, systolicMmHg: 104, diastolicMmHg: 66, meanArterialMmHg: 79 });
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); subject.step();
    apply(subject, ACTIONS[2]);
    const early = subject.step();
    expect(early.state).toMatchObject({ heartRateBpm: 134, respiratoryRateBpm: 44,
      spo2Percent: 94, systolicMmHg: 104, diastolicMmHg: 66 });
    apply(subject, ACTIONS[3]);
    const later = subject.step();
    expect(later.state).toMatchObject({ heartRateBpm: 146, respiratoryRateBpm: 28,
      spo2Percent: 90, systolicMmHg: 98, diastolicMmHg: 60, meanArterialMmHg: 73 });
    expect(later.equipment.resuscitation.pediatricRespiratoryDistressAssessment)
      .toMatchObject({ progressiveInadequateBreathingAuthored: true,
        diagnosisMadeByLearner: false, treatmentDeliveredByLearner: false });
  });

  it('enforces serial order and all strictly elapsed reassessment and handoff gates', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 902, practiceRegion: 'US' });
    const first = subject.step(); const events = [...first.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    events.push(...subject.step().events);
    expect(events.filter(({ eventId }) => eventId.includes('recognition-order-refused')))
      .toHaveLength(5);
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); apply(subject, ACTIONS[2]);
    let frame = subject.step(); events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('early-time-refused'))).toBe(true);
    apply(subject, ACTIONS[2]); apply(subject, ACTIONS[3]);
    frame = subject.step(); events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('later-time-refused'))).toBe(true);
    apply(subject, ACTIONS[3]); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]);
    frame = subject.step(); events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
    apply(subject, ACTIONS[5]); frame = subject.step(); events.push(...frame.events);
    const history = [{ tick: first.tick, state: first.state, concentrations: [] },
      { tick: frame.tick, state: frame.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
  });

  it.each([['complete-pediatric-respiratory-distress-history-first', 'history-first'],
    ['wait-for-pediatric-respiratory-distress-imaging', 'imaging-first']] as const)(
    'keeps the unsupported initial choice %s calm and nonmutating', (choice, recorded) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 903, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 903, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]); apply(control, ACTIONS[0]);
      subject.step(); control.step(); apply(subject, choice);
      const after = subject.step(); const untouched = control.step();
      expect(after.state).toEqual(untouched.state);
      expect(after.equipment.resuscitation.pediatricRespiratoryDistressAssessment)
        .toMatchObject({ lastUnsupportedChoice: recorded, supportAtTick: null,
          treatmentDeliveredByLearner: false });
    },
  );

  it('blocks generic, adjacent, disease-label, device, dose, and procedural shortcuts immutably', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'fluid', 'call-for-help',
      'airway-device', 'airway-maneuver', 'laryngoscopy', 'inhaled-bronchodilator',
      'silence-alarm', 'artifact', 'adult-asthma-response', 'acute-severe-asthma-response',
      'emergency-anaphylaxis-response', 'septic-shock-response',
      'high-flow-nasal-oxygen-escalation-response', 'noninvasive-ventilation-selection-response',
      'bronchiolitis-response', 'croup-response', 'pediatric-status-asthmaticus-response',
      'pediatric-foreign-body-airway-obstruction-response'] as const;
    const shortcuts = ['diagnose-bronchiolitis', 'diagnose-croup', 'diagnose-asthma',
      'give-albuterol', 'give-epinephrine', 'give-antibiotic', 'give-steroid',
      'give-fluid-20-ml-kg', 'start-high-flow', 'set-fio2-100', 'suction', 'bag-mask',
      'intubate', 'choose-tube-size', 'order-xray', 'interpret-blood-gas', 'discharge',
      'predict-recovery', '__proto__', 'constructor'];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 904, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 904, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: -999, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation.pediatricRespiratoryDistressAssessment)
      .toEqual(untouched.equipment.resuscitation.pediatricRespiratoryDistressAssessment);
    expect(refused.concentrations).toEqual(untouched.concentrations);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('pediatric-respiratory-distress-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('pediatric-respiratory-distress-response-refused-')))
      .toHaveLength(shortcuts.length);
  });

  it('requires the exact target and replays the same authored course deterministically', () => {
    const wrong = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'pediatric-respiratory-distress-reassessment'
        ? 'pediatric-respiratory-distress-reassessment-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario: wrong, seed: 905, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    expect(subject.step().equipment.resuscitation.pediatricRespiratoryDistressAssessment)
      .toBeUndefined();
    const a = new AnesthesiaEngine({ scenario: SCENARIO, seed: 906, practiceRegion: 'US' });
    const b = new AnesthesiaEngine({ scenario: SCENARIO, seed: 906, practiceRegion: 'US' });
    a.step(); b.step();
    for (const action of ACTIONS.slice(0, 2)) { apply(a, action); apply(b, action); }
    expect(a.step()).toEqual(b.step());
  });
});

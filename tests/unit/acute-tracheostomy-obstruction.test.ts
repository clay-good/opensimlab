import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { ACUTE_TRACHEOSTOMY_OBSTRUCTION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-tracheostomy-obstruction';

const ACTIONS = ['reconcile-acute-tracheostomy-obstruction-anatomy-and-patency',
  'activate-acute-tracheostomy-obstruction-help-and-oxygenation',
  'review-acute-tracheostomy-obstruction-device-pathway',
  'record-acute-tracheostomy-obstruction-inner-cannula-removal',
  'reassess-acute-tracheostomy-obstruction-restoration',
  'handoff-acute-tracheostomy-obstruction-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'acute-tracheostomy-obstruction-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('acute tracheostomy obstruction', () => {
  it('is valid, exact-targeted, device-specific, and explicit about its boundary', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['tracheostomy, not a laryngectomy', 'patent native upper airway',
      'SpO₂ 82%', 'RR 34/min', 'removable inner cannula', 'outer tube remains in place']) {
      expect(narrative).toContain(anchor);
    }
    expect(narrative).toMatch(/absent capnography is not diagnostic by itself/i);
    expect(narrative).not.toMatch(/suction pressure|catheter size|tube depth|oxygen at 15/i);
    expect(SCENARIO.timeline.every(({ type }) => type === 'narrative')).toBe(true);
  });

  it('models a distinct obstructed tracheostomy gas path and canonical downstream response', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 811, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.equipment.airway).toMatchObject({ intubated: false, device: 'facemask' });
    expect(onset.equipment.tracheostomy).toMatchObject({ present: true,
      device: 'cuffless-dual-cannula', innerCannula: 'obstructed', patencyFraction: 0.08,
      airflow: 'scant', continuousCapnography: false });
    expect(onset.state.heartRateBpm).toBeCloseTo(116.08);
    expect(onset.state.respiratoryRateBpm).toBeCloseTo(33.04);
    expect(onset.state.spo2Percent).toBeCloseTo(83.04);
    expect(onset.state.etco2MmHg).toBeCloseTo(3.04);
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    const restored = subject.step();
    expect(restored.equipment.tracheostomy).toMatchObject({
      innerCannula: 'removed-by-qualified-team', patencyFraction: 1,
      airflow: 'restored', continuousCapnography: true });
    expect(restored.state).toMatchObject({ heartRateBpm: 94, respiratoryRateBpm: 22,
      spo2Percent: 95, etco2MmHg: 38, systolicMmHg: 132, diastolicMmHg: 78,
      meanArterialMmHg: 96 });
  });

  it('enforces oxygenation-before-device order and both strictly elapsed gates', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 812, practiceRegion: 'US' });
    const onset = subject.step(); const events = [...onset.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    events.push(...subject.step().events);
    expect(events.filter(({ eventId }) => eventId.includes('recognition-order-refused'))).toHaveLength(5);
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); const early = subject.step(); events.push(...early.events);
    expect(early.events.some(({ eventId }) => eventId.includes('restoration-time-refused'))).toBe(true);
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]);
    const earlyHandoff = subject.step(); events.push(...earlyHandoff.events);
    expect(earlyHandoff.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
    apply(subject, ACTIONS[5]); const completed = subject.step(); events.push(...completed.events);
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
  });

  it.each([['wait-for-acute-tracheostomy-obstruction-imaging', 'imaging'],
    ['ventilate-through-unverified-tracheostomy', 'unverified-ventilation']] as const)(
    'explains unsupported initial choice %s without changing patient or device state', (choice, recorded) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 813, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 813, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]); apply(control, ACTIONS[0]);
      subject.step(); control.step(); apply(subject, choice);
      const after = subject.step(); const untouched = control.step();
      expect(after.state).toEqual(untouched.state);
      expect(after.equipment.tracheostomy).toEqual(untouched.equipment.tracheostomy);
      expect(after.equipment.resuscitation.acuteTracheostomyObstructionAssessment)
        .toMatchObject({ lastUnsupportedChoice: recorded, supportAtTick: null,
          dualRouteOxygenIntentRecorded: false });
    },
  );

  it.each([['force-acute-tracheostomy-obstruction-catheter', 'force-catheter'],
    ['replace-whole-tracheostomy-first', 'whole-tube']] as const)(
    'explains unsupported device shortcut %s without restoring patency', (choice, recorded) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 814, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 814, practiceRegion: 'US' });
      subject.step(); control.step();
      for (const action of ACTIONS.slice(0, 3)) { apply(subject, action); apply(control, action); }
      subject.step(); control.step(); apply(subject, choice);
      const after = subject.step(); const untouched = control.step();
      expect(after.state).toEqual(untouched.state);
      expect(after.equipment.tracheostomy).toEqual(untouched.equipment.tracheostomy);
      expect(after.equipment.resuscitation.acuteTracheostomyObstructionAssessment)
        .toMatchObject({ lastUnsupportedChoice: recorded, innerCannulaAtTick: null,
          expertDevicePathwayRecorded: false, durablePatencyProven: false });
    },
  );

  it('blocks generic, adjacent-family, and hostile physical shortcuts immutably', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'airway-maneuver', 'silence-alarm',
      'artifact', 'equipment-failure', 'obstruction', 'upper-airway-obstruction',
      'oxygen-device-failure-response', 'ventilator-circuit-disconnection-response',
      'endotracheal-tube-migration-response', 'pulse-oximeter-artifact-response',
      'high-flow-nasal-oxygen-escalation-response', 'unplanned-extubation-response',
      'mucus-plugging-response', 'bronchiectasis-mucus-plugging-response'] as const;
    const shortcuts = ['treat-as-laryngectomy', 'oxygen-face-only', 'oxygen-stoma-only',
      'wait-for-xray', 'pass-suction-catheter', 'suction-to-carina', 'remove-speaking-valve',
      'remove-inner-cannula', 'deflate-cuff', 'remove-tracheostomy', 'replace-tracheostomy',
      'choose-catheter-size', 'ventilate-via-stoma', 'bag-mask-face', 'oral-intubation',
      'set-oxygen-15', 'declare-resolved', 'discharge', '__proto__', 'constructor'];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 815, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 815, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.concentrations).toEqual(untouched.concentrations);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('acute-tracheostomy-obstruction-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('acute-tracheostomy-obstruction-response-refused-')))
      .toHaveLength(shortcuts.length);
  });

  it('requires the exact target and replays deterministically', () => {
    const wrong = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'acute-tracheostomy-obstruction-reassessment'
        ? 'acute-tracheostomy-obstruction-reassessment-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario: wrong, seed: 816, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    expect(subject.step().equipment.resuscitation.acuteTracheostomyObstructionAssessment).toBeUndefined();
    expect(subject.equipment().tracheostomy).toBeUndefined();
    const a = new AnesthesiaEngine({ scenario: SCENARIO, seed: 817, practiceRegion: 'US' });
    const b = new AnesthesiaEngine({ scenario: SCENARIO, seed: 817, practiceRegion: 'US' });
    a.step(); b.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(a, action); apply(b, action); }
    expect(a.step()).toEqual(b.step());
  });
});

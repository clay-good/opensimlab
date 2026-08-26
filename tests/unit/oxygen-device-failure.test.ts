import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { OXYGEN_DEVICE_FAILURE as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/oxygen-device-failure';

const ACTIONS = ['reconcile-oxygen-device-failure-patient-signal-and-delivery',
  'activate-oxygen-device-failure-immediate-bridge-and-help',
  'review-oxygen-device-failure-source-to-patient-path',
  'record-oxygen-device-failure-restoration-and-backup-intent',
  'review-oxygen-device-failure-delivery-and-patient-response',
  'handoff-oxygen-device-failure-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'oxygen-device-failure-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('portable oxygen source failure', () => {
  it('is valid, exact-targeted, and bounded to an authored no-flow transport event', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['SpO₂ 93%', 'SpO₂ 84%', 'RR 30/min', 'no remaining pressure',
      'no downstream oxygen flow', 'separate verified oxygen source']) expect(narrative).toContain(anchor);
    expect(narrative).toMatch(/attached interface and selected number do not prove delivered oxygen/i);
    expect(narrative).not.toMatch(/operator error|careless|forgot to check|cylinder duration formula/i);
    expect(SCENARIO.timeline.every(({ type }) => type === 'narrative')).toBe(true);
  });

  it('holds deterioration through restoration intent and changes only at elapsed response review', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 791, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 106, respiratoryRateBpm: 30,
      spo2Percent: 84, etco2MmHg: 34, systolicMmHg: 130, diastolicMmHg: 76,
      meanArterialMmHg: 94 });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    const sameTick = subject.step(); apply(subject, ACTIONS[4]); const response = subject.step();
    expect(sameTick.state).toMatchObject({ heartRateBpm: 106, respiratoryRateBpm: 30,
      spo2Percent: 84, etco2MmHg: 34 });
    expect(response.state).toMatchObject({ heartRateBpm: 94, respiratoryRateBpm: 24,
      spo2Percent: 92, etco2MmHg: 35, systolicMmHg: 126, diastolicMmHg: 74,
      meanArterialMmHg: 91 });
  });

  it('enforces support-before-troubleshooting order and both strictly elapsed gates', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 792, practiceRegion: 'US' });
    const onset = subject.step(); const events = [...onset.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    events.push(...subject.step().events);
    expect(events.filter(({ eventId }) => eventId.includes('reconciliation-order-refused'))).toHaveLength(5);
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); const early = subject.step(); events.push(...early.events);
    expect(early.events.some(({ eventId }) => eventId.includes('response-time-refused'))).toBe(true);
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]);
    const earlyHandoff = subject.step(); events.push(...earlyHandoff.events);
    expect(earlyHandoff.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
    apply(subject, ACTIONS[5]); const completed = subject.step(); events.push(...completed.events);
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
  });

  it.each([['wait-for-oxygen-device-failure-blood-gas', 'blood-gas'],
    ['continue-oxygen-device-failure-transport', 'continue-transport']] as const)(
    'explains unsafe bridge choice %s without changing physiology', (choice, recorded) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 793, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 793, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]); apply(control, ACTIONS[0]);
      subject.step(); control.step(); apply(subject, choice);
      const after = subject.step(); const untouched = control.step();
      expect(after.state).toEqual(untouched.state);
      expect(after.equipment.resuscitation.oxygenDeviceFailureAssessment)
        .toMatchObject({ lastUnsupportedChoice: recorded, bridgeAtTick: null,
          alternateSourceIntentRecorded: false });
    },
  );

  it.each([['increase-depleted-oxygen-source-control', 'increase-source'],
    ['reseat-patent-oxygen-interface', 'reseat-cannula']] as const)(
    'explains unsupported correction %s without changing physiology', (choice, recorded) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 794, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 794, practiceRegion: 'US' });
      subject.step(); control.step();
      for (const action of ACTIONS.slice(0, 3)) { apply(subject, action); apply(control, action); }
      subject.step(); control.step(); apply(subject, choice);
      const after = subject.step(); const untouched = control.step();
      expect(after.state).toEqual(untouched.state);
      expect(after.equipment.resuscitation.oxygenDeviceFailureAssessment)
        .toMatchObject({ lastUnsupportedChoice: recorded, restorationAtTick: null,
          durableRestorationProven: false });
    },
  );

  it('blocks generic, adjacent-family, and hostile equipment shortcuts immutably', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'fluid', 'airway-maneuver', 'silence-alarm',
      'artifact', 'equipment-failure', 'breathing-circuit', 'pulse-oximeter-artifact-response',
      'ventilator-circuit-disconnection-response', 'high-flow-nasal-oxygen-escalation-response',
      'noninvasive-ventilation-selection-response', 'acute-pulmonary-edema-response',
      'community-acquired-pneumonia-hypoxemia-response', 'escalating-hypoxemia-response',
      'unplanned-extubation-response', 'mucus-plugging-response'] as const;
    const shortcuts = ['treat-the-number', 'restart-device', 'power-cycle-device', 'reconnect-tubing',
      'open-cylinder', 'switch-to-wall-oxygen', 'set-flow-15', 'set-fio2-100', 'select-hfnc',
      'select-niv', 'calculate-cylinder-duration', 'declare-artifact', 'repair-device',
      'continue-without-backup', 'delay-bridge-until-cause-known', 'intubate-now', 'discharge',
      'declare-restored', 'predict-recovery', '__proto__', 'constructor'];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 795, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 795, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.concentrations).toEqual(untouched.concentrations);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('oxygen-device-failure-generic-action-refused-'))).toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('oxygen-device-failure-response-refused-'))).toHaveLength(shortcuts.length);
  });

  it('requires the exact target and replays deterministically', () => {
    const wrong = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'oxygen-device-failure' ? 'oxygen-device-failure-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario: wrong, seed: 796, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    expect(subject.step().equipment.resuscitation.oxygenDeviceFailureAssessment).toBeUndefined();
    const a = new AnesthesiaEngine({ scenario: SCENARIO, seed: 797, practiceRegion: 'US' });
    const b = new AnesthesiaEngine({ scenario: SCENARIO, seed: 797, practiceRegion: 'US' });
    a.step(); b.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(a, action); apply(b, action); }
    expect(a.step()).toEqual(b.step());
  });
});

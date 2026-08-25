import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { COMMUNITY_ACQUIRED_PNEUMONIA_HYPOXEMIA_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/community-acquired-pneumonia-hypoxemia-reassessment';
import { ESCALATING_HYPOXEMIA } from '../../src/modules/critical-care/scenarios/escalating-hypoxemia';

const ACTIONS = ['corroborate-and-support-cap-hypoxemia',
  'reconcile-cap-evidence-and-dangerous-alternatives',
  'classify-cap-severity-and-escalation-needs',
  'record-cap-testing-and-empiric-treatment-intent',
  'handoff-cap-hypoxemia-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'community-acquired-pneumonia-hypoxemia-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('community-acquired pneumonia hypoxemia reassessment', () => {
  it('is valid, bounded, and distinct from ventilated escalating hypoxemia', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.id).not.toBe(ESCALATING_HYPOXEMIA.metadata.id);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['SpO₂ 85%', 'PaO₂ 51 mmHg', 'approximately 243',
      '3 ATS/IDSA minor severe-CAP features', 'do not independently determine']) {
      expect(narrative).toContain(anchor);
    }
    expect(narrative).toMatch(/do not examine/i);
  });

  it('calibrates the live monitor to the fixed room-air presentation', () => {
    const result = new AnesthesiaEngine({ scenario: SCENARIO, seed: 501,
      practiceRegion: 'US' }).step();
    expect(result.state).toMatchObject({ heartRateBpm: 112, respiratoryRateBpm: 32,
      spo2Percent: 85, systolicMmHg: 116, diastolicMmHg: 70,
      meanArterialMmHg: 85, coreTemperatureC: 38.6 });
  });

  it('enforces every serial gate and a strictly later handoff', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 502,
      practiceRegion: 'US' });
    const onset = subject.step();
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    const refused = subject.step();
    expect(refused.equipment.resuscitation.capHypoxemiaAssessment).toMatchObject({
      supportAtTick: null, evidenceAtTick: null, severityAtTick: null,
      treatmentIntentAtTick: null, handoffAtTick: null,
      hypoxemiaAuthored: true, pneumoniaPatternAuthored: true,
      oxygenDeliveredByLearner: false, supportDeviceSelected: false,
      antimicrobialSelected: false, testAcquiredByLearner: false,
      dispositionDetermined: false, outcomePredicted: false,
    });
    expect(refused.events.filter(({ eventId }) => eventId.includes('order-refused')))
      .toHaveLength(4);
    for (const action of ACTIONS.slice(0, -1)) apply(subject, action);
    apply(subject, ACTIONS[4]);
    const premature = subject.step();
    expect(premature.events.some(({ eventId }) =>
      eventId.startsWith('cap-hypoxemia-handoff-time-refused-'))).toBe(true);
    apply(subject, ACTIONS[4]);
    const completed = subject.step();
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events,
      ...refused.events, ...premature.events, ...completed.events])
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses generic controls without mutating patient or equipment state', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'epinephrine', 'fluid',
      'airway-maneuver', 'rhythm', 'obstruction'] as const;
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 503, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 503, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type,
      payload: { amount: 100, drugId: 'propofol', fio2: 1 } });
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('cap-hypoxemia-generic-action-refused-'))).toHaveLength(blocked.length);
  });

  it('requires the exact target and rejects shortcuts and cross-scenario actions', () => {
    const scenario = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === SCENARIO.metadata.id ? `${SCENARIO.metadata.id}-extra` : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario, seed: 504, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    for (const shortcut of ['give-antibiotics', 'set-fio2-100', 'start-hfno',
      'intubate', 'calculate-curb65', '__proto__']) apply(subject, shortcut);
    apply(subject, 'trace-oxygen-source-to-patient', 'escalating-hypoxemia-response');
    const result = subject.step();
    expect(result.equipment.resuscitation.capHypoxemiaAssessment).toBeUndefined();
    expect(result.events.filter(({ eventId }) =>
      eventId.startsWith('cap-hypoxemia-response-refused-'))).toHaveLength(7);
  });
});

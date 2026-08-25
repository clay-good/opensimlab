import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { COPD_EXACERBATION_TRANSITION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/copd-exacerbation-transition-reassessment';
import { COPD_EXACERBATION } from '../../src/modules/emergency-medicine/scenarios/copd-exacerbation';

const ACTIONS = ['reconcile-copd-exacerbation-recovery-and-readiness',
  'review-copd-exacerbation-residual-respiratory-and-oxygen-needs',
  'review-copd-exacerbation-maintenance-and-acute-medication-plan',
  'coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up',
  'handoff-copd-exacerbation-transition-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'copd-exacerbation-transition-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('COPD exacerbation transition reassessment', () => {
  it('is valid, bounded, and distinct from first-contact emergency care', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.id).not.toBe(COPD_EXACERBATION.metadata.id);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .not.toEqual(COPD_EXACERBATION.metadata.objectives.map(({ id }) => id));
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['hospital day 3', '200 m', '30 m', 'SpO₂ falls to 86%',
      'does not establish long-term oxygen eligibility']) expect(narrative).toContain(anchor);
    expect(narrative).toMatch(/do not examine/i);
  });

  it('calibrates the live resting monitor to the current authored report', () => {
    const result = new AnesthesiaEngine({ scenario: SCENARIO, seed: 401,
      practiceRegion: 'US' }).step();
    expect(result.state).toMatchObject({ heartRateBpm: 88, respiratoryRateBpm: 20,
      spo2Percent: 91, systolicMmHg: 126, diastolicMmHg: 74,
      meanArterialMmHg: 91, coreTemperatureC: 36.8 });
  });

  it('enforces all serial gates and a strictly later handoff', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 402,
      practiceRegion: 'US' });
    const onset = subject.step();
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    const refused = subject.step();
    expect(refused.equipment.resuscitation.copdTransitionAssessment).toMatchObject({
      readinessAtTick: null, respiratoryNeedsAtTick: null, medicationAtTick: null,
      coordinationAtTick: null, handoffAtTick: null,
      treatmentDeliveredByLearner: false, oxygenDeliveredByLearner: false,
      longTermOxygenEligibilityDetermined: false, regimenSelected: false,
      rehabilitationEnrolled: false, dispositionDetermined: false,
      outcomePredicted: false,
    });
    expect(refused.events.filter(({ eventId }) =>
      eventId.includes('order-refused'))).toHaveLength(4);
    for (const action of ACTIONS.slice(0, -1)) apply(subject, action);
    apply(subject, ACTIONS[4]);
    const premature = subject.step();
    expect(premature.events.some(({ eventId }) =>
      eventId.startsWith('copd-transition-handoff-time-refused-'))).toBe(true);
    apply(subject, ACTIONS[4]);
    const completed = subject.step();
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events,
      ...refused.events, ...premature.events, ...completed.events])
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses generic controls without mutating the patient or equipment', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'epinephrine', 'fluid',
      'airway-maneuver', 'rhythm', 'obstruction'] as const;
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 403, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 403, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type,
      payload: { amount: 100, drugId: 'propofol', fio2: 1 } });
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('copd-transition-generic-action-refused-'))).toHaveLength(blocked.length);
  });

  it('requires the exact target and rejects shortcuts and cross-scenario actions', () => {
    const scenario = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === SCENARIO.metadata.id ? `${SCENARIO.metadata.id}-extra` : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario, seed: 404, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    for (const shortcut of ['prescribe-home-oxygen', 'select-inhaler', 'discharge-now',
      'book-rehab', '__proto__']) apply(subject, shortcut);
    apply(subject, 'assess-copd-exacerbation-severity', 'copd-exacerbation-response');
    const result = subject.step();
    expect(result.equipment.resuscitation.copdTransitionAssessment).toBeUndefined();
    expect(result.events.filter(({ eventId }) =>
      eventId.startsWith('copd-transition-response-refused-'))).toHaveLength(6);
  });
});

import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { POST_PULMONARY_EMBOLISM_PERSISTENT_DYSPNEA as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/post-pulmonary-embolism-persistent-dyspnea';
import { PULMONARY_EMBOLISM_DETERIORATION } from '../../src/modules/emergency-medicine/scenarios/pulmonary-embolism-deterioration';
import { MASSIVE_PULMONARY_EMBOLISM } from '../../src/modules/critical-care/scenarios/massive-pulmonary-embolism';

const ACTIONS = ['reconcile-post-pe-symptoms-and-anticoagulation-course',
  'review-post-pe-functional-limitation-and-current-safety',
  'review-post-pe-ctepd-evidence-and-alternatives',
  'activate-post-pe-pulmonary-vascular-referral',
  'handoff-post-pe-persistent-dyspnea-reassessment'] as const;
const apply = (subject: AnesthesiaEngine, action: string,
  type = 'post-pulmonary-embolism-persistent-dyspnea-response') => subject.apply({
  tick: subject.tick, type, payload: { action },
});

describe('post-pulmonary-embolism persistent dyspnea', () => {
  it('is valid, longitudinal, and distinct from both acute PE rescue labs', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect([PULMONARY_EMBOLISM_DETERIORATION.metadata.id,
      MASSIVE_PULMONARY_EMBOLISM.metadata.id]).not.toContain(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['4 months', '2 miles', '150 m', '280 m',
      'multiple bilateral segmental mismatched perfusion defects',
      'do not diagnose CTEPD or CTEPH']) expect(narrative).toContain(anchor);
    expect(narrative).toMatch(/do not examine/i);
  });

  it('calibrates the live monitor to the stable resting report', () => {
    const result = new AnesthesiaEngine({ scenario: SCENARIO, seed: 601,
      practiceRegion: 'US' }).step();
    expect(result.state).toMatchObject({ heartRateBpm: 88, respiratoryRateBpm: 18,
      spo2Percent: 96, systolicMmHg: 122, diastolicMmHg: 76,
      meanArterialMmHg: 91, coreTemperatureC: 36.8 });
  });

  it('enforces every serial gate and a strictly later handoff', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 602, practiceRegion: 'US' });
    const onset = subject.step();
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    const refused = subject.step();
    expect(refused.equipment.resuscitation.postPeDyspneaAssessment).toMatchObject({
      trajectoryAtTick: null, safetyAtTick: null, evidenceAtTick: null,
      referralAtTick: null, handoffAtTick: null, acutePeConfirmedAuthored: true,
      anticoagulationDeliveredByLearner: false, testAcquiredByLearner: false,
      ctepdDiagnosed: false, treatmentSelected: false,
      dispositionDetermined: false, outcomePredicted: false,
    });
    expect(refused.events.filter(({ eventId }) => eventId.includes('order-refused'))).toHaveLength(4);
    for (const action of ACTIONS.slice(0, -1)) apply(subject, action);
    apply(subject, ACTIONS[4]);
    const premature = subject.step();
    expect(premature.events.some(({ eventId }) =>
      eventId.startsWith('post-pe-dyspnea-handoff-time-refused-'))).toBe(true);
    apply(subject, ACTIONS[4]);
    const completed = subject.step();
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events,
      ...refused.events, ...premature.events, ...completed.events])
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('blocks generic treatment controls without mutating patient or equipment', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'inhaled-bronchodilator', 'epinephrine', 'fluid',
      'airway-maneuver', 'rhythm', 'obstruction'] as const;
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 603, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 603, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type,
      payload: { amount: 100, drugId: 'propofol', fio2: 1 } });
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('post-pe-dyspnea-generic-action-refused-'))).toHaveLength(blocked.length);
  });

  it('requires the exact target and rejects shortcuts and acute-PE actions', () => {
    const scenario = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
      target: entry.target === 'post-pulmonary-embolism-persistent-dyspnea-reassessment'
        ? 'post-pulmonary-embolism-persistent-dyspnea-reassessment-extra' : entry.target })) };
    const subject = new AnesthesiaEngine({ scenario, seed: 604, practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS[0]);
    for (const shortcut of ['select-apixaban', 'set-duration-3-months', 'stop-anticoagulation',
      'diagnose-cteph', 'perform-balloon-angioplasty', '__proto__']) apply(subject, shortcut);
    apply(subject, 'classify-acute-pe-severity', 'pulmonary-embolism-response');
    const result = subject.step();
    expect(result.equipment.resuscitation.postPeDyspneaAssessment).toBeUndefined();
    expect(result.events.filter(({ eventId }) =>
      eventId.startsWith('post-pe-dyspnea-response-refused-'))).toHaveLength(7);
  });
});

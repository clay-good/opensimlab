import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { routeFor } from '../../src/routes/routes';
import { ACUTE_DECOMPENSATED_HEART_FAILURE as SCENARIO } from '../../src/modules/cardiology/scenarios/acute-decompensated-heart-failure';

const ACTIONS = ['reconcile-heart-failure-congestion-and-perfusion',
  'review-heart-failure-diuretic-response', 'review-heart-failure-tolerance-and-precipitant',
  'record-heart-failure-transition-intent', 'reassess-heart-failure-discharge-readiness'];

describe('cardiology acute decompensated heart failure', () => {
  it('validates the serial decongestion and no-live-care boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('77.2 to 75.8 kg');
    expect(narrative).toContain('persistent congestion');
    expect(narrative).toContain('not discharge-ready');
    expect(narrative).toContain('does not examine, acquire or interpret tests');
    const ordinary = new AnesthesiaEngine({ scenario: ROUTINE_INDUCTION,
      seed: 172, practiceRegion: 'US' }).step();
    expect(ordinary.equipment.resuscitation.heartFailureAssessment).toBeUndefined();
    expect(routeFor('/cardiology/scenario/acute-decompensated-heart-failure')).toMatchObject({
      indexable: true,
      heading: 'Acute decompensated heart failure',
    });
  });

  it('orders status, response, tolerance, transition, and readiness', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 171, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 84, meanArterialMmHg: 88,
      respiratoryRateBpm: 18, spo2Percent: 94, coreTemperatureC: 36.8 });
    for (const action of ACTIONS) subject.apply({ tick: subject.tick,
      type: 'heart-failure-response', payload: { action } });
    const completed = subject.step();
    expect(completed.equipment.resuscitation.heartFailureAssessment).toMatchObject({
      statusAtTick: expect.any(Number), responseAtTick: expect.any(Number),
      toleranceAtTick: expect.any(Number), transitionAtTick: expect.any(Number),
      readinessAtTick: expect.any(Number), residualCongestion: true,
      dischargeReady: false, doseCalculated: false, treatmentDelivered: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature transition, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 173, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'heart-failure-response', payload: { action } });
    apply(ACTIONS[3]!); apply('double-the-diuretic'); apply(ACTIONS[0]!); apply(ACTIONS[0]!);
    const refused = subject.step();
    expect(refused.equipment.resuscitation.heartFailureAssessment).toMatchObject({
      statusAtTick: expect.any(Number), responseAtTick: null, toleranceAtTick: null,
      transitionAtTick: null, readinessAtTick: null, treatmentDelivered: false });
    expect(refused.events.some((e) => e.eventId.startsWith('heart-failure-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('heart-failure-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('heart-failure-status-refused-'))).toBe(true);
  });
});

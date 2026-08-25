import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { routeFor } from '../../src/routes/routes';
import { ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE as SCENARIO } from '../../src/modules/cardiology/scenarios/atrial-fibrillation-with-rapid-response';

const ACTIONS = ['reconcile-af-rvr-rhythm-and-stability', 'review-af-rvr-context-and-triggers',
  'record-af-rvr-rate-control-intent', 'record-af-rvr-stroke-prevention-intent',
  'reassess-af-rvr-trajectory-and-follow-up'];

describe('cardiology atrial fibrillation with rapid response', () => {
  it('validates the stable, uncertain-duration, and no-live-care boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('irregular narrow-complex rhythm at 142/min');
    expect(narrative).toContain('duration is uncertain');
    expect(narrative).toContain('no authored hypotension, shock, ischemic discomfort, acute heart failure');
    expect(narrative).toContain('does not acquire or interpret an ECG');
    expect(routeFor('/cardiology/scenario/atrial-fibrillation-with-rapid-response'))
      .toMatchObject({ indexable: true, heading: 'Atrial fibrillation with rapid response' });
    const ordinary = new AnesthesiaEngine({ scenario: ROUTINE_INDUCTION,
      seed: 182, practiceRegion: 'US' }).step();
    expect(ordinary.equipment.resuscitation.afRvrAssessment).toBeUndefined();
  });

  it('orders stability, context, rate intent, stroke prevention, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 181, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 142, meanArterialMmHg: 87,
      respiratoryRateBpm: 18, spo2Percent: 97, coreTemperatureC: 36.7 });
    expect(onset.equipment.rhythmId).toBe('atrial-fibrillation');
    for (const action of ACTIONS) subject.apply({ tick: subject.tick,
      type: 'af-rvr-response', payload: { action } });
    const completed = subject.step();
    expect(completed.equipment.resuscitation.afRvrAssessment).toMatchObject({
      stabilityAtTick: expect.any(Number), contextAtTick: expect.any(Number),
      rateIntentAtTick: expect.any(Number), strokePreventionAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number), hemodynamicallyStable: true,
      durationCertain: false, exactScoreCalculated: false, treatmentDelivered: false });
    expect(completed).toMatchObject({ state: { heartRateBpm: 96, meanArterialMmHg: 88 },
      equipment: { rhythmId: 'atrial-fibrillation' } });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature rate intent, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 183, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'af-rvr-response', payload: { action } });
    apply(ACTIONS[2]!); apply('give-diltiazem'); apply(ACTIONS[0]!); apply(ACTIONS[0]!);
    const refused = subject.step();
    expect(refused.equipment.resuscitation.afRvrAssessment).toMatchObject({
      stabilityAtTick: expect.any(Number), contextAtTick: null, rateIntentAtTick: null,
      strokePreventionAtTick: null, reassessmentAtTick: null, treatmentDelivered: false });
    expect(refused.events.some((e) => e.eventId.startsWith('af-rvr-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('af-rvr-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('af-rvr-stability-refused-'))).toBe(true);
  });
});

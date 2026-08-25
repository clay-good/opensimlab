import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { STABLE_CHEST_PAIN_EVALUATION as SCENARIO } from '../../src/modules/cardiology/scenarios/stable-chest-pain-evaluation';

const ACTIONS = ['verify-stable-chest-pain-trajectory', 'characterize-stable-chest-pain-pattern',
  'estimate-stable-chest-pain-clinical-likelihood', 'record-stable-chest-pain-testing-intent',
  'safety-net-stable-chest-pain-follow-up'];

describe('cardiology stable chest-pain evaluation', () => {
  it('validates stability, likelihood, shared choice, and acute-change boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('The cause is not announced');
    expect(narrative).toContain('without calling it atypical');
    expect(narrative).toContain('not very low');
    expect(narrative).toContain('no exact score');
    const ordinary = new AnesthesiaEngine({ scenario: ROUTINE_INDUCTION,
      seed: 152, practiceRegion: 'US' }).step();
    expect(ordinary.equipment.resuscitation.stableChestPainAssessment).toBeUndefined();
  });

  it('orders stability, symptom pattern, likelihood, shared testing, and safety net', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 151, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 72, meanArterialMmHg: 92,
      respiratoryRateBpm: 14, spo2Percent: 99, coreTemperatureC: 36.8 });
    for (const action of ACTIONS) subject.apply({ tick: subject.tick,
      type: 'stable-chest-pain-response', payload: { action } });
    const completed = subject.step();
    expect(completed.equipment.resuscitation.stableChestPainAssessment).toMatchObject({
      stabilityAtTick: expect.any(Number), patternAtTick: expect.any(Number),
      likelihoodAtTick: expect.any(Number), testingAtTick: expect.any(Number),
      safetyNetAtTick: expect.any(Number), clinicalLikelihood: 'not-very-low',
      exactScoreCalculated: false, testPerformed: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature testing, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 153, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'stable-chest-pain-response', payload: { action } });
    apply(ACTIONS[3]!); apply('order-angiography'); apply(ACTIONS[0]!); apply(ACTIONS[0]!);
    const refused = subject.step();
    expect(refused.equipment.resuscitation.stableChestPainAssessment).toMatchObject({
      stabilityAtTick: expect.any(Number), patternAtTick: null, likelihoodAtTick: null,
      testingAtTick: null, safetyNetAtTick: null, testPerformed: false });
    expect(refused.events.some((e) => e.eventId.startsWith('stable-chest-pain-stability-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('stable-chest-pain-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('stable-chest-pain-stability-refused-'))).toBe(true);
  });
});

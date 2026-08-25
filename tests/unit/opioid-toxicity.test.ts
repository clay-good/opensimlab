import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { OPIOID_TOXICITY as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/opioid-toxicity';

describe('emergency opioid toxicity', () => {
  it('validates severe respiratory depression with a definite pulse and open mimics', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('definite carotid pulse at 58/min');
    expect(narrative).toContain('respirations at 4/min');
    expect(narrative).toContain('co-exposure remains possible');
  });

  it('orders ventilation, naloxone, initial reassessment, and recurrent-depression rescue', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 80, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'opioid-toxicity-response', payload: { action },
    });
    for (const action of ['review-opioid-toxicity-pattern', 'record-opioid-ventilation-support',
      'record-opioid-naloxone-intent', 'reassess-opioid-initial-response',
      'review-opioid-recurrence', 'record-opioid-recurrence-and-safety-plan']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.opioidToxicityAssessment).toMatchObject({
      patternReviewedAtTick: expect.any(Number), ventilationAtTick: expect.any(Number),
      antagonistAtTick: expect.any(Number), initialReassessmentAtTick: expect.any(Number),
      recurrenceReviewedAtTick: expect.any(Number), recurrencePlanAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^opioid-initial-reassessed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ respiratoryRatePerMin: 14, spo2Percent: 97, etco2MmHg: 43 });
    expect(completed.events.find((event) => /^opioid-recurrence-reviewed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ respiratoryRatePerMin: 7, spo2Percent: 90, etco2MmHg: 58 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses naloxone-before-ventilation and premature-discharge shortcuts', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 81, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'opioid-toxicity-response', payload: { action },
    });
    apply('review-opioid-toxicity-pattern');
    apply('record-opioid-naloxone-intent');
    apply('record-opioid-recurrence-and-safety-plan');
    apply('discharge-after-waking');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.opioidToxicityAssessment).toMatchObject({
      patternReviewedAtTick: expect.any(Number), ventilationAtTick: null,
      antagonistAtTick: null, initialReassessmentAtTick: null,
      recurrenceReviewedAtTick: null, recurrencePlanAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('opioid-ventilation-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('opioid-toxicity-response-refused-'))).toBe(true);
  });
});

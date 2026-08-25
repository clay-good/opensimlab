import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SEVERE_HYPONATREMIA_WITH_SEIZURE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/severe-hyponatremia-with-seizure';

describe('emergency severe hyponatremia with seizure', () => {
  it('validates a severe symptom-led hypotonic-hyponatremia emergency', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('sodium 112 mmol/L');
    expect(narrative).toContain('measured serum osmolality 238 mOsm/kg');
    expect(narrative).toContain('No trauma, ongoing convulsion, hyperglycemia, or exogenous osmole');
  });

  it('orders stabilization, symptom-led rescue, early reassessment, and overcorrection prevention', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 78, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'hyponatremia-response', payload: { action },
    });
    for (const action of ['review-hyponatremia-pattern', 'record-hyponatremia-stabilization',
      'record-hypertonic-saline-intent', 'reassess-hyponatremia-first-hour',
      'record-hyponatremia-guardrails-and-cause-plan']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.hyponatremiaAssessment).toMatchObject({
      patternReviewedAtTick: expect.any(Number), stabilizedAtTick: expect.any(Number),
      hypertonicAtTick: expect.any(Number), reassessedAtTick: expect.any(Number),
      guardrailsAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^hyponatremia-hypertonic-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ intentOnly: true, initialSodiumMmolPerL: 112, firstHourTargetRiseMmolPerL: 5 });
    expect(completed.events.find((event) => /^hyponatremia-reassessed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ sodiumMmolPerL: 117, sodiumRiseMmolPerL: 5, urineOutputMlPerHour: 180 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses hypertonic intent before stabilization and normalization shortcuts', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 79, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'hyponatremia-response', payload: { action },
    });
    apply('review-hyponatremia-pattern');
    apply('record-hypertonic-saline-intent');
    apply('record-hyponatremia-guardrails-and-cause-plan');
    apply('normalize-sodium-now');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.hyponatremiaAssessment).toMatchObject({
      patternReviewedAtTick: expect.any(Number), stabilizedAtTick: null,
      hypertonicAtTick: null, reassessedAtTick: null, guardrailsAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('hyponatremia-stabilization-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('hyponatremia-response-refused-'))).toBe(true);
  });
});

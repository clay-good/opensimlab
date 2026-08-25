import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { DIABETIC_KETOACIDOSIS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/diabetic-ketoacidosis';

describe('emergency diabetic ketoacidosis', () => {
  it('validates fixed moderate DKA and its potassium gate', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('β-hydroxybutyrate 5.4 mmol/L');
    expect(narrative).toContain('potassium 3.2 mmol/L');
    expect(narrative).toContain('do not use anion gap or urine ketones alone');
    expect(SCENARIO.metadata.limitations).toHaveLength(3);
  });

  it('requires ordered potassium-gated insulin, dextrose continuation, and resolution', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 74, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'diabetic-ketoacidosis-response', payload: { action },
    });
    for (const action of ['review-dka-presentation', 'record-dka-fluids-and-monitoring',
      'record-dka-potassium-replacement', 'record-dka-insulin-intent',
      'add-dextrose-and-continue-insulin', 'confirm-dka-resolution-and-transition']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.diabeticKetoacidosisAssessment).toMatchObject({
      presentationReviewedAtTick: expect.any(Number), fluidsAtTick: expect.any(Number),
      potassiumAtTick: expect.any(Number), insulinAtTick: expect.any(Number),
      dextroseAtTick: expect.any(Number), transitionAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^dka-potassium-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ initialPotassiumMmolPerL: 3.2, repeatPotassiumMmolPerL: 3.7 });
    expect(completed.events.find((event) => /^dka-transition-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ glucoseMgPerDl: 186, betaHydroxybutyrateMmolPerL: 0.4,
        venousPh: 7.32, bicarbonateMmolPerL: 19, potassiumMmolPerL: 4.0 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses insulin before potassium correction and transition before dextrose continuation', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 75, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'diabetic-ketoacidosis-response', payload: { action },
    });
    apply('review-dka-presentation');
    apply('record-dka-fluids-and-monitoring');
    apply('record-dka-insulin-intent');
    apply('confirm-dka-resolution-and-transition');
    apply('close-anion-gap');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.diabeticKetoacidosisAssessment).toMatchObject({
      fluidsAtTick: expect.any(Number), potassiumAtTick: null, insulinAtTick: null,
      dextroseAtTick: null, transitionAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('dka-potassium-order-refused-')))
      .toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('dka-response-refused-')))
      .toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { HYPERKALEMIA_WITH_ECG_CHANGE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/hyperkalemia-with-ecg-change';

describe('emergency hyperkalemia with ECG change', () => {
  it('validates confirmed severe potassium elevation, ECG toxicity, and reversible drivers', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('potassium 7.1 mmol/L');
    expect(narrative).toContain('P-wave flattening, and QRS 140 ms');
    expect(narrative).toContain('no arrest is authored');
  });

  it('orders myocardial protection, shifting, removal, and rebound reassessment', () => {
    for (const order of [['record-hyperkalemia-insulin-glucose',
      'record-hyperkalemia-beta-agonist', 'record-hyperkalemia-removal-and-cause-control'],
    ['record-hyperkalemia-removal-and-cause-control', 'record-hyperkalemia-beta-agonist',
      'record-hyperkalemia-insulin-glucose']]) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 76, practiceRegion: 'US' });
      const onset = subject.step();
      const apply = (action: string) => subject.apply({
        tick: subject.tick, type: 'hyperkalemia-response', payload: { action },
      });
      apply('review-hyperkalemia-pattern');
      apply('record-hyperkalemia-calcium-intent');
      apply('review-hyperkalemia-post-calcium-ecg');
      const intent = subject.step();
      expect(intent.equipment.resuscitation.hyperkalemiaAssessment?.postCalciumEcgAtTick).toBeNull();
      expect(intent.events.find((event) => /^hyperkalemia-calcium-\d+$/.test(event.eventId))?.data)
        .toMatchObject({ intentOnly: true, potassiumMmolPerL: 7.1,
          treatmentDeliveredByLearner: false, ecgChanged: false });
      apply('review-hyperkalemia-post-calcium-ecg');
      const postCalcium = subject.step();
      expect(postCalcium.events.find((event) => /^hyperkalemia-post-calcium-ecg-\d+$/.test(event.eventId))?.data)
        .toMatchObject({ potassiumMmolPerL: 7.1, repeatQrsMs: 104,
          treatmentDeliveredByLearner: false });
      for (const next of order) apply(next);
      apply('reassess-hyperkalemia');
      const premature = subject.step();
      expect(premature.equipment.resuscitation.hyperkalemiaAssessment?.reassessedAtTick).toBeNull();
      apply('reassess-hyperkalemia');
      const completed = subject.step();
      expect(completed.equipment.resuscitation.hyperkalemiaAssessment).toMatchObject({
        patternReviewedAtTick: expect.any(Number), calciumAtTick: expect.any(Number),
        postCalciumEcgAtTick: expect.any(Number), insulinGlucoseAtTick: expect.any(Number),
        betaAgonistAtTick: expect.any(Number), removalAtTick: expect.any(Number),
        reassessedAtTick: expect.any(Number),
      });
      expect(completed.events.find((event) => /^hyperkalemia-reassessed-\d+$/.test(event.eventId))?.data)
        .toMatchObject({ potassiumMmolPerL: 5.8, glucoseMgPerDl: 92, qrsMs: 98 });
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      const log = [...onset.events, ...intent.events, ...postCalcium.events,
        ...premature.events, ...completed.events];
      expect(objectiveFindings(SCENARIO, history, 0, 0, [], log)
        .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
    }
  });

  it('refuses shifting before calcium and calcium-only resolution shortcuts', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 77, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'hyperkalemia-response', payload: { action },
    });
    apply('review-hyperkalemia-pattern');
    apply('record-hyperkalemia-insulin-glucose');
    apply('reassess-hyperkalemia');
    apply('calcium-lowered-potassium');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.hyperkalemiaAssessment).toMatchObject({
      patternReviewedAtTick: expect.any(Number), calciumAtTick: null,
      postCalciumEcgAtTick: null, insulinGlucoseAtTick: null,
      removalAtTick: null, reassessedAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('hyperkalemia-calcium-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('hyperkalemia-response-refused-'))).toBe(true);
  });
});

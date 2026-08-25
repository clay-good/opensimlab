import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { VENTILATOR_DYSSYNCHRONY as SCENARIO } from '../../src/modules/critical-care/scenarios/ventilator-dyssynchrony';

describe('critical-care ventilator dyssynchrony', () => {
  it('validates a coherent fixed patient, graphics, mechanics, and protection pattern', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('8 breaths double trigger');
    expect(narrative).toContain('760 mL');
  });

  it('orders graphics, drivers, classification, correction, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 92, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'ventilator-dyssynchrony-response', payload: { action } });
    for (const action of ['review-dyssynchrony-patient-and-graphics', 'review-dyssynchrony-drivers',
      'classify-dyssynchrony-pattern', 'record-dyssynchrony-correction-intent',
      'reassess-dyssynchrony-response']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.ventilatorDyssynchronyAssessment).toMatchObject({
      graphicsAtTick: expect.any(Number), driversAtTick: expect.any(Number),
      classificationAtTick: expect.any(Number), correctionAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^dyssynchrony-graphics-reviewed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ observedBreaths: 20, doubleTriggers: 8, stackedVolumeMl: 760 });
    expect(completed.events.find((event) => /^dyssynchrony-response-reassessed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ reassessmentMinutes: 10, doubleTriggers: 1, maximumTidalVolumeMl: 450 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses reflex sedation, premature correction, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 93, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'ventilator-dyssynchrony-response', payload: { action } });
    apply('record-dyssynchrony-correction-intent'); apply('deepen-sedation');
    apply('review-dyssynchrony-patient-and-graphics'); apply('review-dyssynchrony-patient-and-graphics');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.ventilatorDyssynchronyAssessment)
      .toMatchObject({ graphicsAtTick: expect.any(Number), driversAtTick: null,
        classificationAtTick: null, correctionAtTick: null, reassessmentAtTick: null });
    expect(refused.events.some((event) => event.eventId.startsWith('dyssynchrony-graphics-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('ventilator-dyssynchrony-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('dyssynchrony-graphics-refused-'))).toBe(true);
  });
});

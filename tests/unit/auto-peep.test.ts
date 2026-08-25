import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { AUTO_PEEP as SCENARIO } from '../../src/modules/critical-care/scenarios/auto-peep';

describe('critical-care auto-PEEP', () => {
  it('validates a coherent fixed incomplete-exhalation and passive-hold pattern', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('flow remains below zero');
    expect(narrative).toContain('passive window');
  });

  it('orders flow review, measurement, classification, correction, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 94, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'auto-peep-response', payload: { action } });
    for (const action of ['review-auto-peep-patient-and-flow', 'measure-auto-peep',
      'classify-auto-peep-pattern', 'record-auto-peep-correction-intent',
      'reassess-auto-peep-response']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.autoPeepAssessment).toMatchObject({
      flowAtTick: expect.any(Number), measurementAtTick: expect.any(Number),
      classificationAtTick: expect.any(Number), correctionAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^auto-peep-measured-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ passiveWindow: true, setPeepCmH2O: 5, totalPeepCmH2O: 16,
        intrinsicPeepCmH2O: 11 });
    expect(completed.events.find((event) => /^auto-peep-response-reassessed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ reassessmentMinutes: 10, expiratoryFlowReachesZero: true,
        intrinsicPeepCmH2O: 4, mapMmHg: 72 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature correction, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 95, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'auto-peep-response', payload: { action } });
    apply('record-auto-peep-correction-intent'); apply('set-external-peep-11');
    apply('review-auto-peep-patient-and-flow'); apply('review-auto-peep-patient-and-flow');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.autoPeepAssessment)
      .toMatchObject({ flowAtTick: expect.any(Number), measurementAtTick: null,
        classificationAtTick: null, correctionAtTick: null, reassessmentAtTick: null });
    expect(refused.events.some((event) => event.eventId.startsWith('auto-peep-flow-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('auto-peep-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('auto-peep-flow-refused-'))).toBe(true);
  });
});

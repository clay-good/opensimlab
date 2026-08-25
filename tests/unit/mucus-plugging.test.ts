import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { MUCUS_PLUGGING as SCENARIO } from '../../src/modules/critical-care/scenarios/mucus-plugging';

describe('critical-care mucus plugging', () => {
  it('validates coherent retained-secretion indicators and a persistent focal concern', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('sawtooth expiratory-flow pattern');
    expect(narrative).toContain('Routine bronchoscopy');
  });

  it('orders support, indicators, suction intent, reassessment, and escalation', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 96, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'mucus-plugging-response', payload: { action } });
    for (const action of ['support-mucus-plugging-and-call-help', 'review-mucus-plugging-indicators',
      'record-indicated-airway-suction-intent', 'reassess-mucus-plugging-response',
      'escalate-persistent-mucus-plugging']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.mucusPluggingAssessment).toMatchObject({
      supportAtTick: expect.any(Number), indicatorsAtTick: expect.any(Number),
      suctionAtTick: expect.any(Number), reassessmentAtTick: expect.any(Number),
      escalationAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^mucus-suction-recorded-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ preoxygenation: true, asNeeded: true, shallowFirst: true, routineSaline: false });
    expect(completed.events.find((event) => /^mucus-response-reassessed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ secretionRemoved: true, peakPressureCmH2O: 30, persistentFocalFinding: true });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature clearance, routine bronchoscopy, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 97, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'mucus-plugging-response', payload: { action } });
    apply('record-indicated-airway-suction-intent'); apply('routine-bronchoscopy');
    apply('support-mucus-plugging-and-call-help'); apply('support-mucus-plugging-and-call-help');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.mucusPluggingAssessment)
      .toMatchObject({ supportAtTick: expect.any(Number), indicatorsAtTick: null,
        suctionAtTick: null, reassessmentAtTick: null, escalationAtTick: null });
    expect(refused.events.some((event) => event.eventId.startsWith('mucus-support-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('mucus-plugging-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('mucus-support-refused-'))).toBe(true);
  });
});

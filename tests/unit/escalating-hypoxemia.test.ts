import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { ESCALATING_HYPOXEMIA as SCENARIO } from '../../src/modules/critical-care/scenarios/escalating-hypoxemia';

describe('critical-care escalating hypoxemia', () => {
  it('validates a coherent credible decline with explicit diagnostic boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('SpO₂ falls over 6 minutes from 94% to 84%');
    expect(narrative).toContain('diagnosis');
  });

  it('orders signal, support, delivery path, bedside pattern, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 90, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'escalating-hypoxemia-response', payload: { action } });
    for (const action of ['validate-hypoxemia-signal', 'support-hypoxemia-and-call-help',
      'trace-hypoxemia-delivery-path', 'integrate-hypoxemia-bedside-pattern',
      'escalate-and-reassess-hypoxemia']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.escalatingHypoxemiaAssessment).toMatchObject({
      signalAtTick: expect.any(Number), supportAtTick: expect.any(Number),
      deliveryPathAtTick: expect.any(Number), bedsidePatternAtTick: expect.any(Number),
      escalationAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^hypoxemia-delivery-path-reviewed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ circuitConnected: true, tubeDepthCm: 23, suctionPathPasses: true });
    expect(completed.events.find((event) => /^hypoxemia-escalation-reassessed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ reassessmentMinutes: 15, spo2Percent: 92, pao2MmHg: 68 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature escalation, duplicates, and unknown shortcuts', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 91, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'escalating-hypoxemia-response', payload: { action } });
    apply('escalate-and-reassess-hypoxemia'); apply('assume-mucus-plug');
    apply('validate-hypoxemia-signal'); apply('validate-hypoxemia-signal');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.escalatingHypoxemiaAssessment)
      .toMatchObject({ signalAtTick: expect.any(Number), supportAtTick: null,
        deliveryPathAtTick: null, bedsidePatternAtTick: null, escalationAtTick: null });
    expect(refused.events.some((event) => event.eventId.startsWith('hypoxemia-signal-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('escalating-hypoxemia-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('hypoxemia-signal-refused-'))).toBe(true);
  });
});

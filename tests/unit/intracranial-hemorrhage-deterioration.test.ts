import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { INTRACRANIAL_HEMORRHAGE_DETERIORATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/intracranial-hemorrhage-deterioration';

describe('emergency intracranial hemorrhage deterioration', () => {
  it('validates fixed deterioration, hemorrhage, coagulopathy, and hydrocephalus findings', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('eye opening and coherent speech have decreased');
    expect(narrative).toContain('28 mL right thalamic intracerebral hemorrhage');
    expect(narrative).toContain('INR is 3.2');
    expect(SCENARIO.metadata.limitations).toHaveLength(3);
  });

  it('requires ordered reversal, pressure control, and neurocritical escalation', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 72, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'intracranial-hemorrhage-response', payload: { action },
    });
    apply('review-ich-deterioration');
    apply('activate-ich-pathway');
    apply('review-ich-findings-and-coagulopathy');
    apply('record-warfarin-reversal-intent');
    apply('record-smooth-ich-pressure-control');
    apply('escalate-ich-neurocritical-care');
    const completed = subject.step();
    expect(completed.equipment.resuscitation.intracranialHemorrhageAssessment).toMatchObject({
      deteriorationReviewedAtTick: expect.any(Number), pathwayActivatedAtTick: expect.any(Number),
      findingsReviewedAtTick: expect.any(Number), reversalAtTick: expect.any(Number),
      pressureControlAtTick: expect.any(Number), escalatedAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^ich-reversal-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ intentOnly: true, anticoagulant: 'warfarin',
        reversal: '4f-pcc-plus-iv-vitamin-k', authoredInr: 3.2 });
    expect(completed.events.find((event) => event.eventId.startsWith('ich-pressure-control-'))?.data)
      .toMatchObject({ targetSystolicMmHg: 140, lowerBoundSystolicMmHg: 130,
        upperBoundSystolicMmHg: 150 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses out-of-order and unsupported shortcuts without inventing treatment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 73, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'intracranial-hemorrhage-response', payload: { action },
    });
    apply('record-warfarin-reversal-intent');
    apply('record-smooth-ich-pressure-control');
    apply('escalate-ich-neurocritical-care');
    apply('give-fixed-pcc-dose');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.intracranialHemorrhageAssessment).toMatchObject({
      deteriorationReviewedAtTick: null, reversalAtTick: null,
      pressureControlAtTick: null, escalatedAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('ich-order-refused-')))
      .toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('ich-response-refused-')))
      .toBe(true);
    const history = [{ tick: refused.tick, state: refused.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], refused.events)
      .map((finding) => finding.outcome)).toEqual([
      'not-met', 'not-met', 'not-met', 'not-met', 'not-met',
    ]);
  });
});

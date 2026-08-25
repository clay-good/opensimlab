import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { POST_INTUBATION_HYPOTENSION as SCENARIO } from '../../src/modules/critical-care/scenarios/post-intubation-hypotension';

describe('critical-care post-intubation hypotension', () => {
  it('validates a coherent mixed pattern without a universal fluid-versus-vasopressor claim', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('pulsatile arterial waveform');
    expect(narrative).toContain('passive-leg-raise proxy');
    expect(narrative).toContain('not a universal fluid-versus-vasopressor answer');
  });

  it('orders validation, danger review, mechanism, support, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 102, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'post-intubation-hypotension-response', payload: { action } });
    for (const action of ['validate-post-intubation-pressure-and-call-help',
      'review-post-intubation-danger-pattern', 'classify-post-intubation-hemodynamics',
      'record-post-intubation-support-intent', 'reassess-post-intubation-hypotension']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.postIntubationHypotensionAssessment).toMatchObject({
      pressureAtTick: expect.any(Number), dangerAtTick: expect.any(Number),
      mechanismAtTick: expect.any(Number), supportAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^post-intubation-mechanism-classified-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ strokeVolumeIncreasePercent: 19, fluidResponsiveProxy: true });
    expect(completed.events.find((event) => /^post-intubation-support-recorded-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ norepinephrine: true, initialMapTargetMmHg: 65,
        balancedCrystalloidChallengeMl: 250, concurrentSupport: true });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses blind fluid, premature support, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 103, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'post-intubation-hypotension-response', payload: { action } });
    apply('record-post-intubation-support-intent'); apply('give-two-liters-blindly');
    apply('validate-post-intubation-pressure-and-call-help');
    apply('validate-post-intubation-pressure-and-call-help');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.postIntubationHypotensionAssessment)
      .toMatchObject({ pressureAtTick: expect.any(Number), dangerAtTick: null,
        mechanismAtTick: null, supportAtTick: null, reassessmentAtTick: null });
    expect(refused.events.some((event) => event.eventId.startsWith('post-intubation-pressure-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('post-intubation-hypotension-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('post-intubation-pressure-refused-'))).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { REGULAR_NARROW_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/cardiology/scenarios/regular-narrow-complex-tachycardia';
import { UNSTABLE_NARROW_COMPLEX_TACHYCARDIA as UNSTABLE } from '../../src/modules/emergency-medicine/scenarios/unstable-narrow-complex-tachycardia';

describe('cardiology regular narrow-complex tachycardia', () => {
  it('validates a stable monitored contract distinct from unstable cardioversion', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('BP is 124/78 mmHg');
    expect(narrative).toContain('does not establish one mechanism');
    expect(narrative).not.toContain('record prompt synchronized-cardioversion intent');
    expect(SCENARIO.metadata.objectives.map((objective) => objective.statement))
      .not.toEqual(UNSTABLE.metadata.objectives.map((objective) => objective.statement));
    expect(SCENARIO.debrief.rubric.map((item) => item.question))
      .not.toEqual(UNSTABLE.debrief.rubric.map((item) => item.question));
  });

  it('requires elapsed reviews before nonconversion and final conversion', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 109, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 176, respiratoryRateBpm: 18,
      spo2Percent: 98, systolicMmHg: 124, diastolicMmHg: 78, meanArterialMmHg: 93 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'stable-narrow-tachycardia-response', payload: { action } });
    apply('reconcile-stable-regular-narrow-tachycardia');
    apply('review-stable-regular-narrow-context');
    apply('record-stable-regular-narrow-vagal-intent');
    apply('review-stable-regular-narrow-vagal-response');
    const vagalWait = subject.step();
    expect(vagalWait.equipment.resuscitation.stableNarrowTachycardiaAssessment?.vagalResponseAtTick).toBeNull();
    apply('review-stable-regular-narrow-vagal-response');
    apply('record-stable-regular-narrow-adenosine-intent');
    apply('reassess-stable-regular-narrow-trajectory');
    const adenosineWait = subject.step();
    expect(adenosineWait.equipment.resuscitation.stableNarrowTachycardiaAssessment)
      .toMatchObject({ vagalResponseAtTick: expect.any(Number), adenosineAtTick: expect.any(Number),
        reassessmentAtTick: null, mechanismProven: false, treatmentDelivered: false });
    apply('reassess-stable-regular-narrow-trajectory');
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 88, systolicMmHg: 122,
      diastolicMmHg: 76, meanArterialMmHg: 91 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [],
      [...onset.events, ...vagalWait.events, ...adenosineWait.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses hostile, premature, and opposite-scenario actions in both directions', () => {
    const stable = new AnesthesiaEngine({ scenario: SCENARIO, seed: 110, practiceRegion: 'US' });
    stable.step();
    stable.apply({ tick: stable.tick, type: 'stable-narrow-tachycardia-response',
      payload: { action: 'give-adenosine-6-mg' } });
    stable.apply({ tick: stable.tick, type: 'unstable-narrow-tachycardia-response',
      payload: { action: 'record-synchronized-cardioversion-intent' } });
    const stableState = stable.step();
    expect(stableState.equipment.resuscitation.stableNarrowTachycardiaAssessment?.stabilityAtTick).toBeNull();
    expect(stableState.equipment.resuscitation.unstableNarrowTachycardiaAssessment?.cardiovertedAtTick).toBeNull();
    expect(stableState.events.filter((event) => event.eventId.includes('refused')).length).toBeGreaterThanOrEqual(2);

    const unstable = new AnesthesiaEngine({ scenario: UNSTABLE, seed: 111, practiceRegion: 'US' });
    unstable.step();
    unstable.apply({ tick: unstable.tick, type: 'stable-narrow-tachycardia-response',
      payload: { action: 'reconcile-stable-regular-narrow-tachycardia' } });
    const unstableState = unstable.step();
    expect(unstableState.equipment.resuscitation.stableNarrowTachycardiaAssessment).toBeUndefined();
    expect(unstableState.events.some((event) =>
      event.eventId.startsWith('stable-narrow-tachycardia-response-refused-'))).toBe(true);
  });
});

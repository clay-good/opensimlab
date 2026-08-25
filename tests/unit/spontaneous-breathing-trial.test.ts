import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { SPONTANEOUS_BREATHING_TRIAL as SCENARIO } from '../../src/modules/critical-care/scenarios/spontaneous-breathing-trial';

describe('critical-care spontaneous-breathing trial', () => {
  it('validates readiness without RSBI and a coherent failed-trial trajectory', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('No rapid shallow breathing index');
    expect(narrative).toContain('without increasing FiO₂');
    expect(narrative).toContain('SBT success alone would not prove extubation readiness');
  });

  it('orders readiness, trial, failure, support restoration, and next-step planning', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 100, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'spontaneous-breathing-trial-response', payload: { action } });
    for (const action of ['review-sbt-readiness', 'start-bounded-sbt', 'recognize-sbt-failure',
      'stop-failed-sbt-and-recover', 'plan-after-failed-sbt']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.spontaneousBreathingTrialAssessment).toMatchObject({
      readinessAtTick: expect.any(Number), startedAtTick: expect.any(Number),
      failureAtTick: expect.any(Number), recoveryAtTick: expect.any(Number),
      planAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^sbt-started-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ pressureSupportCmH2O: 5, fio2: 0.35, fio2Increased: false });
    expect(completed.events.find((event) => /^sbt-plan-recorded-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ repeatStandardizedAssessment: true, extubation: false,
        sbtSuccessEqualsExtubationReadiness: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature extubation, FiO2 masking, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 101, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'spontaneous-breathing-trial-response', payload: { action } });
    apply('start-bounded-sbt'); apply('increase-fio2-and-push-through'); apply('extubate');
    apply('review-sbt-readiness'); apply('review-sbt-readiness');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.spontaneousBreathingTrialAssessment)
      .toMatchObject({ readinessAtTick: expect.any(Number), startedAtTick: null,
        failureAtTick: null, recoveryAtTick: null, planAtTick: null });
    expect(refused.events.some((event) => event.eventId.startsWith('sbt-readiness-order-refused-'))).toBe(true);
    expect(refused.events.filter((event) => event.eventId.startsWith('sbt-response-refused-'))).toHaveLength(2);
    expect(refused.events.some((event) => event.eventId.startsWith('sbt-readiness-refused-'))).toBe(true);
  });
});

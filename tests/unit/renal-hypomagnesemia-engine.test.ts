/**
 * The lesson's whole point is that the response does not appear where the learner looks.
 *
 * A magnesium inside the printed reference range is what sends a clinician away from the
 * diagnosis, and a magnesium that barely moves after repletion is what makes them think the
 * repletion failed. Both are authored deliberately, so these tests assert the numbers as well
 * as the flow: if the magnesium ever moves enough to be a satisfying signal, the lesson has
 * quietly become a different one.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_HYPOMAGNESEMIA_REFRACTORY_POTASSIUM as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypomagnesemia-refractory-potassium-and-the-normal-number';
import { RENAL_HYPOMAGNESEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypomagnesemia-fixtures';
import { RENAL_HYPOMAGNESEMIA_REPLETION_TICKS as REPLETION, RENAL_HYPOMAGNESEMIA_DELAY_TICKS as DELAY,
  RENAL_HYPOMAGNESEMIA_TAKEOVER_TICKS as TAKEOVER, supportsRenalHypomagnesemia,
  type RenalHypomagnesemiaAction } from '../../src/modules/renal-electrolyte/hypomagnesemia';
import { RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL as HYPERMAGNESEMIA } from '../../src/modules/renal-electrolyte/scenarios/hypermagnesemia-antagonism-and-removal';

type Choices = readonly (readonly [number, RenalHypomagnesemiaAction])[];
const choice = (tick: number, action: RenalHypomagnesemiaAction): LearnerAction =>
  ({ tick, type: 'renal-hypomagnesemia-response', payload: { action } });

function run(actions: Choices, until: number) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const events: EngineEvent[] = [];
  let next = 0;
  let last = engine.step();
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    last = engine.step();
    events.push(...last.events);
  }
  expect(next, 'every fixture action was dispatched').toBe(actions.length);
  return { events, snapshot: last.equipment.resuscitation.renalHypomagnesemia! };
}
const ids = (events: readonly EngineEvent[]) => events.map((event) => event.eventId);
const saw = (events: readonly EngineEvent[], fragment: string) =>
  ids(events).some((id) => id.startsWith(`renal-hypomagnesemia-${fragment}-`));

describe('Requirement: the renal hypomagnesemia lesson runs on its own engine', () => {
  it('claims this scenario and no other', () => {
    expect(supportsRenalHypomagnesemia(SCENARIO)).toBe(true);
    expect(supportsRenalHypomagnesemia(HYPERMAGNESEMIA)).toBe(false);
    expect(supportsRenalHypomagnesemia({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } })).toBe(false);
    expect(supportsRenalHypomagnesemia({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) })).toBe(false);
  });

  it('refuses every action that is not one of this lesson’s declared choices', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 1, type: 'fluid', payload: { volumeMl: 500 } } as unknown as LearnerAction);
    expect(saw(engine.step().events, 'generic-action-refused')).toBe(true);
    engine.apply(choice(2, 'not-a-choice' as RenalHypomagnesemiaAction));
    expect(saw(engine.step().events, 'action-refused')).toBe(true);
  });

  it('puts the response in the potassium and the calcium, and barely moves the magnesium', () => {
    const { snapshot } = run([[0, 'monitor'], [1, 'review-number'], [2, 'replace-magnesium'], [3, 'stop-exposure'],
      [4, 'call-support'], [5, 'review-context'], [REPLETION + 10, 'reassess']], REPLETION + 20);
    const observation = snapshot.observation!;
    expect(snapshot.repletionResponseObserved).toBe(true);
    expect(observation.potassiumMmolL).toBeGreaterThan(2.7);
    expect(observation.ionizedCalciumMmolL).toBeGreaterThan(1.02);
    expect(observation.qtcMs).toBeLessThan(508);
    expect(observation.crampingPresent).toBe(false);
    // The whole lesson: a learner watching this number sees almost nothing happen.
    expect(observation.magnesiumMmolL).toBeCloseTo(0.81, 2);
    expect(Math.abs(observation.magnesiumMmolL - 0.78)).toBeLessThan(0.05);
  });

  it('leaves the magnesium inside the reference range before any treatment', () => {
    const { snapshot } = run([[0, 'check-magnesium']], 10);
    expect(snapshot.magnesiumObservation!.magnesiumMmolL).toBe(0.78);
    expect(snapshot.observation, 'a partial check does not build a full assessment').toBeNull();
  });

  it('keeps a partial check from refreshing the other results', () => {
    const { snapshot } = run([[0, 'check-potassium']], 10);
    expect(snapshot.potassiumObservation!.potassiumMmolL).toBe(2.7);
    expect(snapshot.magnesiumObservation).toBeNull();
  });

  it('refuses a third potassium replacement alone, and the in-range-excludes claim, with reasons', () => {
    const { events, snapshot } = run([[0, 'potassium-alone'], [1, 'normal-number-excludes']], 5);
    expect(saw(events, 'potassium-alone-refused')).toBe(true);
    expect(saw(events, 'normal-number-refused')).toBe(true);
    expect(snapshot.potassiumAloneAttempted).toBe(true);
    expect(snapshot.normalNumberClaimAttempted).toBe(true);
    const refusal = events.find((event) => event.eventId.startsWith('renal-hypomagnesemia-potassium-alone-refused-'))!;
    // The mechanism is taught, and immediately bounded: the source says so itself.
    expect(refusal.message).toContain('does not make magnesium the only possible reason');
  });

  it('reaches the authored untreated contrast and does not predict an outcome from it', () => {
    const { events, snapshot } = run([[0, 'monitor'], [DELAY + 5, 'reassess']], DELAY + 10);
    expect(saw(events, 'untreated-contrast')).toBe(true);
    expect(snapshot.untreatedContrastObserved).toBe(true);
    expect(snapshot.observation!.qtcMs).toBeGreaterThan(508);
    const contrast = events.find((event) => event.eventId.startsWith('renal-hypomagnesemia-untreated-contrast-'))!;
    expect(contrast.message).toContain('not a safe waiting period');
  });

  it('refuses handoff until the response has actually been observed', () => {
    const short: Choices = [[0, 'monitor'], [1, 'review-number'], [2, 'replace-magnesium'], [3, 'stop-exposure'],
      [4, 'call-support'], [5, 'review-context'], [6, 'handoff']];
    const { events, snapshot } = run(short, 20);
    expect(saw(events, 'handoff-refused')).toBe(true);
    expect(snapshot.ended).toBeNull();
    const refusal = events.find((event) => event.eventId.startsWith('renal-hypomagnesemia-handoff-refused-'))!;
    expect(refusal.message).toContain('A normal magnesium, every earlier panel');
  });

  it('accepts handoff on the expert fixture and hands over an unresolved problem', () => {
    const { events, snapshot } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    expect(saw(events, 'handoff')).toBe(true);
    expect(snapshot.ended).toBe('handoff');
    expect(snapshot.durableRecoveryProven).toBe(false);
    const handoff = events.find((event) => /^renal-hypomagnesemia-handoff-\d+$/.test(event.eventId))!;
    expect(handoff.message).toContain('the cause is not established');
  });

  it('bounds a run in which nothing is arranged', () => {
    const { events, snapshot } = run([], TAKEOVER + 1);
    expect(saw(events, 'instructor-takeover')).toBe(true);
    expect(snapshot.ended).toBe('instructor-takeover');
  });

  it('lets the recovery fixture reach handoff after two refused choices', () => {
    const { snapshot } = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 5);
    expect(snapshot.ended).toBe('handoff');
    expect(snapshot.potassiumAloneAttempted).toBe(true);
    expect(snapshot.normalNumberClaimAttempted).toBe(true);
  });

  it('leaves the common-error fixture unfinished', () => {
    const { snapshot } = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 5);
    expect(snapshot.ended).toBeNull();
    expect(snapshot.repletionAtTick).toBeNull();
  });

  it('meets every objective on the expert path', () => {
    const { events } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    const outcomes = objectiveFindings(SCENARIO, [], 0, 0, [], events);
    expect(outcomes).toHaveLength(SCENARIO.metadata.objectives.length);
  });
});

/**
 * A lesson about a surrogate must not reward the learner with a better surrogate.
 *
 * The phosphate is fixed, because there is no treatment in this lesson for it to respond to,
 * and a value that improved when the learner reasoned well would teach that reasoning is how
 * surrogates move. What the review changes is the record. Both halves are asserted, along with
 * the shape of the two refusals: this lab argues against treating toward a number, which is
 * exactly the shape that could be misread as arguing against the treatment.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_PHOSPHATE_TARGET as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/phosphate-target-a-surrogate-that-moved-the-wrong-way';
import { RENAL_PHOSPHATE_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/phosphate-target-fixtures';
import { RENAL_PHOSPHATE_RECORDS_TICKS as RECORDS, RENAL_PHOSPHATE_DELAY_TICKS as DELAY,
  RENAL_PHOSPHATE_TAKEOVER_TICKS as TAKEOVER, supportsRenalPhosphateTarget,
  type RenalPhosphateAction } from '../../src/modules/renal-electrolyte/phosphate-target';
import { RENAL_ESTIMATED_FILTRATION as ESTIMATE } from '../../src/modules/renal-electrolyte/scenarios/estimated-filtration-a-number-she-was-never-measured-by';

type Choices = readonly (readonly [number, RenalPhosphateAction])[];
const choice = (tick: number, action: RenalPhosphateAction): LearnerAction =>
  ({ tick, type: 'renal-phosphate-target-response', payload: { action } });

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
  return { events, snapshot: last.equipment.resuscitation.renalPhosphateTarget! };
}
const saw = (events: readonly EngineEvent[], fragment: string) =>
  events.some((event) => event.eventId.startsWith(`renal-phosphate-${fragment}-`));
const REVIEW: Choices = [[0, 'review-surrogate'], [1, 'review-trial'], [2, 'review-intake'],
  [3, 'own-decision'], [4, 'call-support'], [5, 'monitor']];

describe('Requirement: the phosphate-target lesson runs on its own engine', () => {
  it('claims this scenario and no other', () => {
    expect(supportsRenalPhosphateTarget(SCENARIO)).toBe(true);
    expect(supportsRenalPhosphateTarget(ESTIMATE)).toBe(false);
    expect(supportsRenalPhosphateTarget({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } })).toBe(false);
  });

  it('refuses every action that is not one of this lesson’s declared choices', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 1, type: 'fluid', payload: { volumeMl: 250 } } as unknown as LearnerAction);
    expect(saw(engine.step().events, 'generic-action-refused')).toBe(true);
    engine.apply(choice(2, 'start-sevelamer' as RenalPhosphateAction));
    expect(saw(engine.step().events, 'action-refused')).toBe(true);
  });

  it('never moves the phosphate, however well the learner reviews', () => {
    const reviewed = run([...REVIEW, [RECORDS + 10, 'reassess']], RECORDS + 20);
    const ignored = run([[10, 'reassess']], 20);
    expect(reviewed.snapshot.observation!.phosphateMmolL).toBeCloseTo(1.62, 2);
    expect(ignored.snapshot.observation!.phosphateMmolL).toBeCloseTo(1.62, 2);
  });

  it('changes the record instead, once the intake has been reviewed', () => {
    const before = run([[0, 'review-intake'], [1, 'reassess']], 10);
    expect(before.snapshot.recordsOpened).toBe(false);
    expect(before.snapshot.observation!.restrictionsApplied).toBe(0);
    const after = run([...REVIEW, [RECORDS + 10, 'reassess']], RECORDS + 20);
    expect(after.snapshot.recordsOpened).toBe(true);
    expect(after.snapshot.observation!.restrictionsApplied).toBe(2);
  });

  it('reports the weight and albumin as the findings that moved', () => {
    const { snapshot } = run([[0, 'check-nutrition']], 10);
    expect(snapshot.nutritionObservation).toMatchObject({ weightKg: 68, albuminGL: 31 });
    expect(snapshot.observation, 'a partial check builds no full assessment').toBeNull();
  });

  it('refuses treating toward the range without deciding against the binder', () => {
    const { events, snapshot } = run([[0, 'treat-the-number']], 5);
    expect(saw(events, 'treat-the-number-refused')).toBe(true);
    expect(snapshot.treatTheNumberAttempted).toBe(true);
    const refusal = events.find((event) =>
      event.eventId.startsWith('renal-phosphate-treat-the-number-refused-'))!;
    expect(refusal.message).toContain('not a claim that a binder would harm him');
    expect(refusal.message).toContain('does not establish that his phosphate is safe');
    expect(refusal.message).toContain('it declines to make the number the reason');
  });

  it('refuses a third restriction without diagnosing malnutrition', () => {
    const { events, snapshot } = run([[0, 'restrict-further']], 5);
    expect(saw(events, 'restrict-further-refused')).toBe(true);
    expect(snapshot.restrictFurtherAttempted).toBe(true);
    const refusal = events.find((event) =>
      event.eventId.startsWith('renal-phosphate-restrict-further-refused-'))!;
    expect(refusal.message).toContain('not a diagnosis of malnutrition');
    expect(refusal.message).toContain('not proof the restrictions caused it');
  });

  it('quotes the trial with the calcification finding attached', () => {
    const { events } = run([[0, 'review-trial']], 5);
    const review = events.find((event) => event.eventId.startsWith('renal-phosphate-trial-review-'))!;
    expect(review.message).toContain('calcification increased significantly against placebo');
    expect(review.message).toContain('uncertainty in both directions');
  });

  it('reaches the authored unexamined contrast', () => {
    const { events, snapshot } = run([[0, 'check-phosphate']], DELAY + 5);
    expect(saw(events, 'unexamined-contrast')).toBe(true);
    expect(snapshot.unexaminedContrastObserved).toBe(true);
  });

  it('refuses handoff until the previous letters are open', () => {
    const { events, snapshot } = run([...REVIEW, [6, 'handoff']], 20);
    expect(saw(events, 'handoff-refused')).toBe(true);
    expect(snapshot.ended).toBeNull();
    const refusal = events.find((event) => event.eventId.startsWith('renal-phosphate-handoff-refused-'))!;
    expect(refusal.message).toContain('is not a handoff gate and is not available');
  });

  it('hands over the context the number does not carry', () => {
    const { events, snapshot } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    expect(snapshot.ended).toBe('handoff');
    const handoff = events.find((event) => /^renal-phosphate-handoff-\d+$/.test(event.eventId))!;
    expect(handoff.message).toContain('the context the number does not carry');
    expect(handoff.message).toContain('no cause established');
  });

  it('bounds a run in which the target is never questioned', () => {
    const { events, snapshot } = run([], TAKEOVER + 1);
    expect(saw(events, 'instructor-takeover')).toBe(true);
    expect(snapshot.ended).toBe('instructor-takeover');
  });

  it('lets the recovery fixture reach handoff after two refused choices', () => {
    const { snapshot } = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 5);
    expect(snapshot.ended).toBe('handoff');
    expect(snapshot.treatTheNumberAttempted).toBe(true);
    expect(snapshot.restrictFurtherAttempted).toBe(true);
  });

  it('leaves the common-error fixture unfinished with the target unquestioned', () => {
    const { snapshot } = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 5);
    expect(snapshot.ended).toBeNull();
    expect(snapshot.surrogateReviewedAtTick).toBeNull();
  });

  it('meets every objective on the expert path', () => {
    const { events } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], events)).toHaveLength(SCENARIO.metadata.objectives.length);
  });
});

/**
 * A lesson about attribution must not reward good reasoning with a better number.
 *
 * If the creatinine fell when the learner reasoned well, the lesson would be teaching that
 * careful reasoning is how numbers improve, which is the confusion it exists to break. So the
 * trend is authored, monotonic, and indifferent to every choice; what the search changes is the
 * record. These tests assert that directly, because a later "improvement" would look like a
 * kindness and would quietly invert the teaching.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_CONTRAST_ATTRIBUTION_LABEL as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/contrast-attribution-a-label-that-stopped-the-search';
import { RENAL_CONTRAST_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/contrast-attribution-fixtures';
import { RENAL_CONTRAST_RECORD_TICKS as RECORD, RENAL_CONTRAST_DELAY_TICKS as DELAY,
  RENAL_CONTRAST_TAKEOVER_TICKS as TAKEOVER, supportsRenalContrastAttribution,
  type RenalContrastAction } from '../../src/modules/renal-electrolyte/contrast-attribution';
import { RENAL_HYPOMAGNESEMIA_REFRACTORY_POTASSIUM as HYPOMAGNESEMIA } from '../../src/modules/renal-electrolyte/scenarios/hypomagnesemia-refractory-potassium-and-the-normal-number';

type Choices = readonly (readonly [number, RenalContrastAction])[];
const choice = (tick: number, action: RenalContrastAction): LearnerAction =>
  ({ tick, type: 'renal-contrast-attribution-response', payload: { action } });

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
  return { events, snapshot: last.equipment.resuscitation.renalContrastAttribution! };
}
const saw = (events: readonly EngineEvent[], fragment: string) =>
  events.some((event) => event.eventId.startsWith(`renal-contrast-${fragment}-`));
const SEARCH: Choices = [[0, 'review-label'], [1, 'review-alternatives'], [2, 'withdraw-exposures'],
  [3, 'review-evidence'], [4, 'call-support'], [5, 'monitor']];

describe('Requirement: the contrast-attribution lesson runs on its own engine', () => {
  it('claims this scenario and no other', () => {
    expect(supportsRenalContrastAttribution(SCENARIO)).toBe(true);
    expect(supportsRenalContrastAttribution(HYPOMAGNESEMIA)).toBe(false);
    expect(supportsRenalContrastAttribution({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } })).toBe(false);
  });

  it('refuses every action that is not one of this lesson’s declared choices', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 1, type: 'fluid', payload: { volumeMl: 500 } } as unknown as LearnerAction);
    expect(saw(engine.step().events, 'generic-action-refused')).toBe(true);
    engine.apply(choice(2, 'give-contrast' as RenalContrastAction));
    expect(saw(engine.step().events, 'action-refused')).toBe(true);
  });

  it('never lets the creatinine fall, whatever the learner does', () => {
    const doingEverything = run([...SEARCH, [RECORD + 10, 'reassess']], RECORD + 20);
    const doingNothing = run([[0, 'check-creatinine']], 10);
    expect(doingNothing.snapshot.creatinineObservation!.creatinineUmolL).toBe(168);
    // Higher after the search, not lower: the search found more injury, not less.
    expect(doingEverything.snapshot.observation!.creatinineUmolL).toBeGreaterThan(168);
  });

  it('changes the record rather than the patient', () => {
    const { snapshot } = run([...SEARCH, [RECORD + 10, 'reassess']], RECORD + 20);
    expect(snapshot.recordOpened).toBe(true);
    // The ward summary said two episodes. The chart that was there all along says four.
    expect(snapshot.observation!.episodes).toBe(4);
    expect(snapshot.observation!.lowestSystolicMmHg).toBe(78);
    expect(snapshot.observation!.nephrotoxinsRunning).toBe(0);
  });

  it('shows only the summary until the alternatives have been reviewed', () => {
    const { snapshot } = run([[0, 'check-perfusion']], 10);
    expect(snapshot.perfusionObservation).toMatchObject({ episodes: 2, lowestSystolicMmHg: 88 });
    expect(snapshot.recordOpened).toBe(false);
  });

  it('counts the exposures that are still running until they are withdrawn', () => {
    const before = run([[0, 'review-label'], [1, 'reassess']], 10);
    expect(before.snapshot.observation!.nephrotoxinsRunning).toBe(2);
    const after = run([[0, 'review-label'], [1, 'withdraw-exposures'], [2, 'reassess']], 10);
    expect(after.snapshot.observation!.nephrotoxinsRunning).toBe(0);
  });

  it('refuses to attribute the injury, and refuses to close the search, with reasons', () => {
    const { events, snapshot } = run([[0, 'attribute-to-contrast'], [1, 'stop-looking']], 5);
    expect(saw(events, 'attribution-refused')).toBe(true);
    expect(saw(events, 'stop-looking-refused')).toBe(true);
    expect(snapshot.attributionClaimAttempted).toBe(true);
    expect(snapshot.stopLookingAttempted).toBe(true);
    const refusal = events.find((event) => event.eventId.startsWith('renal-contrast-attribution-refused-'))!;
    // Refusing an attribution must not become the opposite attribution.
    expect(refusal.message).toContain('not a claim that contrast never injures a kidney');
    expect(refusal.message).toContain('does not name a different cause');
  });

  it('reaches the authored unexamined contrast without predicting anything from it', () => {
    const { events, snapshot } = run([[0, 'review-label']], DELAY + 5);
    expect(saw(events, 'unexamined-contrast')).toBe(true);
    expect(snapshot.unexaminedContrastObserved).toBe(true);
    const contrast = events.find((event) => event.eventId.startsWith('renal-contrast-unexamined-contrast-'))!;
    expect(contrast.message).toContain('not a safe waiting period');
  });

  it('refuses handoff until the charts are open and everything is recorded', () => {
    const { events, snapshot } = run([...SEARCH, [6, 'handoff']], 20);
    expect(saw(events, 'handoff-refused')).toBe(true);
    expect(snapshot.ended).toBeNull();
    const refusal = events.find((event) => event.eventId.startsWith('renal-contrast-handoff-refused-'))!;
    expect(refusal.message).toContain('Naming a cause before leaving');
  });

  it('hands over an open question on the expert fixture', () => {
    const { events, snapshot } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    expect(snapshot.ended).toBe('handoff');
    const handoff = events.find((event) => /^renal-contrast-handoff-\d+$/.test(event.eventId))!;
    expect(handoff.message).toContain('the cause is unresolved and recorded as unresolved');
    expect(handoff.message).toContain('an attribution rather than a finding');
  });

  it('bounds a run in which the label is never read', () => {
    const { events, snapshot } = run([], TAKEOVER + 1);
    expect(saw(events, 'instructor-takeover')).toBe(true);
    expect(snapshot.ended).toBe('instructor-takeover');
  });

  it('lets the recovery fixture reach handoff after two refused choices', () => {
    const { snapshot } = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 5);
    expect(snapshot.ended).toBe('handoff');
    expect(snapshot.attributionClaimAttempted).toBe(true);
    expect(snapshot.stopLookingAttempted).toBe(true);
  });

  it('leaves the common-error fixture unfinished with the exposures still running', () => {
    const { snapshot } = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 5);
    expect(snapshot.ended).toBeNull();
    expect(snapshot.exposuresWithdrawnAtTick).toBeNull();
  });

  it('meets every objective on the expert path', () => {
    const { events } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], events)).toHaveLength(SCENARIO.metadata.objectives.length);
  });
});

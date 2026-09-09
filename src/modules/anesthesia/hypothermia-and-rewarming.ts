import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the hypothermia lesson.
 *
 * The thirty-fourth anaesthesia lab. It has two warming objectives and only one
 * of them warms anybody: surface warming carries the entire trajectory, and the
 * bulk-fluid intent moves the modelled temperature by exactly nothing.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const HYPOTHERMIA_AND_REWARMING_OBJECTIVES = [
  'recognize-perioperative-hypothermia',
  'start-active-surface-warming',
  'warm-bulk-perioperative-fluids',
  'reassess-perioperative-rewarming',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted cooling course, because every bounded thermal response
 * is refused unless a perioperative temperature target is active.
 */
export function supportsHypothermiaAndRewarming(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hypothermia-and-rewarming'
    && scenario.timeline.some((event) => event.type === 'perioperative-hypothermia')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HYPOTHERMIA_AND_REWARMING_OBJECTIVES.join('|');
}

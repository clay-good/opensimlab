import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the post-extubation-obstruction
 * lesson.
 *
 * The twenty-ninth anaesthesia lab. Its second objective asks for two things at
 * once, and the model is unusually strict about that: either half alone leaves
 * the airway exactly as obstructed as doing nothing.
 */

/** The three declared objectives, in order, as the scenario states them. */
export const POST_EXTUBATION_OBSTRUCTION_OBJECTIVES = [
  'recognize-post-extubation-obstruction',
  'support-post-extubation-airway',
  'confirm-post-extubation-recovery',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted obstruction event, because both timed objectives measure
 * from it and it fires at tick 100 rather than at the start.
 */
export function supportsPostExtubationObstruction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'post-extubation-obstruction'
    && scenario.timeline.some((event) => event.type === 'upper-airway-obstruction')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === POST_EXTUBATION_OBSTRUCTION_OBJECTIVES.join('|');
}

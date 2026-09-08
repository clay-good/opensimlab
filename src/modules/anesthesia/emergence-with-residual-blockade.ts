import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the emergence-with-residual-
 * blockade lesson.
 *
 * The sixteenth anaesthesia lab, and the third in the block thread: rapid
 * sequence gives one, quantitative reversal takes one back, and this one is
 * about the patient in whom both of those appear to have worked. Four twitches,
 * no fade a hand can feel, and a ratio of 0.72.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const EMERGENCE_RESIDUAL_BLOCKADE_OBJECTIVES = [
  'review-emergence-quantitative-monitor',
  'recognize-emergence-residual-blockade',
  'defer-extubation-during-residual-blockade',
  'separate-recovery-from-extubation-readiness',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the narrative target, because that is what the engine itself checks
 * before offering any of the five bounded choices — without it every action in
 * this lesson is refused as belonging to another scenario.
 */
export function supportsEmergenceWithResidualBlockade(scenario: Scenario): boolean {
  return scenario.metadata.id === 'emergence-with-residual-blockade'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'emergence-residual-blockade')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === EMERGENCE_RESIDUAL_BLOCKADE_OBJECTIVES.join('|');
}

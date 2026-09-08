import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the awareness-under-paralysis
 * lesson.
 *
 * The fifth anaesthesia lab, and the one the previous lesson hands off to.
 * Rapid-sequence induction raises this exact harm — a patient paralysed and
 * light — as an alarm its own objectives deliberately do not score. This lesson
 * is where it is scored, and where the failure is silent rather than hurried:
 * the pump goes on showing its commanded rate, and no ordinary vital sign moves.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const AWARENESS_UNDER_PARALYSIS_OBJECTIVES = [
  'hypnosis-before-paralysis',
  'inspect-the-tiva-line',
  'restore-hypnotic-delivery',
  'recognize-paralysis-risk',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * The lesson is named by the three things without which none of it can be
 * scored: the modelled line failure, the depth index, and the quantitative
 * block. Two of those four objectives are read off the pair of monitors
 * together, which is the whole argument the lesson makes.
 */
export function supportsAwarenessUnderParalysis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'awareness-under-paralysis'
    && scenario.equipment.monitoring.includes('depth-index')
    && scenario.equipment.monitoring.includes('train-of-four')
    && scenario.timeline.some((event) => event.target === 'hypnotic-line-disconnection')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === AWARENESS_UNDER_PARALYSIS_OBJECTIVES.join('|');
}

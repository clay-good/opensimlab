import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the perioperative-hyperglycemia
 * lesson.
 *
 * The thirty-fifth anaesthesia lab, and the module's longest at 19,200 ticks,
 * because its third objective is gated on 30 simulated minutes elapsing after
 * the insulin intent. It is also the module's purest documentation lesson:
 * nothing a learner does here changes a physiological variable.
 */

/** The three declared objectives, in order, as the scenario states them. */
export const PERIOPERATIVE_HYPERGLYCEMIA_OBJECTIVES = [
  'confirm-perioperative-hyperglycemia',
  'use-bounded-insulin-protocol',
  'reassess-perioperative-glucose',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted glucose course, because every bounded glycemic response
 * is refused unless a hyperglycemic value is active.
 */
export function supportsPerioperativeHyperglycemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'perioperative-hyperglycemia'
    && scenario.timeline.some((event) => event.type === 'perioperative-hyperglycemia')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PERIOPERATIVE_HYPERGLYCEMIA_OBJECTIVES.join('|');
}

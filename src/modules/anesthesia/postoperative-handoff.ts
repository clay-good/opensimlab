import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the postoperative-handoff
 * lesson.
 *
 * The twentieth anaesthesia lab, and the only one in the module whose subject is
 * a conversation. Six bounded steps, and the engine refuses the last one until
 * the receiver has said back what they heard — so the loop is closed by the
 * model rather than merely recommended by the rubric.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const POSTOPERATIVE_HANDOFF_OBJECTIVES = [
  'confirm-handoff-readiness',
  'share-handoff-critical-content',
  'assign-handoff-risks-and-ownership',
  'close-loop-and-accept-transfer',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the narrative target the engine checks before offering any of the six
 * bounded steps: without it every action in this lesson is refused as belonging
 * to another scenario.
 */
export function supportsPostoperativeHandoff(scenario: Scenario): boolean {
  return scenario.metadata.id === 'postoperative-handoff'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'postoperative-handoff')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === POSTOPERATIVE_HANDOFF_OBJECTIVES.join('|');
}

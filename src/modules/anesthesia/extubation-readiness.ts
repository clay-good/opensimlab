import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the extubation-readiness lesson.
 *
 * The nineteenth anaesthesia lab, and the mirror of emergence-with-residual-
 * blockade. That patient had a quantitative ratio of 0.72 and deferring was
 * right; this one has 0.93 with every other checkpoint satisfied, and deferring
 * is the error. Same workup, opposite correct answer, and the difference is the
 * numbers rather than the caution.
 */

/** The five declared objectives, in order, as the scenario states them. */
export const EXTUBATION_READINESS_OBJECTIVES = [
  'confirm-extubation-quantitative-recovery',
  'assess-awake-airway-protection',
  'assess-extubation-gas-exchange',
  'plan-extubation-risk-and-rescue',
  'integrate-awake-extubation-readiness',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the narrative target the engine checks before offering any of the six
 * bounded choices: without it every action in this lesson is refused as
 * belonging to another scenario.
 */
export function supportsExtubationReadiness(scenario: Scenario): boolean {
  return scenario.metadata.id === 'extubation-readiness'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'extubation-readiness')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === EXTUBATION_READINESS_OBJECTIVES.join('|');
}

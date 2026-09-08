import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the delayed-emergence lesson.
 *
 * The eighteenth anaesthesia lab, and the longest ordered vignette in the
 * module: five steps rather than three, with the engine refusing any of them
 * taken out of turn.
 */

/** The five declared objectives, in order, as the scenario states them. */
export const DELAYED_EMERGENCE_OBJECTIVES = [
  'support-delayed-emergence-patient',
  'reconcile-delayed-emergence-exposures',
  'check-delayed-emergence-metabolic-causes',
  'find-delayed-emergence-lateralizing-sign',
  'escalate-delayed-emergence-neurologic-pattern',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the narrative target the engine checks before offering any of the six
 * bounded choices: without it every action in this lesson is refused as
 * belonging to another scenario.
 */
export function supportsDelayedEmergenceDifferential(scenario: Scenario): boolean {
  return scenario.metadata.id === 'delayed-emergence-differential'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'delayed-emergence-differential')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === DELAYED_EMERGENCE_OBJECTIVES.join('|');
}

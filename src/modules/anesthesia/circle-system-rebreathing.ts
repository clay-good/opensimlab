import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the circle-system-rebreathing
 * lesson.
 *
 * The thirtieth anaesthesia lab, and the module's only equipment failure. Its
 * three objectives are a sequence rather than a set: assess, bridge, then fix,
 * and the middle one is scored only if it precedes the fix.
 */

/** The three declared objectives, in order, as the scenario states them. */
export const CIRCLE_SYSTEM_REBREATHING_OBJECTIVES = [
  'recognize-inspired-carbon-dioxide',
  'bridge-with-fresh-gas-flow',
  'replace-exhausted-absorbent',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted equipment failure, because all three objectives measure
 * from it and both bounded circuit actions are refused until it has fired.
 */
export function supportsCircleSystemRebreathing(scenario: Scenario): boolean {
  return scenario.metadata.id === 'circle-system-rebreathing'
    && scenario.timeline.some((event) => event.type === 'equipment-failure')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CIRCLE_SYSTEM_REBREATHING_OBJECTIVES.join('|');
}

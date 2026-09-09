import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the venous-air-embolism lesson.
 *
 * The twenty-eighth anaesthesia lab, and the mirror image of the high-spinal
 * one. Both have an objective that can be earned in full while the patient is
 * unchanged; in that lesson it was the circulation treatment, and here it is the
 * oxygen. What the patient responds to is the source control.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const VENOUS_AIR_EMBOLISM_OBJECTIVES = [
  'escalate-venous-air-pattern',
  'control-venous-air-entry',
  'support-venous-air-oxygenation',
  'reassess-venous-air-recovery',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted embolism event: every objective is timed from it, and
 * the bounded source-control action is refused entirely until it has fired.
 */
export function supportsVenousAirEmbolism(scenario: Scenario): boolean {
  return scenario.metadata.id === 'venous-air-embolism-during-line-removal'
    && scenario.timeline.some((event) => event.type === 'venous-air-embolism')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === VENOUS_AIR_EMBOLISM_OBJECTIVES.join('|');
}

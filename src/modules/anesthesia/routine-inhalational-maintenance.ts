import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the routine-inhalational-
 * maintenance lesson.
 *
 * The thirty-sixth anaesthesia lab and the module's only continuous titration
 * problem: no bounded choices, just a volatile percentage and an infusion rate
 * against a stimulus that arrives at a known time. Its solution window is narrow
 * and its most useful finding is that acting EARLIER scores worse.
 */

/** The three declared objectives, in order, as the scenario states them. */
export const ROUTINE_INHALATIONAL_MAINTENANCE_OBJECTIVES = [
  'maintain-bounded-depth',
  'anticipate-surgical-stimulus',
  'reassess-when-stimulus-falls',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted stimulus, because the second and third objectives are
 * both measured against its onset and offset.
 */
export function supportsRoutineInhalationalMaintenance(scenario: Scenario): boolean {
  return scenario.metadata.id === 'routine-inhalational-maintenance'
    && scenario.timeline.some((event) => event.type === 'surgical-stimulus')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ROUTINE_INHALATIONAL_MAINTENANCE_OBJECTIVES.join('|');
}

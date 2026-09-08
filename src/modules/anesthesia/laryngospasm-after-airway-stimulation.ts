import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the laryngospasm lesson.
 *
 * The sixth anaesthesia lab, and the one where the response is not a list of
 * parallel measures. The engine relieves the modelled closure only when the
 * held maneuver, positive pressure, 95% oxygen AND a depth index at or below 60
 * are true together, so deepening is the enabling condition for the maneuver
 * rather than something done alongside it.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const LARYNGOSPASM_OBJECTIVES = [
  'preoxygenate-before-laryngospasm',
  'apply-initial-laryngospasm-measures',
  'deepen-during-laryngospasm',
  'protect-oxygenation-during-laryngospasm',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the scripted closure itself, because without that timeline event
 * three of these four objectives report "not exercised" and the fourth has
 * nothing to measure against.
 */
export function supportsLaryngospasmAfterAirwayStimulation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'laryngospasm-after-airway-stimulation'
    && scenario.timeline.some((event) => event.type === 'laryngospasm')
    && scenario.equipment.monitoring.includes('depth-index')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === LARYNGOSPASM_OBJECTIVES.join('|');
}

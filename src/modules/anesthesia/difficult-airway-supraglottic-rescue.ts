import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the difficult-airway
 * supraglottic-rescue lesson.
 *
 * The twenty-sixth anaesthesia lab, and the near-twin of repeated-laryngoscopy-
 * harm: the same four airway objectives without that lesson's prior-record
 * clause. Binding them as a pair is what makes their scoring differences legible.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE_OBJECTIVES = [
  'prepare-rescue-oxygen-reserve',
  'limit-attempts-and-call-for-help',
  'place-supraglottic-rescue',
  'confirm-rescue-gas-exchange',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * The sibling lesson shares four of these objective ids in the same order and
 * adds a fifth, so the joined comparison below separates them; the scenario id
 * check is what makes that certain rather than incidental.
 */
export function supportsDifficultAirwaySupraglotticRescue(scenario: Scenario): boolean {
  return scenario.metadata.id === 'difficult-airway-supraglottic-rescue'
    && scenario.timeline.some((event) => event.type === 'difficult-airway')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE_OBJECTIVES.join('|');
}

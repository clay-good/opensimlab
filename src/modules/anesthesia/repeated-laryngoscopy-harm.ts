import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the repeated-laryngoscopy-harm
 * lesson.
 *
 * The twenty-fifth anaesthesia lab. Its title names repeated laryngoscopy as the
 * harm, and its model disagrees: in a preoxygenated patient three attempts cost
 * nothing measurable. What the attempts do is spend a reserve, and the harm
 * appears only where there was none to spend.
 */

/** The five declared objectives, in order, as the scenario states them. */
export const REPEATED_LARYNGOSCOPY_HARM_OBJECTIVES = [
  'prepare-rescue-oxygen-reserve',
  'act-on-prior-airway-record',
  'limit-attempts-and-call-for-help',
  'place-supraglottic-rescue',
  'confirm-rescue-gas-exchange',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the difficult-airway configuration, which is set at tick 0 rather
 * than scripted mid-run: without it the rescue device is unavailable and every
 * laryngoscopy succeeds, which is a different lesson entirely.
 */
export function supportsRepeatedLaryngoscopyHarm(scenario: Scenario): boolean {
  return scenario.metadata.id === 'repeated-laryngoscopy-harm'
    && scenario.timeline.some((event) => event.type === 'difficult-airway')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === REPEATED_LARYNGOSCOPY_HARM_OBJECTIVES.join('|');
}

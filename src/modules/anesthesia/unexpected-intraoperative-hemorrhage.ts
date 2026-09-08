import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the unexpected-hemorrhage
 * lesson.
 *
 * The eighth anaesthesia lab, and the one whose counterfactual isolates a single
 * variable. The expert and recovery transcripts perform the identical volume
 * resuscitation, down to the tick; they differ only in the induction dose, and
 * that one difference decides two of the four objectives.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const UNEXPECTED_HEMORRHAGE_OBJECTIVES = [
  'recognize-hemorrhage',
  'temporize-volume-loss',
  'avoid-full-dose-induction',
  'manage-hypotension',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the two timeline events every window is measured from: the release
 * of the tamponade, and the moment the surgeon controls it. Without the second
 * one the temporizing objective has no deadline to count crystalloid against.
 */
export function supportsUnexpectedHemorrhage(scenario: Scenario): boolean {
  return scenario.metadata.id === 'unexpected-intraoperative-hemorrhage'
    && scenario.timeline.some((event) => event.id === 'rapid-blood-loss' && event.type === 'blood-loss')
    && scenario.timeline.some((event) => event.id === 'hemorrhage-controlled')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === UNEXPECTED_HEMORRHAGE_OBJECTIVES.join('|');
}

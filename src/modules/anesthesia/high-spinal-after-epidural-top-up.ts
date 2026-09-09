import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the high-spinal lesson.
 *
 * The twenty-seventh anaesthesia lab. Four objectives, and they are not of equal
 * weight to the patient: one of them is the whole survival story and another can
 * be earned in full while the patient dies.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP_OBJECTIVES = [
  'call-for-high-spinal-help',
  'support-high-spinal-breathing',
  'support-high-spinal-circulation',
  'protect-high-spinal-oxygenation',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted high-spinal event, because all four objectives measure
 * from it and the bounded ephedrine action is refused until it has fired.
 */
export function supportsHighSpinalAfterEpiduralTopUp(scenario: Scenario): boolean {
  return scenario.metadata.id === 'high-spinal-after-epidural-top-up'
    && scenario.timeline.some((event) => event.type === 'high-spinal')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP_OBJECTIVES.join('|');
}

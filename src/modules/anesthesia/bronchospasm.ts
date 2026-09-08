import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the bronchospasm lesson.
 *
 * The seventh anaesthesia lab, and the first whose first sign is a shape rather
 * than a number. The obstruction begins gently at a value of 0.35 and builds, so
 * the capnogram's plateau slopes well before the end-tidal figure leaves its
 * alarm limits — which is the whole reason the lesson exists.
 */

/** The six declared objectives, in order, as the scenario states them. */
export const BRONCHOSPASM_OBJECTIVES = [
  'read-the-capnogram',
  'deepen-before-reaching-for-anything-else',
  'escalate-bronchospasm',
  'give-first-line-bronchodilator',
  'ventilate-before-desaturation',
  'manage-hypotension',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the two-stage obstruction, because every window the objectives are
 * scored in is measured from the first of those events. Without them the lesson
 * has no clock.
 */
export function supportsBronchospasm(scenario: Scenario): boolean {
  return scenario.metadata.id === 'bronchospasm'
    && scenario.timeline.some((event) => event.id === 'bronchospasm-onset' && event.type === 'obstruction')
    && scenario.timeline.some((event) => event.id === 'bronchospasm-worsens')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === BRONCHOSPASM_OBJECTIVES.join('|');
}

import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the capnography-sampling-line
 * lesson.
 *
 * The thirty-first anaesthesia lab, and the only one whose middle objective
 * rewards NOT acting. The capnogram disappears and the patient is entirely well;
 * everything that goes wrong from here is something a learner does.
 */

/** The three declared objectives, in order, as the scenario states them. */
export const CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION_OBJECTIVES = [
  'cross-check-capnography-loss',
  'preserve-stable-ventilation',
  'restore-capnography-sampling',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted artifact event, because both bounded line actions are
 * refused unless the obstruction is currently present -- including, importantly,
 * after it has been cleared.
 */
export function supportsCapnographySamplingLineObstruction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'capnography-sampling-line-obstruction'
    && scenario.timeline.some((event) => event.type === 'artifact')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION_OBJECTIVES.join('|');
}

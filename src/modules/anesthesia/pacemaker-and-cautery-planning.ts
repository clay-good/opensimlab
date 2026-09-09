import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the pacemaker-and-cautery
 * planning lesson.
 *
 * The twenty-first anaesthesia lab. Four bounded steps and, unusually for this
 * module, a plan that cannot be taken back: the engine records one device plan
 * per attempt, so the shortcut is the first decision in the module that a
 * learner cannot correct after recognising it.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const PACEMAKER_AND_CAUTERY_PLANNING_OBJECTIVES = [
  'review-cied-device-record',
  'review-cied-procedure-risk',
  'choose-coordinated-cied-plan',
  'document-cied-backup-and-restoration',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the narrative target the engine checks before offering any of the
 * four bounded steps — and that target is `cied-cautery-planning` rather than
 * the scenario id, which is why this guard checks it explicitly.
 */
export function supportsPacemakerAndCauteryPlanning(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pacemaker-and-cautery-planning'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'cied-cautery-planning')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PACEMAKER_AND_CAUTERY_PLANNING_OBJECTIVES.join('|');
}

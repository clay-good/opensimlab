import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the pediatric sepsis lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricSepsisSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricSepsisAssessment']>;

/**
 * The six recorded steps.
 *
 * Unlike every other pediatrics lesson written so far, this engine case
 * authors no refusable choice, so there is no `lastUnsupportedChoice` to
 * read. What it refuses instead is order and time: each step refuses until
 * its predecessor is recorded, and the later report and the handoff each
 * refuse until simulated time has passed. A reader of this state cannot ask
 * what wrong turn was taken, only what has and has not been recorded.
 */
export type PediatricSepsisProgress = Pick<PediatricSepsisSnapshot,
  'patternAtTick' | 'shockBoundaryAtTick' | 'careAtTick'
  | 'sourceReviewAtTick' | 'laterResponseAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_SEPSIS_ACTIONS = [
  'reconcile-pediatric-sepsis-infection-and-organ-dysfunction',
  'distinguish-pediatric-sepsis-without-shock',
  'confirm-pediatric-sepsis-qualified-care-ownership',
  'review-pediatric-sepsis-source-organs-and-alternatives',
  'review-pediatric-sepsis-later-response',
  'handoff-pediatric-sepsis-active-risk',
] as const;

export type PediatricSepsisAction = (typeof PEDIATRIC_SEPSIS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Like status asthmaticus, this lesson carries three narratives on its main
 * target rather than the two most of the module uses, so the count is
 * asserted rather than assumed.
 */
export function supportsPediatricSepsis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-sepsis'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-sepsis-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'pediatric-sepsis-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_SEPSIS_ACTIONS.join('|');
}

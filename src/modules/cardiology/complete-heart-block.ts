import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the complete-heart-block lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type CompleteHeartBlockSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['completeHeartBlockAssessment']>;

/**
 * Five recorded steps against five declared objectives, one unordered pair,
 * and one time gate.
 *
 * The unordered pair is the argument of the lesson rather than a convenience:
 * reviewing the cause and activating pacing-capable care happen in parallel,
 * and the engine enforces that by refusing the reassessment until both have
 * landed while accepting them in either order. A learner who escalates before
 * finishing the cause review is doing the right thing, not skipping a step.
 *
 * `hemodynamicallyStable` is a fixed `true`, and `pacingDelivered` and
 * `captureAssessed` both stay `false` — the block persists and nothing is ever
 * paced.
 */
export type CompleteHeartBlockProgress = Pick<CompleteHeartBlockSnapshot,
  'stabilityAtTick' | 'contextAtTick' | 'pathwayAtTick'
  | 'reassessmentAtTick' | 'handoffAtTick'>;

export const COMPLETE_HEART_BLOCK_ACTIONS = [
  'reconcile-complete-heart-block-stability',
  'review-complete-heart-block-context',
  'activate-complete-heart-block-pathway',
  'reassess-complete-heart-block-trajectory',
  'handoff-complete-heart-block-pacing-plan',
] as const;

export type CompleteHeartBlockAction = (typeof COMPLETE_HEART_BLOCK_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsCompleteHeartBlock(scenario: Scenario): boolean {
  return scenario.metadata.id === 'complete-heart-block'
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'complete-heart-block').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'complete-heart-block').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'complete-heart-block-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === COMPLETE_HEART_BLOCK_ACTIONS.join('|');
}

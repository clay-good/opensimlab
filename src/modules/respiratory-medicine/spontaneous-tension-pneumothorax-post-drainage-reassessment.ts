import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the five controls of the post-drainage pneumothorax
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PostTensionPneumothoraxSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['postTensionPneumothoraxAssessment']>;

/**
 * The five recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no
 * decompression performed, no drain placed or manipulated, no suction or clamp
 * selected, no oxygen or medication delivered — which are constants rather than
 * observations.
 */
export type PostTensionPneumothoraxProgress = Pick<PostTensionPneumothoraxSnapshot,
  'trajectoryAtTick' | 'drainageResponseAtTick' | 'systemAtTick'
  | 'etiologyAtTick' | 'handoffAtTick'>;

export const POST_TENSION_PNEUMOTHORAX_ACTIONS = [
  'reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care',
  'review-spontaneous-tension-pneumothorax-drainage-response',
  'review-spontaneous-tension-pneumothorax-drain-system-and-complications',
  'review-spontaneous-tension-pneumothorax-etiology-recurrence-and-definitive-planning',
  'handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment',
] as const;

export type PostTensionPneumothoraxAction = (typeof POST_TENSION_PNEUMOTHORAX_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsPostTensionPneumothorax(scenario: Scenario): boolean {
  return scenario.metadata.id === 'spontaneous-tension-pneumothorax-post-drainage-reassessment'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'spontaneous-tension-pneumothorax-post-drainage-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'spontaneous-tension-pneumothorax-post-drainage-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === POST_TENSION_PNEUMOTHORAX_ACTIONS.join('|');
}

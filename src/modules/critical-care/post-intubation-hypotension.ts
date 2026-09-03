import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the post-intubation hypotension
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PostIntubationHypotensionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['postIntubationHypotensionAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The danger review sits between validating the pressure and classifying the
 * mechanism because two of the things on that list kill in minutes. A tension
 * pneumothorax and a lost or misplaced airway both present as hypotension two
 * minutes after intubation, and both are excluded here by evidence rather than
 * by the plausibility of the septic-shock story the learner already has.
 */
export type PostIntubationHypotensionProgress = Pick<PostIntubationHypotensionSnapshot,
  'pressureAtTick' | 'dangerAtTick' | 'mechanismAtTick'
  | 'supportAtTick' | 'reassessmentAtTick'>;

export const POST_INTUBATION_HYPOTENSION_ACTIONS = [
  'validate-post-intubation-pressure-and-call-help',
  'review-post-intubation-danger-pattern',
  'classify-post-intubation-hemodynamics',
  'record-post-intubation-support-intent',
  'reassess-post-intubation-hypotension',
] as const;

export type PostIntubationHypotensionAction = (typeof POST_INTUBATION_HYPOTENSION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsPostIntubationHypotension(scenario: Scenario): boolean {
  return scenario.metadata.id === 'post-intubation-hypotension'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'post-intubation-hypotension').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'post-intubation-hypotension-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === POST_INTUBATION_HYPOTENSION_ACTIONS.join('|');
}

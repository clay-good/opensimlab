import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency
 * severe-hyponatremia-with-seizure lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Renal and endocrine each carry their own
 * hyponatraemia lessons; this one is the seizure in the emergency department,
 * and the guard rejects the others on its own two narrative targets.
 */
export type SevereHyponatremiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['hyponatremiaAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain
 * with no time gates anywhere.
 *
 * The last two steps exist because the danger reverses direction partway
 * through. The first-hour panel shows the sodium rising as intended and the
 * urine output rising with it, which is the warning that the correction is
 * about to continue without anybody's help.
 */
export type SevereHyponatremiaProgress = Pick<SevereHyponatremiaSnapshot,
  'patternReviewedAtTick' | 'stabilizedAtTick' | 'hypertonicAtTick'
  | 'reassessedAtTick' | 'guardrailsAtTick'>;

/**
 * The five control ids the engine accepts. Note the action type is
 * `hyponatremia-response`, shorter than the scenario id.
 *
 * They are NOT the declared objective strings — only one of the five overlaps —
 * so the identity guard compares SEVERE_HYPONATREMIA_OBJECTIVES instead.
 */
export const SEVERE_HYPONATREMIA_ACTIONS = [
  'review-hyponatremia-pattern',
  'record-hyponatremia-stabilization',
  'record-hypertonic-saline-intent',
  'reassess-hyponatremia-first-hour',
  'record-hyponatremia-guardrails-and-cause-plan',
] as const;

/** The five declared objectives, in order, as the scenario states them. */
export const SEVERE_HYPONATREMIA_OBJECTIVES = [
  'recognize-severe-symptomatic-hyponatremia',
  'stabilize-severe-hyponatremia',
  'record-hypertonic-saline-intent',
  'reassess-early-sodium-and-neurologic-response',
  'prevent-hyponatremia-overcorrection',
] as const;

export type SevereHyponatremiaAction = (typeof SEVERE_HYPONATREMIA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. Both narratives are pinned by their own targets.
 */
export function supportsSevereHyponatremia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'severe-hyponatremia-with-seizure'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'severe-hyponatremia-with-seizure').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'severe-hyponatremia-with-seizure-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === SEVERE_HYPONATREMIA_OBJECTIVES.join('|');
}

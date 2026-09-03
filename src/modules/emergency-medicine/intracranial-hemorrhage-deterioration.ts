import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency
 * intracranial-hemorrhage-deterioration lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Neurology has its own separate cerebellar
 * intracerebral-haemorrhage lesson; this one is the anticoagulated thalamic
 * bleed that is getting worse while you watch it.
 */
export type IntracranialHemorrhageSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['intracranialHemorrhageAssessment']>;

/**
 * Six recorded steps against five declared objectives, in one strict chain with
 * no time gates anywhere.
 *
 * The fourth step carries the lesson. The engine gates the pressure strategy
 * behind the reversal intent, so nobody can spend the next several minutes
 * titrating a blood pressure while a bleeding brain stays anticoagulated.
 */
export type IntracranialHemorrhageProgress = Pick<IntracranialHemorrhageSnapshot,
  'deteriorationReviewedAtTick' | 'pathwayActivatedAtTick' | 'findingsReviewedAtTick'
  | 'reversalAtTick' | 'pressureControlAtTick' | 'escalatedAtTick'>;

/**
 * The six control ids the engine accepts. Note the action type is
 * `intracranial-hemorrhage-response`, shorter than the scenario id.
 *
 * They are NOT the declared objective strings — only one of the five overlaps —
 * so the identity guard compares INTRACRANIAL_HEMORRHAGE_OBJECTIVES instead.
 */
export const INTRACRANIAL_HEMORRHAGE_ACTIONS = [
  'review-ich-deterioration',
  'activate-ich-pathway',
  'review-ich-findings-and-coagulopathy',
  'record-warfarin-reversal-intent',
  'record-smooth-ich-pressure-control',
  'escalate-ich-neurocritical-care',
] as const;

/** The five declared objectives, in order, as the scenario states them. */
export const INTRACRANIAL_HEMORRHAGE_OBJECTIVES = [
  'recognize-and-stabilize-deteriorating-ich',
  'review-ich-imaging-and-coagulopathy',
  'record-urgent-warfarin-reversal-intent',
  'record-smooth-ich-pressure-control',
  'escalate-and-handoff-deteriorating-ich',
] as const;

export type IntracranialHemorrhageAction = (typeof INTRACRANIAL_HEMORRHAGE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. Both narratives are pinned by their own targets.
 */
export function supportsIntracranialHemorrhage(scenario: Scenario): boolean {
  return scenario.metadata.id === 'intracranial-hemorrhage-deterioration'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'intracranial-hemorrhage-deterioration').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'intracranial-hemorrhage-deterioration-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === INTRACRANIAL_HEMORRHAGE_OBJECTIVES.join('|');
}

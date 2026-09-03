import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency acute-ischemic-stroke
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Neurology has its own, separate minor
 * non-disabling stroke lesson; this one is the disabling large-vessel case.
 */
export type AcuteIschemicStrokeSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['acuteIschemicStrokeAssessment']>;

/**
 * Six recorded steps against five declared objectives, in one strict chain.
 *
 * The fifth step is the one that carries the lesson. Thrombolysis and
 * thrombectomy are parallel pathways rather than sequential ones, and the
 * engine records the transfer as a separate action taken without waiting for
 * any thrombolysis response.
 */
export type AcuteIschemicStrokeProgress = Pick<AcuteIschemicStrokeSnapshot,
  'presentationReviewedAtTick' | 'systemActivatedAtTick' | 'imagingReviewedAtTick'
  | 'tenecteplaseAtTick' | 'thrombectomyActivatedAtTick' | 'reassessedAtTick'>;

/**
 * The six control ids the engine accepts.
 *
 * They are NOT the declared objective strings — only one of the five overlaps —
 * so the identity guard compares ACUTE_ISCHEMIC_STROKE_OBJECTIVES instead.
 */
export const ACUTE_ISCHEMIC_STROKE_ACTIONS = [
  'review-stroke-presentation',
  'activate-stroke-system',
  'review-stroke-imaging-and-eligibility',
  'record-tenecteplase-20-mg-intent',
  'activate-thrombectomy-transfer',
  'reassess-and-handoff-stroke',
] as const;

/** The five declared objectives, in order, as the scenario states them. */
export const ACUTE_ISCHEMIC_STROKE_OBJECTIVES = [
  'recognize-and-activate-acute-stroke',
  'review-stroke-imaging-and-eligibility',
  'record-stroke-thrombolysis-intent',
  'activate-stroke-thrombectomy-pathway',
  'reassess-and-handoff-acute-stroke',
] as const;

export type AcuteIschemicStrokeAction = (typeof ACUTE_ISCHEMIC_STROKE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario — including neurology's own stroke lesson.
 */
export function supportsAcuteIschemicStroke(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acute-ischemic-stroke'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'acute-ischemic-stroke').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'acute-ischemic-stroke-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ACUTE_ISCHEMIC_STROKE_OBJECTIVES.join('|');
}

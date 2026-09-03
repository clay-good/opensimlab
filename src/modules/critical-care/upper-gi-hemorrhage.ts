import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the recurrent upper-GI-hemorrhage
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type UpperGiHemorrhageSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['upperGiHemorrhageAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The resuscitation step is the one that carries the lesson. A haemoglobin of
 * 6.8 is the number everyone looks at, and it is the slowest thing in the room:
 * the lactate, the refill and the pressure had already said this, and 7 g/dL is
 * recorded here as something to individualize rather than a trigger to obey.
 */
export type UpperGiHemorrhageProgress = Pick<UpperGiHemorrhageSnapshot,
  'recognitionAtTick' | 'patternAtTick' | 'resuscitationAtTick'
  | 'hemostasisAtTick' | 'reassessmentAtTick'>;

export const UPPER_GI_HEMORRHAGE_ACTIONS = [
  'recognize-recurrent-upper-gi-hemorrhage',
  'review-upper-gi-hemorrhage-pattern',
  'record-upper-gi-hemorrhage-resuscitation',
  'activate-repeat-endoscopy-pathway',
  'reassess-upper-gi-hemorrhage-trajectory',
] as const;

export type UpperGiHemorrhageAction = (typeof UPPER_GI_HEMORRHAGE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsUpperGiHemorrhage(scenario: Scenario): boolean {
  return scenario.metadata.id === 'upper-gi-hemorrhage'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'upper-gi-hemorrhage').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'upper-gi-hemorrhage-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === UPPER_GI_HEMORRHAGE_ACTIONS.join('|');
}

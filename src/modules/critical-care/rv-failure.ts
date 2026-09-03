import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the right-ventricular failure lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type RvFailureSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['rightVentricularFailureAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * This is the fourth shock lesson in the module and the one where both of the
 * obvious moves are wrong. A congested patient invites diuresis and a
 * hypotensive one invites fluid; a pressure-loaded right ventricle with a
 * central venous pressure of 18 and a wedge of 10 tolerates neither reflex,
 * and the support step is written to exclude both by name.
 */
export type RvFailureProgress = Pick<RvFailureSnapshot,
  'recognitionAtTick' | 'phenotypeAtTick' | 'supportAtTick'
  | 'triggersAtTick' | 'reassessmentAtTick'>;

export const RV_FAILURE_ACTIONS = [
  'recognize-rv-failure-trajectory',
  'review-rv-failure-phenotype',
  'record-rv-failure-support',
  'address-rv-failure-triggers',
  'reassess-rv-failure-trajectory',
] as const;

export type RvFailureAction = (typeof RV_FAILURE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsRvFailure(scenario: Scenario): boolean {
  return scenario.metadata.id === 'right-ventricular-failure'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'right-ventricular-failure').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'right-ventricular-failure-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === RV_FAILURE_ACTIONS.join('|');
}

import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the obesity-hypoventilation
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type ObesityHypoventilationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obesityHypoventilationAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no BMI or AHI calculated, no bicarbonate, gas or sleep study
 * acquired, scored or interpreted, no oxygen, device or weight intervention
 * selected — which are constants rather than observations.
 */
export type ObesityHypoventilationProgress = Pick<ObesityHypoventilationSnapshot,
  'phenotypeAtTick' | 'awakeEvidenceAtTick' | 'sleepEvidenceAtTick'
  | 'recognitionAtTick' | 'coordinatedPlanAtTick' | 'handoffAtTick'>;

export const OBESITY_HYPOVENTILATION_ACTIONS = [
  'reconcile-obesity-hypoventilation-phenotype-and-trajectory',
  'review-obesity-hypoventilation-awake-evidence',
  'review-obesity-hypoventilation-sleep-evidence-and-open-causes',
  'recognize-obesity-hypoventilation-working-pattern',
  'coordinate-obesity-hypoventilation-shared-plan',
  'handoff-obesity-hypoventilation-reassessment',
] as const;

export type ObesityHypoventilationAction = (typeof OBESITY_HYPOVENTILATION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsObesityHypoventilation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'obesity-hypoventilation-reassessment'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'obesity-hypoventilation-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'obesity-hypoventilation-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === OBESITY_HYPOVENTILATION_ACTIONS.join('|');
}

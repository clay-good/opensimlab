import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the five controls of the opioid-hypoventilation
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps. Five objectives rather than six, so only the
 * two runtime requirements remain outstanding here.
 */
export type ChronicOpioidHypoventilationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['chronicOpioidHypoventilationAssessment']>;

/**
 * The five recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no blood gas or sleep study acquired or interpreted, no drug,
 * dose, taper or naloxone selected, no support device chosen — which are
 * constants rather than observations.
 */
export type ChronicOpioidHypoventilationProgress = Pick<ChronicOpioidHypoventilationSnapshot,
  'trajectoryAtTick' | 'evidenceAtTick' | 'alternativesAtTick'
  | 'coordinatedPlanAtTick' | 'handoffAtTick'>;

export const CHRONIC_OPIOID_HYPOVENTILATION_ACTIONS = [
  'reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory',
  'review-chronic-opioid-related-hypoventilation-awake-and-sleep-evidence',
  'review-chronic-opioid-related-hypoventilation-contributors-and-alternatives',
  'coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan',
  'handoff-chronic-opioid-related-hypoventilation-reassessment',
] as const;

export type ChronicOpioidHypoventilationAction = (typeof CHRONIC_OPIOID_HYPOVENTILATION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsChronicOpioidHypoventilation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'chronic-opioid-related-hypoventilation-reassessment'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'chronic-opioid-related-hypoventilation-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'chronic-opioid-related-hypoventilation-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CHRONIC_OPIOID_HYPOVENTILATION_ACTIONS.join('|');
}

import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the DKA resolution lesson.
 *
 * The model itself lives in the shared engine, which is where this lesson was
 * built. What was missing was a name for the state it already publishes, so a
 * tutor and a worked example can read the learner's own recorded steps rather
 * than a script of their own.
 */
export type DkaResolutionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['endocrineDkaResolutionAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot is a list of things this lesson does not do — no dose
 * selected, no test interpreted, no outcome predicted — which are constants
 * rather than observations. A tutor or an example that read them would be
 * reading its own contract back to itself, so both take this narrower view.
 */
export type DkaResolutionProgress = Pick<DkaResolutionSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const DKA_RESOLUTION_ACTIONS = [
  'activate-dka-resolution-endocrine-nursing-pharmacy-electrolyte-nutrition-and-transition-support',
  'reconcile-dka-resolution-initial-triad-treatment-clock-current-ketone-acid-base-potassium-glucose-and-whole-person',
  'recognize-persistent-dka-despite-lower-glucose-and-closed-anion-gap',
  'review-qualified-dka-insulin-dextrose-potassium-monitoring-resolution-and-bridged-transition-boundaries',
  'review-dka-resolution-fixed-four-hour-qualified-report',
  'handoff-dka-recurrence-insulin-potassium-nutrition-precipitant-education-follow-up-and-outcome-risk',
] as const;

export type DkaResolutionAction = (typeof DKA_RESOLUTION_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsDkaResolution(scenario: Scenario): boolean {
  return scenario.metadata.id === 'dka-resolution-transition'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'dka-resolution-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'dka-resolution-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === DKA_RESOLUTION_ACTIONS.join('|');
}

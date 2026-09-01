import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the HHS trajectory lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps rather than a script of their own.
 */
export type HhsOsmolalitySnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['endocrineHhsAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no fluid
 * selected, no test interpreted, no outcome predicted — which are constants
 * rather than observations.
 */
export type HhsOsmolalityProgress = Pick<HhsOsmolalitySnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const HHS_OSMOLALITY_ACTIONS = [
  'activate-hhs-endocrine-resuscitation-nursing-renal-cardiac-and-monitoring-support',
  'reconcile-hhs-glucose-sodium-osmolality-ketone-perfusion-cognition-and-whole-person',
  'recognize-hhs-hyperosmolality-without-glucose-sodium-or-ketone-only-closure',
  'review-qualified-hhs-cautious-correction-osmolality-potassium-monitoring-and-harm-prevention',
  'review-hhs-fixed-four-hour-qualified-report',
  'handoff-hhs-osmolality-cognition-fluid-electrolyte-precipitant-and-outcome-risk',
] as const;

export type HhsOsmolalityAction = (typeof HHS_OSMOLALITY_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsHhsOsmolality(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hhs-osmolality-trajectory'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'hhs-osmolality-trajectory').length === 1
    && scenario.timeline.filter((event) => event.target === 'hhs-osmolality-trajectory-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HHS_OSMOLALITY_ACTIONS.join('|');
}

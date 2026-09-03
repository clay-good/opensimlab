import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the AKI-with-fluid-overload lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps. The engine case and assessment are named for
 * the response (`aki-fluid-overload`) rather than for the scenario id.
 */
export type AkiFluidOverloadSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['akiFluidOverloadAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The fluid-plan step is the one that carries the lesson. Nine kilograms of
 * water arrived one reasonable infusion at a time, and the cheapest thing
 * available is to stop adding to it — which is a step everybody skips on the
 * way to arguing about dialysis.
 */
export type AkiFluidOverloadProgress = Pick<AkiFluidOverloadSnapshot,
  'recognitionAtTick' | 'contextAtTick' | 'fluidPlanAtTick'
  | 'supportAtTick' | 'reassessmentAtTick'>;

export const AKI_FLUID_OVERLOAD_ACTIONS = [
  'recognize-aki-fluid-overload',
  'review-aki-fluid-overload-context',
  'limit-fluid-and-review-diuretic-response',
  'activate-individualized-kidney-support-pathway',
  'reassess-aki-fluid-overload-trajectory',
] as const;

export type AkiFluidOverloadAction = (typeof AKI_FLUID_OVERLOAD_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsAkiFluidOverload(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acute-kidney-injury-with-fluid-overload'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'acute-kidney-injury-with-fluid-overload').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'acute-kidney-injury-with-fluid-overload-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === AKI_FLUID_OVERLOAD_ACTIONS.join('|');
}

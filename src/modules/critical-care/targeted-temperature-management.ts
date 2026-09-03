import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the post-arrest temperature-control
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type TargetedTemperatureManagementSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['postArrestTemperatureAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The protocol step is the one that carries the lesson. A decade of practice
 * taught a number, 33°C, and the range this engine records instead is 32 to
 * 37.5 with no temperature in it declared superior — which makes the decision
 * about avoiding fever and controlling temperature deliberately rather than
 * about hitting a figure.
 */
export type TargetedTemperatureManagementProgress = Pick<TargetedTemperatureManagementSnapshot,
  'recognitionAtTick' | 'contextAtTick' | 'protocolAtTick'
  | 'guardrailsAtTick' | 'reassessmentAtTick'>;

export const TARGETED_TEMPERATURE_MANAGEMENT_ACTIONS = [
  'recognize-post-arrest-temperature-control',
  'review-post-arrest-temperature-context',
  'activate-post-arrest-temperature-protocol',
  'record-temperature-control-guardrails',
  'reassess-post-arrest-temperature-trajectory',
] as const;

export type TargetedTemperatureManagementAction = (typeof TARGETED_TEMPERATURE_MANAGEMENT_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsTargetedTemperatureManagement(scenario: Scenario): boolean {
  return scenario.metadata.id === 'targeted-temperature-management'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'targeted-temperature-management').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'targeted-temperature-management-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === TARGETED_TEMPERATURE_MANAGEMENT_ACTIONS.join('|');
}

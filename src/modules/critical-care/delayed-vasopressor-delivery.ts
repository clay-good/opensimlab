import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the delayed-vasopressor-delivery lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type DelayedVasopressorDeliverySnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['delayedVasopressorDeliveryAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The first step is the one that carries the lesson. A pump reading RUNNING is
 * a statement about a motor, not about a patient, and the four states the
 * engine keeps separate — command, transit, delivery, effect — are what make
 * six minutes of unchanged shock a finding rather than a mystery.
 */
export type DelayedVasopressorDeliveryProgress = Pick<DelayedVasopressorDeliverySnapshot,
  'discordanceAtTick' | 'pathAtTick' | 'classifiedAtTick'
  | 'protocolAtTick' | 'reassessedAtTick'>;

export const DELAYED_VASOPRESSOR_DELIVERY_ACTIONS = [
  'review-vasopressor-command-delivery-discordance',
  'trace-vasopressor-source-to-patient-path',
  'classify-vasopressor-dead-space-startup-delay',
  'activate-vasopressor-startup-safety-plan',
  'reassess-vasopressor-delivery-and-perfusion',
] as const;

export type DelayedVasopressorDeliveryAction = (typeof DELAYED_VASOPRESSOR_DELIVERY_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsDelayedVasopressorDelivery(scenario: Scenario): boolean {
  return scenario.metadata.id === 'delayed-vasopressor-delivery'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'delayed-vasopressor-delivery').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'delayed-vasopressor-delivery-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === DELAYED_VASOPRESSOR_DELIVERY_ACTIONS.join('|');
}

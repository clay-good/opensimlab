import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the mucus-plugging lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type MucusPluggingSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['mucusPluggingAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * and the only lesson in this module whose first step is treatment rather than
 * assessment.
 *
 * Support and help come before the review because he is at 87% with an abrupt
 * rise in airway resistance, and oxygen does not require a diagnosis. The rest
 * of the chain then does what the other ventilation lessons do: establish the
 * indicators before the intervention, and the response before the escalation.
 * The closing step exists because the fix works and does not work — the central
 * airway improves and the left base does not.
 */
export type MucusPluggingProgress = Pick<MucusPluggingSnapshot,
  'supportAtTick' | 'indicatorsAtTick' | 'suctionAtTick'
  | 'reassessmentAtTick' | 'escalationAtTick'>;

export const MUCUS_PLUGGING_ACTIONS = [
  'support-mucus-plugging-and-call-help',
  'review-mucus-plugging-indicators',
  'record-indicated-airway-suction-intent',
  'reassess-mucus-plugging-response',
  'escalate-persistent-mucus-plugging',
] as const;

export type MucusPluggingAction = (typeof MUCUS_PLUGGING_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsMucusPlugging(scenario: Scenario): boolean {
  return scenario.metadata.id === 'mucus-plugging'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'mucus-plugging').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'mucus-plugging-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MUCUS_PLUGGING_ACTIONS.join('|');
}

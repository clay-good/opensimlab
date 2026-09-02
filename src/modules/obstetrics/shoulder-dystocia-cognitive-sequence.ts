import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the shoulder-dystocia lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type ShoulderDystociaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsShoulderDystociaAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no traction applied, no position changed, no pressure applied, no
 * maneuver or episiotomy performed — which are constants rather than
 * observations.
 */
export type ShoulderDystociaProgress = Pick<ShoulderDystociaSnapshot,
  'supportAtTick' | 'contextAtTick' | 'safetyAtTick'
  | 'escalationAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const SHOULDER_DYSTOCIA_ACTIONS = [
  'activate-obstetrics-shoulder-dystocia-emergency-response-head-delivery-clock-leader-timekeeper-newborn-and-support-roles',
  'reconcile-obstetrics-shoulder-dystocia-head-delivery-gentle-traction-failure-position-pushing-and-whole-person',
  'review-obstetrics-shoulder-dystocia-stop-pushing-no-fundal-pressure-no-forceful-traction-and-first-line-position-boundary',
  'review-obstetrics-shoulder-dystocia-qualified-escalation-maneuvers-episiotomy-access-rescue-and-documentation-boundary',
  'review-obstetrics-shoulder-dystocia-fixed-qualified-delivery-and-immediate-risk-report',
  'handoff-obstetrics-shoulder-dystocia-maternal-newborn-injury-hemorrhage-support-documentation-and-outcome-risk',
] as const;

export type ShoulderDystociaAction = (typeof SHOULDER_DYSTOCIA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsShoulderDystocia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'shoulder-dystocia-cognitive-sequence'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'shoulder-dystocia-cognitive-sequence-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'shoulder-dystocia-cognitive-sequence-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === SHOULDER_DYSTOCIA_ACTIONS.join('|');
}

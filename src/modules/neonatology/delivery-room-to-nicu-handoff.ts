import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the delivery-room-to-NICU handoff
 * lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type NicuHandoffSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neonatologyNicuHandoffAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no transport
 * performed, no check-back spoken, no shared understanding proven — which are
 * constants rather than observations.
 */
export type NicuHandoffProgress = Pick<NicuHandoffSnapshot,
  'supportAtTick' | 'contextAtTick' | 'contentAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const NICU_HANDOFF_ACTIONS = [
  'activate-delivery-room-nicu-sending-receiving-transport-and-family-handoff-support',
  'reconcile-delivery-room-nicu-gestation-perinatal-birth-resuscitation-current-state-parent-and-whole-dyad',
  'review-delivery-room-nicu-patient-assessment-situation-safety-background-actions-timing-ownership-and-next-step-content',
  'review-qualified-delivery-room-nicu-transport-continuity-receiving-readiness-check-back-and-family-boundaries',
  'review-delivery-room-nicu-fixed-receiver-check-back-and-ten-minute-arrival-report',
  'handoff-delivery-room-nicu-respiratory-thermal-glucose-neurologic-infection-feeding-family-and-outcome-risk',
] as const;

export type NicuHandoffAction = (typeof NICU_HANDOFF_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsNicuHandoff(scenario: Scenario): boolean {
  return scenario.metadata.id === 'delivery-room-to-nicu-handoff'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'delivery-room-to-nicu-handoff').length === 1
    && scenario.timeline.filter((event) => event.target === 'delivery-room-to-nicu-handoff-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === NICU_HANDOFF_ACTIONS.join('|');
}

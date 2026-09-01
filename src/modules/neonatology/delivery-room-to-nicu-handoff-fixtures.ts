import type { NicuHandoffAction } from './delivery-room-to-nicu-handoff';

/**
 * Reference transcripts for the delivery-room-to-NICU handoff lesson.
 *
 * The error path starts telling the story. Reciting what happened is the part
 * of a handoff that feels like the handoff, and the shape refused here is
 * beginning it before the sending, receiving, transport and family ownership
 * are named and the whole dyad connected — because a story told to nobody in
 * particular is how continuity gets dropped between two teams who each thought
 * the other had it. The recovery path starts from exactly those refusals and
 * still reaches a correct handoff in the same run.
 */
export const NICU_HANDOFF_FIXTURES = {
  scenarioId: 'delivery-room-to-nicu-handoff', contentVersion: '0.1.0', seed: 9028,
  noAction: [],
  expert: [
    [0, 'activate-delivery-room-nicu-sending-receiving-transport-and-family-handoff-support'],
    [1, 'reconcile-delivery-room-nicu-gestation-perinatal-birth-resuscitation-current-state-parent-and-whole-dyad'],
    [2, 'review-delivery-room-nicu-patient-assessment-situation-safety-background-actions-timing-ownership-and-next-step-content'],
    [3, 'review-qualified-delivery-room-nicu-transport-continuity-receiving-readiness-check-back-and-family-boundaries'],
    [4, 'review-delivery-room-nicu-fixed-receiver-check-back-and-ten-minute-arrival-report'],
    [5, 'handoff-delivery-room-nicu-respiratory-thermal-glucose-neurologic-infection-feeding-family-and-outcome-risk'],
  ],
  commonError: [
    [0, 'review-delivery-room-nicu-patient-assessment-situation-safety-background-actions-timing-ownership-and-next-step-content'],
    [1, 'review-delivery-room-nicu-fixed-receiver-check-back-and-ten-minute-arrival-report'],
    [2, 'handoff-delivery-room-nicu-respiratory-thermal-glucose-neurologic-infection-feeding-family-and-outcome-risk'],
  ],
  recovery: [
    [0, 'review-delivery-room-nicu-patient-assessment-situation-safety-background-actions-timing-ownership-and-next-step-content'],
    [1, 'handoff-delivery-room-nicu-respiratory-thermal-glucose-neurologic-infection-feeding-family-and-outcome-risk'],
    [2, 'activate-delivery-room-nicu-sending-receiving-transport-and-family-handoff-support'],
    [3, 'reconcile-delivery-room-nicu-gestation-perinatal-birth-resuscitation-current-state-parent-and-whole-dyad'],
    [4, 'review-delivery-room-nicu-patient-assessment-situation-safety-background-actions-timing-ownership-and-next-step-content'],
    [5, 'review-qualified-delivery-room-nicu-transport-continuity-receiving-readiness-check-back-and-family-boundaries'],
    [6, 'review-delivery-room-nicu-fixed-receiver-check-back-and-ten-minute-arrival-report'],
    [7, 'handoff-delivery-room-nicu-respiratory-thermal-glucose-neurologic-infection-feeding-family-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NicuHandoffAction])[];
  expert: readonly (readonly [number, NicuHandoffAction])[];
  commonError: readonly (readonly [number, NicuHandoffAction])[];
  recovery: readonly (readonly [number, NicuHandoffAction])[];
};

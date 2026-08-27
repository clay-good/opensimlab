import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { PerioperativeDiabetesSnapshot } from '@platform/kernel/protocol';
import { supportsPerioperativeDiabetes, type PerioperativeDiabetesAction } from '../perioperative-diabetes';

export const PERIOPERATIVE_DIABETES_DEMONSTRATION_VERSION = '0.1.0';
export function supportsPerioperativeDiabetesDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPerioperativeDiabetes(scenario);
}
export interface PerioperativeDiabetesDemonstrationStep {
  readonly id: string;
  readonly narration: string;
  readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly action?: PerioperativeDiabetesAction;
  readonly finished?: boolean;
}

export function perioperativeDiabetesDemonstrationStep(patient?: PerioperativeDiabetesSnapshot): PerioperativeDiabetesDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Insulin continuity and continuing perioperative responsibilities are handed off. Earlier decisions and requested findings remain in the record. This ends the example, not the need for care or the decision about surgery.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse a different response.', focus: 'actions', progress: 1, finished: true };
  if (patient.insulinAtTick === null) return { id: 'insulin', narration: 'Restore qualified, verified insulin delivery after the supplied pump interruption without background replacement. Fasting does not remove the insulin requirement in type 1 diabetes. This request does not wait for new laboratory results, planning, or administrative review and does not blindly restart a pump or select a fixed delivery route.', focus: 'actions', progress: 0.05, action: 'restore-insulin' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate diabetes, anesthesia, surgical, and nursing ownership for the delayed operation. These parallel responsibilities appear one at a time for reading; urgent insulin continuity must not wait for acknowledgment.', focus: 'actions', progress: 0.15, action: 'call-support' };
  if (patient.contextReviewedAtTick === null) return { id: 'context', narration: 'Review the pump interruption, absent background replacement, missed meals, and supplied metabolic findings. pH, bicarbonate, potassium, and creatinine remain historical context; this lesson does not model an acidosis response or diagnose ketoacidosis.', focus: 'actions', progress: 0.25, action: 'review-context' };
  if (patient.fastingPlanAtTick === null) return { id: 'fasting', narration: 'Coordinate an individualized insulin, substrate, fluid, electrolyte, theater, and postoperative plan. No dose or route is prescribed. This planning request has no independent biochemical effect and does not imply that everyone needs the same glucose infusion.', focus: 'actions', progress: 0.35, action: 'plan-fasting' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange blood-glucose, ketone, and bedside surveillance. CGM is not the sole assessment here. A blood-glucose-only check is available, but it leaves the previous full ketone assessment historical.', focus: 'actions', progress: 0.45, action: 'monitor' };
  if (!patient.earlyResponseObserved && !patient.responseObserved) return patient.earlyDueInSeconds !== null
    ? { id: 'early-observation', narration: 'Continue verified insulin delivery and close assessment. The 30-minute contrast is authored, not predicted insulin kinetics or a required clinical wait. Pause freely; no laboratory result appears automatically.', focus: 'monitor', progress: 0.55 }
    : { id: 'early-reassessment', narration: 'Request a full glucose, ketone, and bedside assessment. This early observation supports a later comparison; it is not a prerequisite for urgent care or a mandatory step before clinical handoff.', focus: 'actions', progress: 0.65, action: 'reassess' };
  if (patient.responseDueInSeconds !== null) return { id: 'response-observation', narration: 'Continue the individualized fasting plan and surveillance. The 60-minute teaching checkpoint is not a safe interval without checks. New glucose-only findings would not refresh this earlier ketone result.', focus: 'monitor', progress: 0.75 };
  if (!patient.responseObserved) return { id: 'response-reassessment', narration: 'Request a fresh full glucose, ketone, and bedside assessment. Neither an accepted insulin request nor an improved glucose alone establishes the later full response. The result does not automatically clear surgery.', focus: 'actions', progress: 0.85, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand off verified insulin delivery, fasting and substrate review, monitoring, theater timing, and postoperative responsibilities. Retain earlier decisions and observations. This is continuing-care ownership, not surgical clearance or proof of durable safety.', focus: 'actions', progress: 0.95, action: 'handoff' };
}

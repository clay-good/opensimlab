import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PerioperativeDiabetesSnapshot } from '@platform/kernel/protocol';

export const PERIOPERATIVE_DIABETES_SOURCE_HREF = 'https://doi.org/10.2337/dc26-S016';
export const PERIOPERATIVE_DIABETES_UK_SOURCE_HREF = 'https://doi.org/10.1111/anae.70181';

/** Read accepted care and requested observations, never private glucose or ketone evolution. */
export function perioperativeDiabetesInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly perioperativeDiabetes?: PerioperativeDiabetesSnapshot;
}) {
  const patient = input.perioperativeDiabetes;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because, sourceHref: PERIOPERATIVE_DIABETES_SOURCE_HREF };
  if (patient.insulinAtTick === null) return prompt('perioperative-diabetes-insulin', true,
    'Restore qualified, verified insulin delivery for the supplied interruption.',
    'Type 1 diabetes still needs insulin while fasting. The pump stopped without background replacement. Urgent continuity does not wait for a new laboratory result or administrative acknowledgment; this request is not a blind pump restart or a fixed route.');
  if (!patient.supportActive) return prompt('perioperative-diabetes-support', true,
    'Coordinate the diabetes, anesthesia, surgical, and nursing teams.',
    'The delayed operation and prolonged fasting need shared ownership. Support, review, planning, and surveillance can proceed alongside restored delivery.');
  if (patient.contextReviewedAtTick === null) return prompt('perioperative-diabetes-context', true,
    'Review the pump interruption, missed meals, and supplied metabolic context.',
    'Confirm the delivery history and alternative plan. Supplied pH, bicarbonate, potassium, and creatinine are historical context, not a new assessment or a modeled acidosis response.');
  if (patient.fastingPlanAtTick === null) return prompt('perioperative-diabetes-fasting', true,
    'Coordinate an individualized fasting and perioperative plan.',
    'Review insulin, substrate, fluid, electrolyte, theater, and postoperative needs. This request selects no dose or route and does not make a universal glucose-infusion requirement or cause a biochemical response.');
  if (patient.monitoringAtTick === null) return prompt('perioperative-diabetes-monitor', true,
    'Arrange blood-glucose, ketone, and bedside surveillance.',
    'CGM alone is not the requested perioperative assessment. A glucose-only check does not refresh ketones or establish a complete response.');
  if (!patient.earlyResponseObserved && !patient.responseObserved) return patient.earlyDueInSeconds !== null
    ? prompt('perioperative-diabetes-observe-early', false, 'Continue verified insulin delivery and close reassessment.',
      'The 30-minute contrast is authored, not a required clinical wait or predicted insulin kinetics. Earlier results remain historical.')
    : prompt('perioperative-diabetes-reassess-early', true, 'Request a full glucose, ketone, and bedside assessment.',
      'An accepted insulin request or a newer glucose-only result does not establish the ketone trajectory. A fresh full assessment keeps the observations together.');
  if (patient.responseDueInSeconds !== null) return prompt('perioperative-diabetes-observe-response', false,
    'Continue the individualized plan and repeated assessment.',
    'The 60-minute checkpoint is authored, not a safe interval without checks or permission to stop insulin. Improvement does not automatically clear the operation.');
  if (!patient.responseObserved) return prompt('perioperative-diabetes-reassess-response', true,
    'Request a fresh full assessment before continuing-care handoff.',
    'Review blood glucose, ketones, and bedside findings together. A glucose-only result cannot establish the later full response, diagnose or exclude ketoacidosis, or authorize surgery.');
  return prompt('perioperative-diabetes-handoff', false, 'Hand off verified insulin continuity and the perioperative plan.',
    'Keep fasting, monitoring, delivery, theater timing, and postoperative responsibilities explicit. Handoff is not automatic surgical clearance or durable safety.');
}

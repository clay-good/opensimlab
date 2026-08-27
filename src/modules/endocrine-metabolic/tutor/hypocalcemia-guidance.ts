import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HypocalcemiaSnapshot } from '@platform/kernel/protocol';

export const HYPOCALCEMIA_SOURCE_ID = 'sfe-acute-hypocalcemia-2016';
export const HYPOCALCEMIA_SOURCE_HREF = 'https://doi.org/10.1530/EC-16-0056';
export const HYPOCALCEMIA_ESE_SOURCE_ID = 'ese-hypoparathyroidism-2025';
export const HYPOCALCEMIA_ESE_SOURCE_HREF = 'https://doi.org/10.1093/ejendo/lvaf222';

/** Read-only guidance follows accepted decisions and explicit observations. */
export function hypocalcemiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly hypocalcemia?: HypocalcemiaSnapshot;
}) {
  const patient = input.hypocalcemia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because, sourceHref: HYPOCALCEMIA_SOURCE_HREF };
  if (patient.calciumAtTick === null) return prompt('hypocalcemia-rescue', true,
    'Start qualified calcium rescue with ECG monitoring now.',
    'The supplied low calcium and tetany need urgent care. Risk review, cause investigation, and magnesium care proceed alongside rescue, not before it. Oral treatment alone is not rescue for this symptomatic emergency.');
  if (patient.riskAssessedAtTick === null) return prompt('hypocalcemia-risk', true,
    'Review airway, seizure, and postoperative neck concerns.',
    'A currently patent airway does not remove the need for vigilance. New neck swelling or breathing difficulty after thyroid surgery needs qualified reassessment; do not attribute every change to calcium.');
  if (patient.causeReviewedAtTick === null) return prompt('hypocalcemia-cause', true,
    'Open the supplied cause panel while rescue continues.',
    'Postoperative calcium needs a continuing plan. Review the supplied parathyroid hormone, magnesium, phosphate, and renal information before choosing the qualified cause-directed pathways.');
  if (patient.magnesiumAtTick === null) return prompt('hypocalcemia-magnesium', true,
    'Arrange qualified magnesium correction alongside calcium care.',
    'The opened panel shows low magnesium, which can impair parathyroid function and sustained calcium correction. No normalized magnesium result is inferred from accepting this request.');
  if (patient.continuingCareAtTick === null) return prompt('hypocalcemia-continuing', true,
    'Arrange continuing calcium and cause-directed care.',
    'The supplied low parathyroid hormone and low magnesium mean symptom relief alone is not a durable plan. Continuing care and magnesium correction can proceed independently after cause review.');
  if (!patient.supportActive) return prompt('hypocalcemia-support', true,
    'Make ongoing monitoring and specialist ownership explicit.',
    'Qualified endocrine, surgical, emergency, and nursing support share the plan for calcium, magnesium, ECG monitoring, and postoperative risk.');
  if (patient.calciumDueInSeconds !== null) return prompt('hypocalcemia-observe-rescue', false,
    'Continue frequent assessment during rescue.',
    'The 15-minute relief checkpoint is an authored teaching contrast, not a safe waiting interval. Never wait for it if symptoms or breathing worsen.');
  if (!patient.calciumResponseObserved && patient.responseDueInSeconds !== null) return prompt('hypocalcemia-check-rescue', true,
    'Request a fresh calcium and bedside assessment.',
    'Accepting rescue is not observing its effect. Less spasm does not prove calcium normalization or remove ongoing risk.');
  if (patient.responseDueInSeconds !== null) return prompt('hypocalcemia-observe-continuing', false,
    'Continue care and frequent reassessment beyond early relief.',
    'The one-hour complete-care checkpoint is authored, not a treatment prediction. Previous calcium results remain historical until requested again.');
  if (!patient.responseObserved) return prompt('hypocalcemia-check-continuing', true,
    'Request a fresh whole-person and calcium reassessment.',
    'The early observation cannot establish the later response. Magnesium correction and continuing care require ongoing qualified review, not assumptions of recovery.');
  return prompt('hypocalcemia-handoff', false, 'Hand off continuing care and unresolved risk.',
    'Name who owns serial calcium and magnesium review, ECG monitoring, postoperative concerns, and the ongoing calcium and cause-directed plan. Partial relief is not discharge clearance.');
}

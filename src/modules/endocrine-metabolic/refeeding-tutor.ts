import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RefeedingSnapshot } from '@platform/kernel/protocol';

export const REFEEDING_SOURCE_HREF = 'https://doi.org/10.1002/ncp.10474';
export const REFEEDING_ALTERNATIVE_SOURCE_HREF = 'https://doi.org/10.1111/1747-0080.70003';

/** Suggestions use accepted care and explicitly requested findings, never latent electrolytes. */
export function refeedingInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly refeeding?: RefeedingSnapshot;
}) {
  const patient = input.refeeding;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because, sourceHref: REFEEDING_SOURCE_HREF };
  if (patient.completeElectrolytesAtTick === null) return prompt('refeeding-electrolytes', true,
    'Arrange qualified care for phosphate, potassium, and magnesium together.',
    'The supplied decline involves all three. Phosphate-only care can be a useful partial action but does not address the whole problem. Urgent replacement does not wait for another laboratory result or administrative review.');
  if (patient.thiamineAtTick === null) return prompt('refeeding-thiamine', true,
    'Arrange qualified thiamine support while the other care continues.',
    'Administration is not documented and nutrition is already underway. This request has no invented immediate electrolyte effect and does not require a nutrition-review or support acknowledgment first.');
  if (patient.nutritionPlanAtTick === null) return prompt('refeeding-nutrition', true,
    'Coordinate an individualized nutrition plan without automatic advancement.',
    'Review enteral intake, IV dextrose, medication carriers, fluid balance, and ongoing needs. Guidance differs on feeding strategies; this request selects neither a fixed rate nor stopping all nutrition.');
  if (!patient.supportActive) return prompt('refeeding-support', true,
    'Coordinate qualified nutrition, medical, nursing, and pharmacy support.',
    'Electrolyte rescue, vitamin support, nutrition, and surveillance need shared ownership. These tasks are parallel, not prerequisites for urgent care.');
  if (patient.contextReviewedAtTick === null) return prompt('refeeding-context', true,
    'Review the feeding timeline, supplied findings, and alternative causes.',
    'Connect the recent nutrition restart with the prior intake and electrolyte trajectory. This selected concern does not make every low phosphate result a refeeding diagnosis.');
  if (patient.monitoringAtTick === null) return prompt('refeeding-monitor', true,
    'Arrange serial electrolyte and bedside surveillance.',
    'Follow phosphate, potassium, magnesium, renal function, fluid balance, and changing symptoms together. Accepted care and an older result do not prove sustained correction.');
  if (!patient.electrolyteResponseObserved && !patient.responseObserved && !patient.recurrentDeclineObserved) return patient.electrolyteDueInSeconds !== null
    ? prompt('refeeding-observe-electrolytes', false, 'Continue care and reassess whenever needed.',
      'The 30-minute teaching contrast is authored, not a required wait or predicted replacement response. Older laboratory findings remain historical.')
    : prompt('refeeding-reassess-electrolytes', true, 'Request fresh electrolytes and bedside findings.',
      'An accepted replacement request or elapsed checkpoint is not a new measurement. Compare all three electrolytes with the supplied findings.');
  if (patient.responseDueInSeconds !== null) return prompt('refeeding-observe-response', false,
    'Continue individualized nutrition care and repeated assessment.',
    'The combined-care checkpoint is authored, not permission to stop checking or advance feeding automatically. Early improvement may not be sustained.');
  if (!patient.responseObserved) return prompt('refeeding-reassess-response', true,
    'Request a fresh combined-care assessment.',
    'Review the new findings together with ongoing nutrition and supplementation needs. A partial response is not normalization or lasting safety.');
  return prompt('refeeding-handoff', false, 'Hand off continuing nutrition and electrolyte surveillance.',
    'Keep supplementation, thiamine, individualized advancement, fluid balance, cause review, and monitoring ownership together. Handoff ends the rehearsal, not the need for care.');
}

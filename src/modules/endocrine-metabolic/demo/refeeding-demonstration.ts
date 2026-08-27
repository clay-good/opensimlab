import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { RefeedingSnapshot } from '@platform/kernel/protocol';
import { supportsRefeeding, type RefeedingAction } from '../refeeding';

export const REFEEDING_DEMONSTRATION_VERSION = '0.1.0';
export function supportsRefeedingDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRefeeding(scenario);
}
export interface RefeedingDemonstrationStep {
  readonly id: string;
  readonly narration: string;
  readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly action?: RefeedingAction;
  readonly finished?: boolean;
}

/** Each care decision is confirmed by the learner; elapsed time never supplies a laboratory result. */
export function refeedingDemonstrationStep(patient?: RefeedingSnapshot): RefeedingDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Continuing nutrition, supplementation, and surveillance are handed off. Earlier choices and requested findings remain in the record. This ends the example, not the illness. Open the debrief to review the decisions.'
    : 'Instructor takeover ended this branch without predicting injury. Open the debrief or restart to rehearse a different response.', focus: 'actions', progress: 1, finished: true };
  if (patient.completeElectrolytesAtTick === null) return { id: 'electrolytes', narration: 'Start qualified care for all three supplied electrolyte abnormalities. Phosphate-only replacement is a valid partial action, but potassium and magnesium also need attention. No new laboratory click, support acknowledgment, or context review gates urgent care. No dose, route, or rate is selected.', focus: 'actions', progress: 0.05, action: 'replace-electrolytes' };
  if (patient.thiamineAtTick === null) return { id: 'thiamine', narration: 'Arrange qualified thiamine support because administration is not documented and nutrition is already underway. Care can proceed alongside electrolyte and nutrition review. This action produces no invented immediate biochemical effect.', focus: 'actions', progress: 0.15, action: 'thiamine' };
  if (patient.nutritionPlanAtTick === null) return { id: 'nutrition', narration: 'Request an individualized nutrition plan that prevents automatic advancement while severe abnormalities are addressed. Include enteral intake, IV dextrose, medication carriers, fluid balance, and ongoing needs. Guidance differs on feeding strategies: this request selects neither a universal rate nor stopping all nutrition.', focus: 'actions', progress: 0.25, action: 'review-nutrition' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate qualified nutrition, medical, nursing, and pharmacy ownership. These tasks appear one at a time for reading; in practice they are parallel and must not delay urgent care.', focus: 'actions', progress: 0.35, action: 'call-support' };
  if (patient.contextReviewedAtTick === null) return { id: 'context', narration: 'Review the supplied feeding timeline, prior findings, thiamine record, renal context, and alternative causes. The case rehearses an established feeding-associated concern, not a diagnostic rule for every low phosphate result.', focus: 'actions', progress: 0.45, action: 'review-context' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange serial electrolytes and bedside assessment, including fluid balance and changing symptoms. A replacement request and an older laboratory result cannot establish sustained response.', focus: 'actions', progress: 0.55, action: 'monitor' };
  if (!patient.electrolyteResponseObserved && !patient.responseObserved && !patient.recurrentDeclineObserved) return patient.electrolyteDueInSeconds !== null
    ? { id: 'electrolyte-observation', narration: 'Continue close assessment during qualified care. The 30-minute electrolyte contrast is authored, not predicted replacement kinetics or a required clinical wait. Pause freely; this phase sends no treatment or laboratory request.', focus: 'monitor', progress: 0.6 }
    : { id: 'electrolyte-reassessment', narration: 'Request fresh phosphate, potassium, magnesium, and bedside findings. This early teaching observation allows a later comparison; it is not a prerequisite for thiamine, nutrition review, or continuing treatment.', focus: 'actions', progress: 0.65, action: 'reassess' };
  if (patient.responseDueInSeconds !== null) return { id: 'response-observation', narration: 'Continue individualized nutrition and electrolyte care with repeated assessment. The 60-minute combined-care checkpoint is authored, not a safe interval without surveillance or permission to advance feeding automatically. Older laboratory results remain historical.', focus: 'monitor', progress: 0.75 };
  if (!patient.responseObserved) return { id: 'response-reassessment', narration: 'Request fresh electrolytes and bedside findings after the combined-care checkpoint. Compare the trajectory across all three values; accepted requests and elapsed time alone are not evidence of response.', focus: 'actions', progress: 0.85, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand off continuing electrolyte, vitamin, nutrition, fluid-balance, cause, and monitoring responsibilities. Partial improvement is not normalization, a universal feeding plan, durable safety, or discharge clearance.', focus: 'actions', progress: 0.95, action: 'handoff' };
}

import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { RenalHypocalcemiaSnapshot } from '@platform/kernel/protocol';
import { supportsRenalHypocalcemia, RENAL_HYPOCALCEMIA_CONTINUING_TICKS, RENAL_HYPOCALCEMIA_RECURRENCE_TICKS, type RenalHypocalcemiaAction } from '../hypocalcemia';

export const RENAL_HYPOCALCEMIA_DEMONSTRATION_VERSION = '0.1.0';
export function supportsRenalHypocalcemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalHypocalcemia(scenario);
}
export interface RenalHypocalcemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalHypocalcemiaAction; readonly finished?: boolean;
}
export function renalHypocalcemiaDemonstrationStep(patient?: RenalHypocalcemiaSnapshot): RenalHypocalcemiaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Continuing calcium, mineral care, monitoring, and longer-term follow-up are handed off. This ends the example, not the need for care or proof of durable recovery.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  if (patient.rescueAtTick === null) return { id: 'rescue', narration: 'Arrange qualified calcium rescue for the supplied measured low ionized calcium and symptoms. The adjusted total estimate does not override the measured result. Initial rescue does not wait for context review or another laboratory click.', focus: 'actions', progress: 0.04, action: 'rescue-calcium' };
  if (patient.continuingAtTick === null) return { id: 'continuing', narration: 'Deliver qualified continuing calcium care now. It is available immediately after rescue; do not wait for the 15-minute teaching response or symptom relief. The model selects no formulation, dose, or infusion rate.', focus: 'actions', progress: 0.13, action: 'continue-calcium' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate acute-care, renal, and nursing support while calcium care continues. Reading pauses do not impose a clinical sequence or delay treatment.', focus: 'actions', progress: 0.22, action: 'call-support' };
  if (patient.contextReviewedAtTick === null) return { id: 'context', narration: 'Review stage 4 CKD, recent denosumab, measured ionized calcium and pH, and the supplied total-calcium estimate. Keep the historical QTc distinct from the uncalibrated waveform; normal magnesium is not a replacement target in this lesson.', focus: 'actions', progress: 0.31, action: 'review-context' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange ionized-calcium, symptom, ECG, and bedside surveillance. Ionized-only and symptom-only checks keep separate timestamps and cannot refresh the full assessment.', focus: 'actions', progress: 0.40, action: 'monitor' };
  if (patient.mineralCareAtTick === null) return { id: 'mineral-care', narration: 'Coordinate qualified activated-vitamin-D and CKD mineral care. This is an expert-owned responsibility, not an automatic prescription or an immediate vitamin-D response in the model. It does not gate calcium treatment.', focus: 'actions', progress: 0.49, action: 'coordinate-mineral-care' };
  if (patient.followUpAtTick === null) return { id: 'follow-up', narration: 'Arrange calcium surveillance and specialist follow-up beyond this rehearsal after denosumab. Future medication decisions remain individualized; this action neither blindly stops nor restarts treatment.', focus: 'actions', progress: 0.58, action: 'arrange-follow-up' };
  if (patient.rescueDueInSeconds !== null) return { id: 'rescue-observation', narration: 'Continue care through the authored 15-minute rescue contrast. Reassess earlier whenever needed. The clock does not reveal a new ionized-calcium result or prove symptom relief.', focus: 'monitor', progress: 0.64 };
  const missedEarly = patient.continuingAtTick >= patient.rescueAtTick + RENAL_HYPOCALCEMIA_RECURRENCE_TICKS;
  if (patient.continuingDueInSeconds !== null && !patient.rescueResponseObserved && !patient.recurrenceObserved && !missedEarly) return { id: 'rescue-reassessment', narration: 'Request ionized calcium, symptoms, and bedside findings together. Distinguish a measured response from lasting control; a partial check cannot replace the full assessment.', focus: 'actions', progress: 0.70, action: 'reassess' };
  if (patient.continuingDueInSeconds !== null) return { id: 'continuing-observation', narration: 'Continue qualified calcium and surveillance through the authored 60-minute continuing-care contrast. Earlier results remain historical. Relief is not a reason to abandon ongoing care or follow-up.', focus: 'monitor', progress: 0.78 };
  const responseTick = Math.max(patient.rescueAtTick, patient.continuingAtTick) + RENAL_HYPOCALCEMIA_CONTINUING_TICKS;
  if (!patient.continuingResponseObserved || !patient.observation || patient.observation.atTick < responseTick) return { id: 'continuing-reassessment', narration: 'Request a fresh full ionized-calcium, symptom, and bedside assessment. Earlier teaching panels need not be recreated. Keep remaining symptoms and follow-up responsibilities visible.', focus: 'actions', progress: 0.86, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand off continuing calcium, mineral management, surveillance, and longer-term specialist review. Improved findings do not prove durable control, symptom resolution, or discharge readiness.', focus: 'actions', progress: 0.95, action: 'handoff' };
}

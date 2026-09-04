import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalHypermagnesemiaSnapshot } from '@platform/kernel/protocol';
import { supportsRenalHypermagnesemia, RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS,
  RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS, type RenalHypermagnesemiaAction } from '../hypermagnesemia';

export const RENAL_HYPERMAGNESEMIA_DEMONSTRATION_VERSION = '0.1.0';
export const RENAL_HYPERMAGNESEMIA_DEMONSTRATION_EARLY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export function supportsRenalHypermagnesemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalHypermagnesemia(scenario);
}
export interface RenalHypermagnesemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalHypermagnesemiaAction; readonly finished?: boolean;
}
export function renalHypermagnesemiaDemonstrationStep(patient?: RenalHypermagnesemiaSnapshot): RenalHypermagnesemiaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Breathing support, residual weakness, and continuing magnesium and renal review are handed off. This ends the example, not the need for care or proof of durable recovery.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  const removalReady = patient.removalAtTick !== null && patient.removalDueInSeconds === null;
  if (patient.breathingAtTick === null) return { id: 'breathing', narration: 'Arrange qualified support for inadequate breathing now. It is independent of calcium, removal, and administrative review. This coordinates support without prescribing an airway technique or ventilator settings.', focus: 'actions', progress: 0.03, action: 'support-breathing' };
  if (patient.calciumAtTick === null && !removalReady) return { id: 'calcium', narration: 'Arrange qualified calcium antagonism for the supplied toxicity. Its circulation benefit is temporary and does not remove magnesium or replace breathing support. No formulation, dose, or rate is selected.', focus: 'actions', progress: 0.10, action: 'calcium' };
  if (patient.removalAtTick === null) return { id: 'removal', narration: 'Deliver qualified magnesium-removal care independently of the calcium response. This is actual treatment, not consultation alone. The selected method, access, and settings remain individualized.', focus: 'actions', progress: 0.17, action: 'deliver-removal' };
  if (patient.stopMagnesiumAtTick === null) return { id: 'stop-magnesium', narration: 'Stop further magnesium exposure while care proceeds. Removing the source does not instantly remove the existing magnesium burden or prove that constipation has resolved.', focus: 'actions', progress: 0.24, action: 'stop-magnesium' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate acute-care, renal, and nursing ownership of breathing, circulation, removal, and follow-up. Support acknowledgment is not a prerequisite for urgent treatment.', focus: 'actions', progress: 0.31, action: 'call-support' };
  if (patient.contextReviewedAtTick === null) return { id: 'context', narration: 'Review known CKD, the magnesium-containing laxative, constipation, and reduced urine. Do not infer new renal clearance, acute kidney injury, or established bowel obstruction from the supplied history.', focus: 'actions', progress: 0.38, action: 'review-context' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange repeated magnesium, neuromuscular, breathing, circulation, and renal assessment. Better supported vital signs or reflexes are not a magnesium measurement.', focus: 'actions', progress: 0.45, action: 'monitor' };
  if (removalReady) {
    const requiredTick = Math.max(patient.removalAtTick + RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS,
      patient.breathingAtTick, patient.lastCalciumAtTick ?? 0);
    if (!patient.removalResponseObserved || !patient.observation || patient.observation.atTick < requiredTick) return {
      id: `removal-reassessment-${requiredTick}`, narration: 'Request current magnesium, neuromuscular, and bedside findings together. A ready checkpoint is not proof of removal response; earlier panels need not be recreated.',
      focus: 'actions', progress: 0.88, action: 'reassess' };
    return { id: 'handoff', narration: 'Hand off supported breathing, residual weakness, delivered removal, and ongoing review. An observed response does not authorize automatic withdrawal of support or discharge, and does not require unnecessary calcium.', focus: 'actions', progress: 0.96, action: 'handoff' };
  }
  const calciumTick = patient.lastCalciumAtTick!;
  if (patient.calciumDueInSeconds !== null) {
    const earlyRemaining = (RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS - RENAL_HYPERMAGNESEMIA_DEMONSTRATION_EARLY_TICKS) / TICKS_PER_SECOND;
    if (patient.calciumRequests === 1 && !patient.calciumResponseObserved) {
      if (patient.calciumDueInSeconds > earlyRemaining) return { id: `early-observation-${calciumTick}`, narration: 'Continue care through this authored five-minute observation contrast. It is not a clinical wait. The clock does not reveal a new magnesium or neuromuscular result.', focus: 'monitor', progress: 0.51 };
      return { id: `early-reassessment-${calciumTick}`, narration: 'Request a full assessment of magnesium, reflexes, weakness, breathing, and circulation. Distinguish the temporary circulation response from magnesium removal.', focus: 'actions', progress: 0.57, action: 'reassess' };
    }
    return { id: `calcium-observation-${calciumTick}`, narration: 'Continue breathing support and delivered removal with repeated review. The authored calcium-effect interval is not a redosing schedule; prior results remain historical.', focus: 'monitor', progress: patient.calciumRequests > 1 ? 0.81 : 0.63 };
  }
  const requiredTick = Math.max(calciumTick + RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS, patient.breathingAtTick);
  if (!patient.observation || patient.observation.atTick < requiredTick) return { id: `recurrence-reassessment-${calciumTick}`,
    narration: 'The finite calcium-effect interval has elapsed. Request current full findings before deciding about further antagonism. Recurrent clinical toxicity is not evidence of a magnesium rebound.',
    focus: 'actions', progress: 0.69, action: 'reassess' };
  return { id: `repeat-calcium-${calciumTick}`, narration: 'The fresh full assessment records recurrent toxicity while removal remains pending. Confirm a qualified, clinically reviewed repeat calcium request. This is an explicit decision, not automatic redosing at a preset interval.',
    focus: 'actions', progress: 0.75, action: 'calcium' };
}

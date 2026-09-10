import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalHypomagnesemiaSnapshot } from '@platform/kernel/protocol';
import { supportsRenalHypomagnesemia, RENAL_HYPOMAGNESEMIA_REPLETION_TICKS,
  type RenalHypomagnesemiaAction } from '../hypomagnesemia';

export const RENAL_HYPOMAGNESEMIA_DEMONSTRATION_VERSION = '0.1.0';
export const RENAL_HYPOMAGNESEMIA_DEMONSTRATION_EARLY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export function supportsRenalHypomagnesemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalHypomagnesemia(scenario);
}
export interface RenalHypomagnesemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalHypomagnesemiaAction; readonly finished?: boolean;
}
export function renalHypomagnesemiaDemonstrationStep(patient?: RenalHypomagnesemiaSnapshot): RenalHypomagnesemiaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'The pending repletion response, the medication decision, and continuing QT surveillance are handed off. This ends the example, not the need for care, and it does not prove the deficit is corrected.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Start continuous cardiac monitoring and qualified review of the supplied prolonged QT interval now. It is independent of repletion, of the medication decision, and of any repeat measurement. Watching the risk is not the same as reducing it.', focus: 'actions', progress: 0.04, action: 'monitor' };
  if (patient.numberReviewedAtTick === null) return { id: 'number', narration: 'Decide what the magnesium of 0.78 mmol/L means before acting on it. Inside a printed reference range is not the same as normal here: the serum concentration is sustained from body pools, so an in-range value does not exclude depletion. It does not establish depletion either.', focus: 'actions', progress: 0.12, action: 'review-number' };
  if (patient.repletionAtTick === null) return { id: 'repletion', narration: 'Request qualified magnesium repletion. Two potassium replacements have already been given without a recorded rise, and magnesium depletion increases distal potassium secretion. The route, product, rate, and any target stay individualized and are not selected here.', focus: 'actions', progress: 0.21, action: 'replace-magnesium' };
  if (patient.stopExposureAtTick === null) return { id: 'stop-exposure', narration: 'Stop the long-term acid blocker with the responsible team and record the decision for review. Stopping a suspected contributor is not an attribution and does not correct an accumulated deficit.', focus: 'actions', progress: 0.30, action: 'stop-exposure' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate acute-care, renal, pharmacy, and nursing ownership of repletion, the medication review, and continuing surveillance. Support acknowledgment is not a prerequisite for urgent care.', focus: 'actions', progress: 0.38, action: 'call-support' };
  if (patient.contextReviewedAtTick === null) return { id: 'context', narration: 'Review the long-term acid suppression, the months of loose stool, the two potassium replacements without a rise, and the low ionized calcium together. The supplied fractional excretion of 1.4% points away from renal loss; it names no cause.', focus: 'actions', progress: 0.46, action: 'review-context' };
  if (patient.repletionDueInSeconds !== null) {
    const earlyRemaining = (RENAL_HYPOMAGNESEMIA_REPLETION_TICKS - RENAL_HYPOMAGNESEMIA_DEMONSTRATION_EARLY_TICKS) / TICKS_PER_SECOND;
    if (patient.repletionDueInSeconds > earlyRemaining) return { id: `early-observation-${patient.repletionAtTick}`, narration: 'Continue monitoring through this authored five-minute observation contrast. It is not a clinical wait, and the clock reveals no new result.', focus: 'monitor', progress: 0.54 };
    if (!patient.observation) return { id: `early-reassessment-${patient.repletionAtTick}`, narration: 'Request a full assessment before the repletion checkpoint, so there is something to compare against. Look at the potassium, the ionized calcium, the QT interval and the bedside findings, not the magnesium value alone.', focus: 'actions', progress: 0.62, action: 'reassess' };
    return { id: `repletion-observation-${patient.repletionAtTick}`, narration: 'Continue monitoring and surveillance while repletion proceeds. The authored interval is not a dosing schedule, and the earlier result stays historical.', focus: 'monitor', progress: 0.74 };
  }
  const requiredTick = Math.max(patient.repletionAtTick! + RENAL_HYPOMAGNESEMIA_REPLETION_TICKS, patient.monitoringAtTick);
  if (!patient.repletionResponseObserved || !patient.observation || patient.observation.atTick < requiredTick) return {
    id: `repletion-reassessment-${requiredTick}`, narration: 'Request the potassium, the ionized calcium, the QT interval and the bedside findings together. Watch where the response actually appears: the magnesium value barely moves, and that is not evidence that repletion failed.',
    focus: 'actions', progress: 0.88, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand off the pending repletion response, the medication decision, and continuing QT surveillance. A potassium that has finally risen does not mean the total-body deficit is corrected or the cause established.', focus: 'actions', progress: 0.96, action: 'handoff' };
}

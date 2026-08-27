import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { SevereHypoglycemiaSnapshot } from '@platform/kernel/protocol';
import { HYPOGLYCEMIA_RECURRENCE_TICKS, supportsSevereHypoglycemia, type HypoglycemiaAction } from '../severe-hypoglycemia';

export const HYPOGLYCEMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHypoglycemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.2' && supportsSevereHypoglycemia(scenario);
}

export interface HypoglycemiaDemonstrationStep {
  readonly id: string;
  readonly narration: string;
  readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly action?: HypoglycemiaAction;
  readonly finished?: boolean;
}

/** An observed-state example: no backdated actions or predicted glucose values. */
export function hypoglycemiaDemonstrationStep(patient?: SevereHypoglycemiaSnapshot): HypoglycemiaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This worked example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'The repeat result, medication risks, and ongoing monitoring are handed off. This ends the example, not the real-world recurrence risk. Open the debrief to review the decisions.'
    : 'Instructor takeover ended this branch. No clinical outcome is predicted. Open the debrief or restart to rehearse the missed decision.', focus: 'actions', progress: 1, finished: true };
  if (patient.recurrenceActive && !patient.firstRecheckComplete) return { id: 'missed-checkpoint', narration: 'The first post-rescue checkpoint was missed. The example stops here rather than pretending it was observed. Take the controls and reassess the current patient.', focus: 'actions', progress: 0.5, finished: true };
  if (patient.glucoseMgPerDl === null) return { id: 'initial-check', narration: 'First, check the fictional glucose. Impaired alertness needs evidence and qualified help, not a diagnosis from appearance alone.', focus: 'actions', progress: 0.05, action: 'check-glucose' };
  if (!patient.supportActive) return { id: 'support', narration: 'Connect the low result with impaired alertness and call qualified support. Oral treatment is unsafe in the supplied assessment.', focus: 'actions', progress: 0.1, action: 'call-support' };
  if (patient.firstRescueAtTick === null) return { id: 'first-rescue', narration: 'Request the fixed qualified IV rescue pathway. This is a dose-free simulation, not drug preparation or IV technique.', focus: 'actions', progress: 0.15, action: 'iv-rescue' };
  if (!patient.firstRecheckComplete) return patient.recheckDueInSeconds !== null
    ? { id: 'first-observation', narration: 'Qualified rescue is underway. The example waits for the scheduled response and glucose check. Pause freely to read; the patient clock pauses too.', focus: 'monitor', progress: 0.25 }
    : { id: 'first-recheck', narration: 'Alertness has improved. Now obtain a fresh glucose result; the old number did not update just because the person looked better.', focus: 'actions', progress: 0.35, action: 'check-glucose' };
  if (!patient.medicationReviewed) return { id: 'record-review', narration: 'Review the medication and intake record before closing the episode. A response to rescue does not explain why the low occurred.', focus: 'actions', progress: 0.4, action: 'review-medications' };
  if (!patient.monitoringActive) return { id: 'monitoring', narration: 'Keep supervised monitoring active. The reviewed glimepiride, kidney disease, and poor intake leave recurrence work open.', focus: 'actions', progress: 0.45, action: 'continue-monitoring' };
  if (patient.secondRescueAtTick === null) {
    if (!patient.recurrenceActive) return { id: 'surveillance', narration: 'The first response is reassuring, not final. Continue surveillance with the medication and intake risks in view. No further action is sent while the example waits.', focus: 'monitor', progress: 0.5 };
    if (patient.measuredAtTick === null || patient.measuredAtTick < patient.firstRescueAtTick + HYPOGLYCEMIA_RECURRENCE_TICKS) return { id: 'recurrence-check', narration: 'Sweating and drowsiness have returned. Check again rather than relying on the earlier result.', focus: 'actions', progress: 0.65, action: 'check-glucose' };
    return { id: 'repeat-rescue', narration: 'The new low result and impaired alertness lead to repeat qualified rescue. Keep the swallowing-safety and monitoring boundaries intact.', focus: 'actions', progress: 0.7, action: 'iv-rescue' };
  }
  if (!patient.secondRecheckComplete) return patient.recheckDueInSeconds !== null
    ? { id: 'second-observation', narration: 'Wait for the repeat-rescue observation period. Another improvement in alertness will still need a new glucose check.', focus: 'monitor', progress: 0.8 }
    : { id: 'second-recheck', narration: 'Recheck after repeat rescue. This is a second observation, not a reuse of the first reassuring result.', focus: 'actions', progress: 0.9, action: 'check-glucose' };
  return { id: 'handoff', narration: 'Hand off ongoing supervised monitoring and medication, kidney, nutrition, and recurrence-risk ownership. This example does not establish safe discharge.', focus: 'actions', progress: 0.95, action: 'handoff' };
}

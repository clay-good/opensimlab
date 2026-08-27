import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { RenalHyperkalemiaSnapshot } from '@platform/kernel/protocol';
import { supportsRenalHyperkalemia, type RenalHyperkalemiaAction } from '../hyperkalemia';

export const RENAL_HYPERKALEMIA_DEMONSTRATION_VERSION = '0.1.0';
export function supportsRenalHyperkalemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalHyperkalemia(scenario);
}
export interface RenalHyperkalemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalHyperkalemiaAction; readonly finished?: boolean;
}

export function renalHyperkalemiaDemonstrationStep(patient?: RenalHyperkalemiaSnapshot): RenalHyperkalemiaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Treatment and continuing potassium, glucose, and ECG surveillance are handed off. The example ends without claiming durable control or discharge readiness.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  if (patient.calciumAtTick === null) return { id: 'calcium', narration: 'Arrange qualified calcium cardioprotection for the supplied conduction change. This does not lower potassium. Urgent calcium, shifting, and removal can proceed independently; these reading pauses do not prescribe clinical sequencing.', focus: 'actions', progress: 0.04, action: 'calcium' };
  if (patient.shiftAtTick === null) return { id: 'shift', narration: 'Arrange qualified potassium-shifting treatment with glucose precautions. This selects no fixed dose or route and does not remove potassium from the body. Do not wait for administrative review or a second laboratory click.', focus: 'actions', progress: 0.12, action: 'shift' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate acute-care and kidney support while urgent treatment continues. Shared ownership is important, but the acknowledgment is not a gate to treatment.', focus: 'actions', progress: 0.20, action: 'call-support' };
  if (patient.contextReviewedAtTick === null) return { id: 'context', narration: 'Review the confirmed sample, chronic kidney disease, acute illness, volume status, and medications. The supplied findings are historical context, not evolving renal-clearance predictions.', focus: 'actions', progress: 0.28, action: 'review-context' };
  if (patient.removalPlanAtTick === null) return { id: 'plan-removal', narration: 'Coordinate an individualized potassium-removal plan. A plan is not treatment delivery. This example specifies neither automatic dialysis nor one removal modality for every patient.', focus: 'actions', progress: 0.36, action: 'plan-removal' };
  if (patient.removalAtTick === null) return { id: 'deliver-removal', narration: 'Confirm qualified removal treatment is delivered. This accepted action is distinct from planning and is available independently. Its later response must still be measured.', focus: 'actions', progress: 0.44, action: 'deliver-removal' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange serial potassium, ECG, and blood-glucose surveillance. Cardioprotection is temporary; a better ECG or glucose-only check cannot establish potassium control.', focus: 'actions', progress: 0.52, action: 'monitor' };
  if (!patient.shiftResponseObserved && !patient.removalResponseObserved && !patient.reboundObserved
    && patient.removalDueInSeconds !== null) return patient.shiftDueInSeconds !== null
    ? { id: 'shift-observation', narration: 'Continue treatment and assessment. The 30-minute contrast is authored, not a required clinical wait. Pause freely; new laboratory findings do not appear automatically.', focus: 'monitor', progress: 0.60 }
    : { id: 'shift-reassessment', narration: 'Request potassium, glucose, ECG, and bedside findings together. The early response is useful for comparison; it does not prove durable control or make an earlier assessment a treatment prerequisite.', focus: 'actions', progress: 0.68, action: 'reassess' };
  if (patient.removalDueInSeconds !== null) return { id: 'removal-observation', narration: 'Continue delivered removal and repeated surveillance. This 60-minute response is fictional, not a universal removal rate. Partial ECG or glucose checks would leave the older potassium finding unchanged.', focus: 'monitor', progress: 0.76 };
  if (!patient.removalResponseObserved) return { id: 'removal-reassessment', narration: 'Request fresh full findings after the later authored response. Compare potassium with the earlier assessment and keep glucose and ECG surveillance active.', focus: 'actions', progress: 0.84, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand off delivered treatment, current findings, recurrence risk, and explicit follow-up ownership. No calcium request, improved ECG, or single potassium result proves durable safety.', focus: 'actions', progress: 0.94, action: 'handoff' };
}

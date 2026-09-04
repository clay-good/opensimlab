import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { RenalHypokalemiaSnapshot } from '@platform/kernel/protocol';
import { supportsRenalHypokalemia, type RenalHypokalemiaAction } from '../hypokalemia';
import { renalHypokalemiaResponseWasObserved } from '../renal-hypokalemia-tutor';

export const RENAL_HYPOKALEMIA_DEMONSTRATION_VERSION = '0.1.0';
export function supportsRenalHypokalemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalHypokalemia(scenario);
}
export interface RenalHypokalemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalHypokalemiaAction; readonly finished?: boolean;
}

export function renalHypokalemiaDemonstrationStep(patient?: RenalHypokalemiaSnapshot): RenalHypokalemiaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Replacement, ongoing losses, and continuing electrolyte surveillance are handed off. This ends the example without claiming normalization or durable recovery.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  if (patient.potassiumAtTick === null) return { id: 'potassium', narration: 'Arrange qualified potassium replacement. Potassium and magnesium care are independent and available immediately. Reading pauses do not impose clinical sequencing, a magnesium-first gate, or a dose, route, or rate.', focus: 'actions', progress: 0.05, action: 'potassium' };
  if (patient.magnesiumAtTick === null) return { id: 'magnesium', narration: 'Address magnesium depletion alongside potassium care. A partial potassium rise is not a complete response. Neither treatment needs a new laboratory click or support acknowledgment first.', focus: 'actions', progress: 0.15, action: 'magnesium' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate acute-care, nursing, and pharmacy ownership while urgent replacement continues. These parallel responsibilities appear one at a time for reading.', focus: 'actions', progress: 0.25, action: 'call-support' };
  if (patient.contextReviewedAtTick === null) return { id: 'context', narration: 'Review the supplied electrolyte results, diarrhea, hydrochlorothiazide exposure, and kidney context. The historical creatinine does not establish a dynamic clearance prediction.', focus: 'actions', progress: 0.35, action: 'review-context' };
  if (patient.lossManagementAtTick === null) return { id: 'losses', narration: 'Deliver qualified replacement of ongoing losses and management of contributors. This is active care rather than planning alone. It does not instantly stop diarrhea or select a universal replacement prescription.', focus: 'actions', progress: 0.45, action: 'manage-losses' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange serial electrolyte, ECG, and bedside surveillance. A potassium-only check leaves magnesium historical, and an ECG-only check refreshes neither electrolyte.', focus: 'actions', progress: 0.55, action: 'monitor' };
  if (!patient.potassiumResponseObserved && !patient.magnesiumResponseObserved && !patient.responseObserved
    && !patient.recurrenceObserved && patient.responseDueInSeconds !== null) {
    return patient.potassiumDueInSeconds !== null || patient.magnesiumDueInSeconds !== null
      ? { id: 'partial-observation', narration: 'Continue treatment and assessment. The 30-minute contrasts are fictional, not safe waiting intervals. No new laboratory result appears automatically; pause freely.', focus: 'monitor', progress: 0.60 }
      : { id: 'partial-reassessment', narration: 'Request potassium, magnesium, ECG, and bedside findings together. This partial-response observation supports comparison; it is not mandatory before a later full assessment or a prerequisite for care.', focus: 'actions', progress: 0.68, action: 'reassess' };
  }
  if (patient.responseDueInSeconds !== null) return { id: 'response-observation', narration: 'Continue replacement, ongoing-loss care, and surveillance. The 60-minute combined contrast is authored, not predicted kinetics. Earlier findings remain historical while you read or pause.', focus: 'monitor', progress: 0.76 };
  if (!renalHypokalemiaResponseWasObserved(patient)) return { id: 'response-reassessment', narration: 'Request fresh full findings after the later response. If recurrent depletion occurred, earlier improvement remains historical and cannot stand in for a new assessment after recovery care.', focus: 'actions', progress: 0.84, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand off replacement, ongoing losses, repeated electrolyte and ECG checks, and explicit follow-up ownership. Improvement does not establish normalization or permission to stop surveillance.', focus: 'actions', progress: 0.94, action: 'handoff' };
}

import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { RenalHypernatremiaSnapshot } from '@platform/kernel/protocol';
import { supportsRenalHypernatremia, RENAL_HYPERNATREMIA_COMBINED_TICKS, type RenalHypernatremiaAction } from '../hypernatremia';

export const RENAL_HYPERNATREMIA_DEMONSTRATION_VERSION = '0.1.0';
export function supportsRenalHypernatremiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalHypernatremia(scenario);
}
export interface RenalHypernatremiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalHypernatremiaAction; readonly finished?: boolean;
}
export function renalHypernatremiaDemonstrationStep(patient?: RenalHypernatremiaSnapshot): RenalHypernatremiaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'Continuing water replacement, loss management, safe access, and surveillance are handed off. This ends the example, not the need for care or proof of durable recovery.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  if (patient.volumeAtTick === null) return { id: 'volume', narration: 'Arrange qualified restoration of circulation for the supplied hypotension. Treatment does not wait for review, support acknowledgment, or another laboratory click. This lesson selects no dose or fluid rate.', focus: 'actions', progress: 0.04, action: 'restore-volume' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate qualified acute-care, specialist, and nursing support while circulation is addressed. Reading pauses do not impose a clinical delay.', focus: 'actions', progress: 0.12, action: 'call-support' };
  if (patient.contextReviewedAtTick === null) return { id: 'context', narration: 'Review diarrhea, physical water-access barriers, unknown sodium duration, and the supplied concentrated urine. These do not establish AVP deficiency or exclude every other cause.', focus: 'actions', progress: 0.20, action: 'review-context' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange serial sodium, fluid-balance, and bedside surveillance. Sodium-only and fluid-balance-only checks retain separate timestamps; neither refreshes the full assessment.', focus: 'actions', progress: 0.28, action: 'monitor' };
  if (!patient.circulationRestored) return { id: 'volume-observation', narration: 'Continue qualified care through this authored 15-minute circulation contrast. This is not a mandatory clinical wait. New sodium and fluid-balance findings require assessment.', focus: 'monitor', progress: 0.34 };
  if (!patient.volumeObserved && patient.waterAtTick === null) return { id: 'volume-reassessment', narration: 'Request a full circulation, sodium, and fluid-balance assessment. Improved circulation is distinct from correction of the water deficit. This reading pause is not a prerequisite for manual water or ongoing-loss care.', focus: 'actions', progress: 0.40, action: 'reassess' };
  if (patient.waterAtTick === null) return { id: 'water', narration: 'Arrange qualified individualized water replacement after circulation is restored. Unknown sodium duration requires ongoing review; the model prescribes no dose, route, or correction rate.', focus: 'actions', progress: 0.49, action: 'replace-water' };
  if (patient.lossManagementAtTick === null) return { id: 'losses', narration: 'Deliver qualified ongoing-loss replacement and contributor management. This addresses continued losses; it does not instantly stop diarrhea. Loss care could also precede water replacement after circulation improves.', focus: 'actions', progress: 0.58, action: 'manage-losses' };
  if (patient.waterAccessAtTick === null) return { id: 'access', narration: 'Deliver safe individualized water access and assistance. Respect the patient’s ability and an appropriate route; do not force oral intake. Access support was available from the start and does not gate the modeled sodium response.', focus: 'actions', progress: 0.67, action: 'assist-water-access' };
  if (patient.combinedDueInSeconds !== null) return { id: 'combined-observation', narration: 'Continue water and ongoing-loss care through the authored four-hour combined contrast. Reassess earlier whenever needed. Earlier requested results stay historical; elapsed time does not reveal new sodium.', focus: 'monitor', progress: 0.75 };
  const responseTick = Math.max(patient.waterAtTick, patient.lossManagementAtTick) + RENAL_HYPERNATREMIA_COMBINED_TICKS;
  if (!patient.combinedResponseObserved || !patient.observation || patient.observation.atTick < responseTick) return { id: 'combined-reassessment', narration: 'Request fresh sodium, fluid balance, and bedside findings together. A partial check cannot replace this current full assessment; earlier panels need not be recreated.', focus: 'actions', progress: 0.86, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand off ongoing replacement, losses, safe water access, and serial review. Better circulation and a sodium decline do not establish normalization or discharge readiness.', focus: 'actions', progress: 0.95, action: 'handoff' };
}

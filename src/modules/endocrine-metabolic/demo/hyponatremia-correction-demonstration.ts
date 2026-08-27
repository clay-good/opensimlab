import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { HyponatremiaCorrectionSnapshot } from '@platform/kernel/protocol';
import { supportsHyponatremiaCorrection, type HyponatremiaCorrectionAction } from '../hyponatremia-correction';

export const HYPONATREMIA_CORRECTION_DEMONSTRATION_VERSION = '0.1.0';
export function supportsHyponatremiaCorrectionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHyponatremiaCorrection(scenario);
}
export interface HyponatremiaCorrectionDemonstrationStep {
  readonly id: string;
  readonly narration: string;
  readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly action?: HyponatremiaCorrectionAction;
  readonly finished?: boolean;
}

/** Every decision waits for the learner; all numerical results come from requested observations. */
export function hyponatremiaCorrectionDemonstrationStep(patient?: HyponatremiaCorrectionSnapshot): HyponatremiaCorrectionDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses your practice controls and clock.', focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'The correction record and continuing risks are handed off. The observed peak stays in the record. This ends the example, not the illness or surveillance. Open the debrief to review your decisions.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse a different response.', focus: 'actions', progress: 1, finished: true };
  if (patient.aquaresisObserved && patient.waterLossControlAtTick === null) return { id: 'control', narration: 'Respond to the observed water diuresis with qualified water-loss management. Stopped hypertonic saline does not prevent further correction from water loss. No dose is selected; support acknowledgment and risk review must not delay a response to an observed breach.', focus: 'actions', progress: 0.55, action: 'control-water-loss' };
  if (patient.overcorrectionObserved && patient.reloweringAtTick === null) return { id: 'relower', narration: 'The requested result exceeded the selected high-risk ceiling from the original sodium of 106. Request expert-directed relowering as well as water-loss control; either request may come first. The earlier rise remains in the learning record. No hypotonic-fluid or desmopressin dose is selected.', focus: 'actions', progress: 0.6, action: 'relower' };
  if (patient.riskReviewedAtTick === null) return { id: 'risk', narration: 'Begin with the original correction window. Sodium rose from 106 to the supplied post-rescue 111 over one hour; tick zero does not reset that rise. Review malnutrition, alcohol-use disorder, low potassium, unknown duration, and possible thiazide or intake contributions. This selected high-risk plan is not a universal prescription.', focus: 'actions', progress: 0.05, action: 'review-risk' };
  if (!patient.supportActive) return { id: 'support', narration: 'Coordinate qualified specialist and nursing support around one correction record. Potassium, nutrition, and cause review remain part of care. These parallel responsibilities are shown one at a time; urgent responses do not wait for an acknowledgment.', focus: 'actions', progress: 0.15, action: 'call-support' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange serial sodium, urine-output, and neurologic surveillance. The seizure has stopped and hypertonic saline is off, but those facts do not establish controlled correction. Each new result must be requested.', focus: 'actions', progress: 0.25, action: 'monitor' };
  if (!patient.aquaresisObserved) return patient.aquaresisDueInSeconds !== null
    ? { id: 'observation', narration: 'Continue surveillance through the next authored observation checkpoint. This teaching interval is not a safe period without checks. Reassess whenever needed, even without new symptoms. Pause freely; this phase sends no treatment.', focus: 'monitor', progress: 0.35 }
    : { id: 'reassessment', narration: 'Request a fresh sodium and urine-output assessment. Compare it with the original 106 and the full correction window; an older result cannot reveal the present sodium.', focus: 'actions', progress: 0.45, action: 'reassess' };
  if (patient.responseDueInSeconds !== null) return { id: 'response-observation', narration: 'Continue qualified care and frequent reassessment through the authored 60-minute reassessment checkpoint. This is not proof of response, treatment kinetics, or a safe waiting interval. Earlier results and the observed peak remain historical evidence, not a live measurement.', focus: 'monitor', progress: 0.7 };
  if (!patient.responseObserved) return { id: 'response-reassessment', narration: 'Request a new sodium, urine-output, and bedside assessment. Review the original baseline, total rise, and highest observed sodium together. A care request alone cannot establish its effect or lasting safety.', focus: 'actions', progress: 0.85, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand off the original correction window, highest supplied or requested sodium, prior choices, qualified potassium and cause care, and 24–48-hour sodium, urine, and neurologic surveillance. Partial stabilization is not discharge clearance or proven prevention of osmotic demyelination.', focus: 'actions', progress: 0.95, action: 'handoff' };
}

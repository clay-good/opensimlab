import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsApeSupport, type ApeSupportAction, type ApeSupportProgress,
} from '../acute-pulmonary-edema-respiratory-support-reassessment';

export const APE_SUPPORT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsApeSupportDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsApeSupport(scenario);
}

export interface ApeSupportDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ApeSupportAction; readonly finished?: boolean;
}

/**
 * The worked example for a patient failing on treatment that worked.
 *
 * Her pressure came down and her breathing gave out. This example examines
 * nobody, acquires and reads no gas or image, touches no noninvasive support or
 * setting, and selects no drug or airway.
 */
export function apeSupportDemonstrationStep(
  patient?: ApeSupportProgress,
): ApeSupportDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on tiring through support that is already running, with the right initial treatment behind her and the precipitant still unknown. Nothing was proven and nothing was chosen. This ends the example, not the deterioration.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-ape-initial-care-and-trajectory',
      narration: 'Separate what the team did from where she has ended up. Thirty minutes ago: abrupt dyspnea, orthopnea, crackles, a raised JVP, 196/118 and a room-air saturation of 82%, with the reports supporting hypertensive acute pulmonary edema. The experienced team sat her up, started monitored noninvasive support with titrated oxygen, and gave a loop diuretic and a pressure-appropriate vasodilator. That is the right care, delivered by someone else, and her pressure has come down to 108/68. The question is what the rest of her has done since.' };
  }
  if (patient.failureAtTick === null) {
    return { id: 'failure', focus: 'monitor', progress: 0.32, action: 'review-ape-progressive-respiratory-failure',
      narration: 'Name the failure from the mentation, the effort and the gas together. Drowsy but rousable, single words, shallow effort, a respiratory rate of 34 that is now 12, a saturation of 86% on an authored FiO₂ of 0.60, an end-tidal CO₂ of 60 on a continuous waveform, and a gas of pH 7.18, PaCO₂ 68, PaO₂ 58. The rate fell because she is tiring, not because she is better. That is progressive hypoxemic, hypercapnic, acidemic failure occurring during noninvasive support that is reportedly running — which is the specific situation the support does not fix.' };
  }
  if (patient.wholePatientAtTick === null) {
    return { id: 'whole-patient', focus: 'monitor', progress: 0.55, action: 'review-ape-pressure-perfusion-congestion-and-causes',
      narration: 'Read the pressure and the congestion together, and keep the precipitants open. A pressure of 196/118 that is now 108/68 with warm perfusion and a two-second refill is a treated afterload rather than shock — nothing here establishes shock or arrest. The crackles and the bilateral edema findings persist, so the congestion has not resolved either. Ischemia, an arrhythmia, acute valve or other mechanical disease, infection, pulmonary embolism, the treatment effect itself, and renal and medication factors all stay open as precipitants, and none of the current reports permanently excludes a change.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.78, action: 'activate-ape-airway-capable-escalation',
      narration: 'Call respiratory, critical-care and airway-capable help now. This is escalation for a failure that has already been established rather than a request to help decide. Noninvasive support is reportedly running and she is deteriorating through it, which is the indication; the people who might have to take over her ventilation should be present rather than summoned once the decision is unavoidable.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-ape-respiratory-support-reassessment',
    narration: 'Nothing here establishes a device, a setting, a drug, a procedure, a disposition or an outcome. Hand off the trajectory through correct initial care, the failure as the mentation, effort, oxygenation, ventilation and acid-base evidence describe it, the pressure and congestion picture, the precipitants still open, and the airway-capable help that is now involved.' };
}

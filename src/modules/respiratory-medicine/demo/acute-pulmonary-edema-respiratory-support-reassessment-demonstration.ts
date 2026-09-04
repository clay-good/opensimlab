import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsApeSupport, type ApeSupportAction, type ApeSupportProgress,
} from '../acute-pulmonary-edema-respiratory-support-reassessment';
import { apeSupportInlinePrompt } from '../tutor/acute-pulmonary-edema-respiratory-support-reassessment-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: ApeSupportProgress): string {
  const prompt = apeSupportInlinePrompt('guided', { scenarioVersion: '0.1.0', apeSupport: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

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
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on tiring through support that is already running, with the right initial treatment behind her and the precipitant still unknown. Nothing was proven and nothing was chosen. This ends the example, not the deterioration.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-ape-initial-care-and-trajectory',
      narration: narrate(patient) };
  }
  if (patient.failureAtTick === null) {
    return { id: 'failure', focus: 'monitor', progress: 0.32, action: 'review-ape-progressive-respiratory-failure',
      narration: narrate(patient) };
  }
  if (patient.wholePatientAtTick === null) {
    return { id: 'whole-patient', focus: 'monitor', progress: 0.55, action: 'review-ape-pressure-perfusion-congestion-and-causes',
      narration: narrate(patient) };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.78, action: 'activate-ape-airway-capable-escalation',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-ape-respiratory-support-reassessment',
    narration: 'Nothing here establishes a device, a setting, a drug, a procedure, a disposition or an outcome. Hand off the trajectory through correct initial care, the failure as the mentation, effort, oxygenation, ventilation and acid-base evidence describe it, the pressure and congestion picture, the precipitants still open, and the airway-capable help that is now involved.' };
}

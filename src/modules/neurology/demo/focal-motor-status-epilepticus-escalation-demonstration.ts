import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsFocalMotorStatus, type FocalMotorStatusAction, type FocalMotorStatusProgress,
} from '../focal-motor-status-epilepticus-escalation';
import { focalMotorStatusInlinePrompt } from '../tutor/focal-motor-status-epilepticus-escalation-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: FocalMotorStatusProgress): string {
  const prompt = focalMotorStatusInlinePrompt('guided', { scenarioVersion: '0.1.0', focalMotorStatus: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const FOCAL_MOTOR_STATUS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsFocalMotorStatusDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsFocalMotorStatus(scenario);
}

export interface FocalMotorStatusDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: FocalMotorStatusAction; readonly finished?: boolean;
}

/**
 * The worked example for a seizure that got quieter without stopping.
 *
 * The room feels better after the rescue care and that feeling is the hazard.
 * Stereotyped left face and arm clonus is still running and she has not come
 * back, which is one continuous event at eighteen minutes rather than a seizure
 * that ended. So this example says that before anything else moves, escalates
 * on the visible movement rather than on an EEG that does not exist here, and
 * runs the airway, the glucose and the search for a cause alongside rather than
 * instead. It times no seizure, acquires no EEG, and selects no drug, dose,
 * route, oxygen, or airway.
 */
export function focalMotorStatusDemonstrationStep(
  patient?: FocalMotorStatusProgress,
): FocalMotorStatusDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on still seizing, with everybody who needs to know already knowing. Nothing was proven and nothing was excluded — not the cause, not a treatment effect, not whether the movement stops. This ends the example, not the seizure.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-focal-motor-status-clock-semiology-recovery-and-whole-patient',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-neurology-focal-motor-status-despite-reduced-convulsions',
      narration: narrate(patient) };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.46, action: 'activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'monitor', progress: 0.64, action: 'review-neurology-focal-motor-status-airway-glucose-causes-and-injury-boundary',
      narration: narrate(patient) };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-focal-motor-status-strict-later-visible-motor-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s minute-26 report. The interval is a contrast rather than a required wait, and nothing here says what any individual seizure does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-focal-motor-status-recovery-cause-and-active-risk',
    narration: 'At minute 26 the visible left face and arm clonus continues and meaningful recovery has not returned. No EEG result, no causal diagnosis, no treatment effect and no movement cessation is authored, so nothing here is a claim that anything worked. Hand off the active seizure, the recovery question, the airway, the cause, the recurrence risk, the rescue choice and whether an EEG is needed.' };
}

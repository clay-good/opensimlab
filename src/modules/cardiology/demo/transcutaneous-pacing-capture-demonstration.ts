import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsTranscutaneousPacingCapture, type TranscutaneousPacingCaptureAction,
  type TranscutaneousPacingCaptureProgress,
} from '../transcutaneous-pacing-capture';

export const TRANSCUTANEOUS_PACING_CAPTURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsTranscutaneousPacingCaptureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsTranscutaneousPacingCapture(scenario);
}

export interface TranscutaneousPacingCaptureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: TranscutaneousPacingCaptureAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a screen that looks like it is working.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. There is no unordered lane here and so no choice to make: four
 * beats in the only order the engine accepts. It examines nobody, palpates no
 * pulse, acquires or interprets no ECG, monitoring, laboratory or imaging data,
 * places no pads, operates no pacer, selects no rate, output, current, pulse
 * width, energy, drug, dose, sedation or modality, delivers no pacing, CPR or
 * treatment, performs no procedure, determines no disposition, and predicts no
 * outcome.
 */
export function transcutaneousPacingCaptureDemonstrationStep(
  patient?: TranscutaneousPacingCaptureProgress,
): TranscutaneousPacingCaptureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The example ends inside a resuscitation that is still running, with a pacer still capturing and a patient still without a pulse. You will not be told whether she got her circulation back, and that is deliberate: the whole lesson is about not reading an ending off a screen. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.14, action: 'reconcile-transcutaneous-pacing-electrical-and-mechanical-capture',
      narration: 'The pacer is working. She has no pulse. Both of those are true, and only one of them is on the screen. A sixty-eight-year-old woman with reported complete AV block became confused, cool and poorly perfused at a rate of 24 with a pressure of 70/40, and an experienced team started transcutaneous pacing. The fixed ten-second report shows stimuli at 70, each followed by a broad QRS and a distinct T wave — that is real electrical capture and not artifact or an afterpotential. Then she became unresponsive with agonal breaths, and the fixed assessment reports no carotid or femoral pulse, a flat trace on an arterial line that is already in, a nonpulsatile pleth and an unobtainable pressure. Four independent signals say there is no circulation. Electrical capture means the myocardium depolarised; it says nothing about whether it ejected. This is pulseless electrical activity, not a bradycardia that still needs tuning, and everything depends on saying so.' };
  }
  if (patient.pulselessResponseAtTick === null) {
    return { id: 'pulseless', focus: 'actions', progress: 0.42, action: 'activate-transcutaneous-pacing-pulseless-response',
      narration: 'Start the arrest. Nothing else happens until that is recorded, and nothing else should. This is nonshockable arrest care, uninterrupted, and it begins now — not after somebody has increased the output, checked the pads, or worked out why. The reason the engine refuses everything else first is the specific harm this lesson is built around: a monitor showing captured paced complexes at 70 looks like a treated patient, and the minutes a team spends adjusting a pacer that is already capturing are minutes without compressions. The paced QRS complexes are not circulation. You deliver no CPR, place no pads, operate no pacer and select no rate, output, current, pulse width, drug or dose; what you record is that the pulseless pathway is open.' };
  }
  if (patient.causesBridgeAtTick === null) {
    return { id: 'causes', focus: 'monitor', progress: 0.7, action: 'review-transcutaneous-pacing-open-causes-and-bridge',
      narration: 'Now think about why — while the resuscitation continues, not instead of it. The open list is metabolic, ischemic, mechanical, myocardial, medication, conduction, electrode, connection, device and measurement, and it stays a list: nothing here assigns a mechanism, and the honest position is that a patient who lost her circulation while being paced adequately has a reason nobody has found yet. The bridge question belongs here too — what pacing she would need after this, if there is an after — and it is a question rather than a plan, because no device, drug or procedure is selected in this lesson. The word that matters is while. This review runs alongside uninterrupted arrest care and never pauses it.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-transcutaneous-pacing-reassessment',
    narration: 'Hand over a resuscitation that is still running, and resist finishing the story. What goes across is the capture evidence — electrical present, mechanical absent, and how each was established — the active resuscitation, the causes still open, the pacing-bridge question and who owns it. What is deliberately not here is the ending: return of circulation, her perfusion afterwards, her neurologic status, her disposition, her prognosis and her outcome are all unreported, and that is a choice rather than an omission. A lesson about not mistaking a screen for a patient should not close by telling you how the patient did. Nothing here examines her, palpates a pulse, acquires or interprets ECG, monitoring, laboratory or imaging data, places pads, operates a pacer, selects a rate, output, current, pulse width, energy, drug, dose, sedation or modality, delivers pacing, CPR or treatment, performs a procedure, determines disposition or prognosis, or predicts outcome.' };
}

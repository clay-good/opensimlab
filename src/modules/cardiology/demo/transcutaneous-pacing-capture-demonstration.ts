import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsTranscutaneousPacingCapture, type TranscutaneousPacingCaptureAction,
  type TranscutaneousPacingCaptureProgress,
} from '../transcutaneous-pacing-capture';
import { transcutaneousPacingCaptureInlinePrompt } from '../tutor/transcutaneous-pacing-capture-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: TranscutaneousPacingCaptureProgress): string {
  const prompt = transcutaneousPacingCaptureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

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
      narration: narrate(patient) };
  }
  if (patient.pulselessResponseAtTick === null) {
    return { id: 'pulseless', focus: 'actions', progress: 0.42, action: 'activate-transcutaneous-pacing-pulseless-response',
      narration: narrate(patient) };
  }
  if (patient.causesBridgeAtTick === null) {
    return { id: 'causes', focus: 'monitor', progress: 0.7, action: 'review-transcutaneous-pacing-open-causes-and-bridge',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-transcutaneous-pacing-reassessment',
    narration: narrate(patient) };
}

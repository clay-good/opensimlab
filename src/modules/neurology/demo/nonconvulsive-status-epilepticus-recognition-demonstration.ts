import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsNcse, type NcseAction, type NcseProgress,
} from '../nonconvulsive-status-epilepticus-recognition';
import { ncseInlinePrompt } from '../tutor/nonconvulsive-status-epilepticus-recognition-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: NcseProgress): string {
  const prompt = ncseInlinePrompt('guided', { scenarioVersion: '0.1.0', ncse: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const NCSE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNcseDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNcse(scenario);
}

export interface NcseDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NcseAction; readonly finished?: boolean;
}

/**
 * The worked example for a seizure with nothing to watch.
 *
 * This is the mirror of the focal-motor lesson next door: there the movement
 * was visible and waiting for an EEG was the error, and here there is nothing
 * to see, so the error runs the other way. This example refuses both halves —
 * it names a suspicion without making a clinical diagnosis, and it treats the
 * urgent EEG as the boundary rather than an afterthought. What raises the
 * suspicion is the shape of the fluctuation: speech arrest in seconds, gaze
 * that deviates and returns, the same events for ninety-five minutes without a
 * return to baseline. It places and reads no EEG, diagnoses nothing, and
 * selects no drug, dose, route, oxygen, or airway.
 */
export function ncseDemonstrationStep(
  patient?: NcseProgress,
): NcseDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on looking exactly as she did, and now known to be seizing. Nothing was proven and nothing was excluded — not the cause, not the treatment, not whether the recording changes. This ends the example, not the status.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient',
      narration: narrate(patient) };
  }
  if (patient.suspicionAtTick === null) {
    return { id: 'suspicion', focus: 'actions', progress: 0.26, action: 'recognize-neurology-ncse-suspicion-and-urgent-eeg-boundary-without-clinical-diagnosis',
      narration: narrate(patient) };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.46, action: 'activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership',
      narration: narrate(patient) };
  }
  if (patient.alternativesAtTick === null) {
    return { id: 'alternatives', focus: 'monitor', progress: 0.64, action: 'review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives',
      narration: narrate(patient) };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory',
      narration: 'Let the authored interval pass and read the qualified neurophysiologist’s recording report. The interval is a contrast rather than a required wait, and nothing here says what any individual recording shows.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-ncse-cause-treatment-recurrence-and-active-risk',
    narration: 'The recording reports recurrent evolving left temporal electrographic seizures totalling twenty-four minutes with no consistent motor correlate, meeting the ACNS electrographic-status definition — and at the bedside she is still fluctuating between short phrases, speech arrest and intermittent command following. The absent motor correlate is why this was invisible, not a reason to doubt it. Hand off the cause, the treatment, the recurrence risk, the airway and the recovery, and let the recording settle none of them.' };
}

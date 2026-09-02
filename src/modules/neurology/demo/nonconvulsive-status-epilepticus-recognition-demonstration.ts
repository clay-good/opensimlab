import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsNcse, type NcseAction, type NcseProgress,
} from '../nonconvulsive-status-epilepticus-recognition';

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
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on looking exactly as she did, and now known to be seizing. Nothing was proven and nothing was excluded — not the cause, not the treatment, not whether the recording changes. This ends the example, not the status.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient',
      narration: 'Describe the fluctuation in seconds, because that is what separates this from confusion. Ninety-five minutes of alternating short fluent phrases, perseveration, speech arrest lasting twenty to forty seconds, inattention, and rightward gaze deviation for fifteen to twenty-five seconds that comes back toward midline. Delirium waxes over hours; this is the same stereotyped event happening again and again on a scale of seconds, and she has not returned to her usual baseline once in that time.' };
  }
  if (patient.suspicionAtTick === null) {
    return { id: 'suspicion', focus: 'actions', progress: 0.26, action: 'recognize-neurology-ncse-suspicion-and-urgent-eeg-boundary-without-clinical-diagnosis',
      narration: 'Say you suspect a seizure and that this needs an urgent EEG — and stop there. Both halves matter. You cannot make this diagnosis from the bedside, because the whole problem is that there is nothing to watch; and you cannot wait to suspect it, because the recording is what settles it and somebody has to ask for the recording. Gaze deviation that returns toward midline and speech arrest in seconds are what raise it. Naming a suspicion and naming the test is the entire step.' };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.46, action: 'activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership',
      narration: 'Get neurology, the EEG service and airway-capable ownership involved together. The EEG is not a test you order and collect later — it needs people, and asking for it is a staffing question as much as a clinical one, which is why the service is called rather than the box requested. Airway capability travels with them: she handles secretions now, and she has not been reliably awake for ninety-five minutes.' };
  }
  if (patient.alternativesAtTick === null) {
    return { id: 'alternatives', focus: 'monitor', progress: 0.64, action: 'review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives',
      narration: 'Work the alternatives properly — alongside the EEG rather than instead of it. This is where the diagnosis usually gets lost: fluctuating confusion in a seventy-two-year-old becomes a delirium workup and the seizures keep running underneath it. The alternatives are real and stay open — ischemia, a postictal state, delirium, medication, toxic, metabolic, infectious, immune, structural and psychiatric causes — and the CT, CTA, glucose of 108 and sodium of 138 close large things at this minute rather than permanently.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory',
      narration: 'Let the authored interval pass and read the qualified neurophysiologist’s recording report. The interval is a contrast rather than a required wait, and nothing here says what any individual recording shows.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-ncse-cause-treatment-recurrence-and-active-risk',
    narration: 'The recording reports recurrent evolving left temporal electrographic seizures totalling twenty-four minutes with no consistent motor correlate, meeting the ACNS electrographic-status definition — and at the bedside she is still fluctuating between short phrases, speech arrest and intermittent command following. The absent motor correlate is why this was invisible, not a reason to doubt it. Hand off the cause, the treatment, the recurrence risk, the airway and the recovery, and let the recording settle none of them.' };
}

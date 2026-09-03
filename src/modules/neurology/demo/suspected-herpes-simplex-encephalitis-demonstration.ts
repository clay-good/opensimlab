import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsEncephalitis, type EncephalitisAction, type EncephalitisProgress,
} from '../suspected-herpes-simplex-encephalitis';
import { encephalitisInlinePrompt } from '../tutor/suspected-herpes-simplex-encephalitis-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: EncephalitisProgress): string {
  const prompt = encephalitisInlinePrompt('guided', { scenarioVersion: '0.1.0', encephalitis: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ENCEPHALITIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsEncephalitisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsEncephalitis(scenario);
}

export interface EncephalitisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: EncephalitisAction; readonly finished?: boolean;
}

/**
 * The worked example for a diagnosis you treat before you have it.
 *
 * The meningitis lesson runs its treatment clock alongside its diagnostic
 * clock; this one puts treatment in front, and the ending explains why. A CSF
 * HSV PCR taken about eighteen hours after the neurobehavioral symptoms started
 * comes back negative in a man whose MRI and EEG both point squarely at it. An
 * early negative does not exclude this, which is exactly why the antiviral
 * could not have waited. This example interprets no MRI or EEG, names no
 * pathogen, and selects no regimen or dose.
 */
export function encephalitisDemonstrationStep(
  patient?: EncephalitisProgress,
): EncephalitisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on treated, imaged, and no more certain than he was — with a negative test that settles nothing. Nothing was proven and nothing was excluded, not the virus, not an autoimmune cause, not what his memory does. This ends the example, not the illness.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-encephalitis-clock-cognition-language-focal-seizure-and-whole-patient',
      narration: narrate(patient) };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.26, action: 'activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership',
      narration: narrate(patient) };
  }
  if (patient.treatmentAtTick === null) {
    return { id: 'treatment', focus: 'actions', progress: 0.46, action: 'activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay',
      narration: 'Start the empiric antiviral pathway now, ahead of the MRI, the EEG, the CSF and the PCR. This is the step that has to come before the looking. Every test in front of you can be normal, pending or negative in someone who has this, so treatment that waits for certainty is treatment that arrives late in the only condition where arriving late is what does the damage. No regimen and no dose are chosen here; what is being decided is that the antiviral does not queue behind a result.' };
  }
  if (patient.diagnosticsAtTick === null) {
    return { id: 'diagnostics', focus: 'monitor', progress: 0.64, action: 'review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary',
      narration: 'Now read the picture, and hold every part of it loosely. The CSF shows 96 cells at 86% lymphocytes with protein 82 and a normal glucose ratio — central inflammation, not a pathogen. Viral PCR, antibody and the broader infectious and autoimmune studies are pending, and autoimmune, vascular, neoplastic, toxic-metabolic, postictal and medication causes stay open. The other live question is what the EEG cannot settle: he has had one focal seizure, and a nonconvulsive one would look like the drowsiness already in front of you.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-encephalitis-strict-later-early-negative-hsv-pcr-and-clinical-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s 4-hour report. The interval is a contrast rather than a required wait, and nothing here says what any individual patient does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-encephalitis-repeat-testing-antiviral-seizure-autoimmune-and-active-risk',
    narration: 'The MRI describes left mesial-temporal and insular FLAIR change with restricted diffusion, the EEG describes left temporal slowing with lateralized periodic discharges and no seizure during the sample, and the CSF HSV PCR is negative — from a specimen taken about eighteen hours after the neurobehavioral symptoms began. An early negative does not exclude this, which is the whole reason the antiviral went first. Hand off repeat testing, continued antiviral care, the seizure question, the autoimmune workup and his cognition.' };
}

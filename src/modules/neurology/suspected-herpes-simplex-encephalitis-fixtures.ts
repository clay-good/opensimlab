import type { EncephalitisAction } from './suspected-herpes-simplex-encephalitis';

/**
 * Reference transcripts for the encephalitis lesson.
 *
 * The error path is the one this whole lesson exists to prevent: get the right
 * people, then go and look at the MRI, the EEG and the CSF before committing to
 * anything. It is an ordering error rather than a treatment error, because this
 * lesson delivers no treatment. What it skips is the beat where the empiric
 * antiviral pathway starts, and it starts before any of those results, because
 * every one of them can be normal, pending, or negative in a patient who has
 * this. The recovery path starts from that refusal and still reaches a correct
 * handoff in the same run.
 */
export const ENCEPHALITIS_FIXTURES = {
  scenarioId: 'suspected-herpes-simplex-encephalitis', contentVersion: '0.1.0', seed: 6474,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-encephalitis-clock-cognition-language-focal-seizure-and-whole-patient'],
    [1, 'activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership'],
    [2, 'activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay'],
    [3, 'review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary'],
    [4, 'review-neurology-encephalitis-strict-later-early-negative-hsv-pcr-and-clinical-trajectory'],
    [5, 'handoff-neurology-encephalitis-repeat-testing-antiviral-seizure-autoimmune-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-encephalitis-clock-cognition-language-focal-seizure-and-whole-patient'],
    [1, 'activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership'],
    [2, 'review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary'],
  ],
  recovery: [
    [0, 'reconcile-neurology-encephalitis-clock-cognition-language-focal-seizure-and-whole-patient'],
    [1, 'activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership'],
    [2, 'review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary'],
    [3, 'activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay'],
    [4, 'review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary'],
    [5, 'review-neurology-encephalitis-strict-later-early-negative-hsv-pcr-and-clinical-trajectory'],
    [6, 'handoff-neurology-encephalitis-repeat-testing-antiviral-seizure-autoimmune-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, EncephalitisAction])[];
  expert: readonly (readonly [number, EncephalitisAction])[];
  commonError: readonly (readonly [number, EncephalitisAction])[];
  recovery: readonly (readonly [number, EncephalitisAction])[];
};

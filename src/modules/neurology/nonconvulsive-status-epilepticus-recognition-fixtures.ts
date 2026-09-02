import type { NcseAction } from './nonconvulsive-status-epilepticus-recognition';

/**
 * Reference transcripts for the nonconvulsive-status lesson.
 *
 * The error path is the one this diagnosis is most often lost to: a
 * seventy-two-year-old with fluctuating confusion becomes a delirium workup —
 * check the sodium, review the medicines, look for infection — and the
 * seizures keep running underneath it. It is an ordering error rather than a
 * treatment error, because this lesson delivers no treatment. What it skips is
 * the beat that says a seizure is suspected and an urgent EEG is the boundary;
 * the alternatives still matter, but they are the parallel work rather than the
 * substitute. The recovery path starts from that refusal and still reaches a
 * correct handoff in the same run.
 */
export const NCSE_FIXTURES = {
  scenarioId: 'nonconvulsive-status-epilepticus-recognition', contentVersion: '0.1.0', seed: 6310,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient'],
    [1, 'recognize-neurology-ncse-suspicion-and-urgent-eeg-boundary-without-clinical-diagnosis'],
    [2, 'activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership'],
    [3, 'review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives'],
    [4, 'review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory'],
    [5, 'handoff-neurology-ncse-cause-treatment-recurrence-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient'],
    [1, 'review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives'],
    [2, 'review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory'],
  ],
  recovery: [
    [0, 'reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient'],
    [1, 'review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives'],
    [2, 'recognize-neurology-ncse-suspicion-and-urgent-eeg-boundary-without-clinical-diagnosis'],
    [3, 'activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership'],
    [4, 'review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives'],
    [5, 'review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory'],
    [6, 'handoff-neurology-ncse-cause-treatment-recurrence-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NcseAction])[];
  expert: readonly (readonly [number, NcseAction])[];
  commonError: readonly (readonly [number, NcseAction])[];
  recovery: readonly (readonly [number, NcseAction])[];
};

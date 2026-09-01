import type { AnticholinergicAction } from './anticholinergic-hyperthermia-delirium';

/**
 * Reference transcripts for the anticholinergic lesson.
 *
 * The error path is the one an interesting syndrome invites: the pattern has a
 * name, so keep studying it — the ECG, the CK, the differential — while she is
 * still at 40.3°C. It is an ordering error rather than a treatment error,
 * because this lesson delivers no treatment. What it skips is the beat where
 * cooling gets an owner, and the temperature is the part of this presentation
 * that is time-dependent. The recovery path starts from that refusal and still
 * reaches a correct handoff in the same run.
 */
export const ANTICHOLINERGIC_FIXTURES = {
  scenarioId: 'anticholinergic-hyperthermia-delirium', contentVersion: '0.1.0', seed: 5661,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-anticholinergic-product-clock-delirium-temperature-dryness-retention-ecg-and-whole-patient'],
    [1, 'recognize-toxicology-anticholinergic-central-and-peripheral-pattern-without-mnemonic-temperature-or-pupil-only-closure'],
    [2, 'activate-toxicology-anticholinergic-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership'],
    [3, 'review-toxicology-anticholinergic-supplied-temperature-cns-ecg-renal-ck-retention-and-differential-boundary'],
    [4, 'record-toxicology-anticholinergic-bounded-qualified-cooling-support-sedation-seizure-surveillance-and-physostigmine-eligibility-intent-with-strict-later-review'],
    [5, 'handoff-toxicology-anticholinergic-rebound-delirium-hyperthermia-retention-rhabdomyolysis-seizure-coingestion-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-anticholinergic-product-clock-delirium-temperature-dryness-retention-ecg-and-whole-patient'],
    [1, 'recognize-toxicology-anticholinergic-central-and-peripheral-pattern-without-mnemonic-temperature-or-pupil-only-closure'],
    [2, 'review-toxicology-anticholinergic-supplied-temperature-cns-ecg-renal-ck-retention-and-differential-boundary'],
    [3, 'record-toxicology-anticholinergic-bounded-qualified-cooling-support-sedation-seizure-surveillance-and-physostigmine-eligibility-intent-with-strict-later-review'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-anticholinergic-product-clock-delirium-temperature-dryness-retention-ecg-and-whole-patient'],
    [1, 'recognize-toxicology-anticholinergic-central-and-peripheral-pattern-without-mnemonic-temperature-or-pupil-only-closure'],
    [2, 'review-toxicology-anticholinergic-supplied-temperature-cns-ecg-renal-ck-retention-and-differential-boundary'],
    [3, 'activate-toxicology-anticholinergic-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership'],
    [4, 'review-toxicology-anticholinergic-supplied-temperature-cns-ecg-renal-ck-retention-and-differential-boundary'],
    [5, 'record-toxicology-anticholinergic-bounded-qualified-cooling-support-sedation-seizure-surveillance-and-physostigmine-eligibility-intent-with-strict-later-review'],
    [6, 'handoff-toxicology-anticholinergic-rebound-delirium-hyperthermia-retention-rhabdomyolysis-seizure-coingestion-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AnticholinergicAction])[];
  expert: readonly (readonly [number, AnticholinergicAction])[];
  commonError: readonly (readonly [number, AnticholinergicAction])[];
  recovery: readonly (readonly [number, AnticholinergicAction])[];
};

import type { SerotoninAction } from './serotonin-toxicity-hyperthermia-clonus';

/**
 * Reference transcripts for the serotonin-toxicity lesson.
 *
 * The error path is the one the syndrome's name invites: recognize it, then go
 * straight to the antagonist question, as though the rescue drug were the
 * treatment. It is an ordering error rather than a treatment error, because
 * this lesson delivers no treatment. What it skips is the beat where cooling,
 * sedation and airway get an owner — and in this syndrome the muscle is what is
 * making the heat, so that beat is the treatment. The recovery path starts from
 * that refusal and still reaches a correct handoff in the same run.
 */
export const SEROTONIN_FIXTURES = {
  scenarioId: 'serotonin-toxicity-hyperthermia-clonus', contentVersion: '0.1.0', seed: 5703,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-serotonin-agents-clock-mental-autonomic-neuromuscular-temperature-and-whole-patient'],
    [1, 'recognize-toxicology-serotonin-coupled-pattern-without-hunter-clonus-temperature-or-medication-list-only-closure'],
    [2, 'activate-toxicology-serotonin-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership'],
    [3, 'review-toxicology-serotonin-supplied-cns-autonomic-neuromuscular-temperature-ecg-renal-ck-and-differential-boundary'],
    [4, 'record-toxicology-serotonin-bounded-qualified-source-cessation-cooling-support-sedation-seizure-surveillance-airway-and-antagonist-intent-with-strict-later-review'],
    [5, 'handoff-toxicology-serotonin-rebound-hyperthermia-clonus-rigidity-seizure-rhabdomyolysis-coingestion-airway-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-serotonin-agents-clock-mental-autonomic-neuromuscular-temperature-and-whole-patient'],
    [1, 'recognize-toxicology-serotonin-coupled-pattern-without-hunter-clonus-temperature-or-medication-list-only-closure'],
    [2, 'record-toxicology-serotonin-bounded-qualified-source-cessation-cooling-support-sedation-seizure-surveillance-airway-and-antagonist-intent-with-strict-later-review'],
    [3, 'review-toxicology-serotonin-supplied-cns-autonomic-neuromuscular-temperature-ecg-renal-ck-and-differential-boundary'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-serotonin-agents-clock-mental-autonomic-neuromuscular-temperature-and-whole-patient'],
    [1, 'recognize-toxicology-serotonin-coupled-pattern-without-hunter-clonus-temperature-or-medication-list-only-closure'],
    [2, 'record-toxicology-serotonin-bounded-qualified-source-cessation-cooling-support-sedation-seizure-surveillance-airway-and-antagonist-intent-with-strict-later-review'],
    [3, 'activate-toxicology-serotonin-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership'],
    [4, 'review-toxicology-serotonin-supplied-cns-autonomic-neuromuscular-temperature-ecg-renal-ck-and-differential-boundary'],
    [5, 'record-toxicology-serotonin-bounded-qualified-source-cessation-cooling-support-sedation-seizure-surveillance-airway-and-antagonist-intent-with-strict-later-review'],
    [6, 'handoff-toxicology-serotonin-rebound-hyperthermia-clonus-rigidity-seizure-rhabdomyolysis-coingestion-airway-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SerotoninAction])[];
  expert: readonly (readonly [number, SerotoninAction])[];
  commonError: readonly (readonly [number, SerotoninAction])[];
  recovery: readonly (readonly [number, SerotoninAction])[];
};

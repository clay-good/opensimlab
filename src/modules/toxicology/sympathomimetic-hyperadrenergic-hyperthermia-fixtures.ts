import type { SympathomimeticAction } from './sympathomimetic-hyperadrenergic-hyperthermia';

/**
 * Reference transcripts for the sympathomimetic lesson.
 *
 * The error path is the one a frightening room invites: an agitated man is a
 * problem to be controlled, so the hands and the ownership arrive before anyone
 * has said what this is and what it is not. It is an ordering error rather than
 * a treatment error, because this lesson delivers no treatment. What it skips
 * is the beat where the pattern gets named — and until it is named, the same
 * agitation could be a head injury, hypoglycemia, sepsis, or the serotonergic
 * bedside next door. The recovery path starts from that refusal and still
 * reaches a correct handoff in the same run.
 */
export const SYMPATHOMIMETIC_FIXTURES = {
  scenarioId: 'sympathomimetic-hyperadrenergic-hyperthermia', contentVersion: '0.1.0', seed: 5745,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-sympathomimetic-exposure-clock-agitation-autonomic-temperature-and-whole-patient'],
    [1, 'recognize-toxicology-sympathomimetic-coupled-pattern-without-screen-pupil-pressure-temperature-or-agitation-only-closure'],
    [2, 'activate-toxicology-sympathomimetic-deescalation-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership'],
    [3, 'review-toxicology-sympathomimetic-supplied-mental-autonomic-cardiac-temperature-renal-ck-and-differential-boundary'],
    [4, 'record-toxicology-sympathomimetic-bounded-qualified-deescalation-support-sedation-cooling-surveillance-airway-and-adjunct-intent-with-strict-later-review'],
    [5, 'handoff-toxicology-sympathomimetic-rebound-agitation-psychosis-suicidality-ischemia-arrhythmia-hyperthermia-rhabdomyolysis-coingestion-airway-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-sympathomimetic-exposure-clock-agitation-autonomic-temperature-and-whole-patient'],
    [1, 'activate-toxicology-sympathomimetic-deescalation-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership'],
    [2, 'record-toxicology-sympathomimetic-bounded-qualified-deescalation-support-sedation-cooling-surveillance-airway-and-adjunct-intent-with-strict-later-review'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-sympathomimetic-exposure-clock-agitation-autonomic-temperature-and-whole-patient'],
    [1, 'activate-toxicology-sympathomimetic-deescalation-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership'],
    [2, 'recognize-toxicology-sympathomimetic-coupled-pattern-without-screen-pupil-pressure-temperature-or-agitation-only-closure'],
    [3, 'activate-toxicology-sympathomimetic-deescalation-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership'],
    [4, 'review-toxicology-sympathomimetic-supplied-mental-autonomic-cardiac-temperature-renal-ck-and-differential-boundary'],
    [5, 'record-toxicology-sympathomimetic-bounded-qualified-deescalation-support-sedation-cooling-surveillance-airway-and-adjunct-intent-with-strict-later-review'],
    [6, 'handoff-toxicology-sympathomimetic-rebound-agitation-psychosis-suicidality-ischemia-arrhythmia-hyperthermia-rhabdomyolysis-coingestion-airway-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SympathomimeticAction])[];
  expert: readonly (readonly [number, SympathomimeticAction])[];
  commonError: readonly (readonly [number, SympathomimeticAction])[];
  recovery: readonly (readonly [number, SympathomimeticAction])[];
};

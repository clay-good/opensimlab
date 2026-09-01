import type { BetaBlockerAction } from './beta-blocker-cardiogenic-shock';

/**
 * Reference transcripts for the beta-blocker lesson.
 *
 * The error path is pulse-only closure: the rate is 42 and the pressure is low,
 * so commit to the treatment without looking at the contractility, the glucose,
 * the lactate, or the atropine and vasopressor that the treating team has
 * already tried and that have already failed. It is an ordering error rather
 * than a treatment error, because this lesson delivers no treatment. The
 * recovery path starts from that refusal and still reaches a correct handoff in
 * the same run.
 */
export const BETA_BLOCKER_FIXTURES = {
  scenarioId: 'beta-blocker-cardiogenic-shock', contentVersion: '0.1.0', seed: 5504,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-beta-blocker-product-clock-pulse-perfusion-mentation-glucose-ecg-and-whole-patient'],
    [1, 'recognize-toxicology-beta-blocker-cardiogenic-shock-pattern-without-pulse-only-closure'],
    [2, 'activate-toxicology-beta-blocker-poison-center-resuscitation-cardiac-glucose-airway-and-safety-ownership'],
    [3, 'review-toxicology-beta-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary'],
    [4, 'record-toxicology-beta-blocker-bounded-qualified-vasopressor-glucagon-insulin-euglycemia-and-rescue-intent-with-strict-later-review'],
    [5, 'handoff-toxicology-beta-blocker-recurrent-shock-bradycardia-hypoglycemia-electrolyte-volume-rescue-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-beta-blocker-product-clock-pulse-perfusion-mentation-glucose-ecg-and-whole-patient'],
    [1, 'recognize-toxicology-beta-blocker-cardiogenic-shock-pattern-without-pulse-only-closure'],
    [2, 'activate-toxicology-beta-blocker-poison-center-resuscitation-cardiac-glucose-airway-and-safety-ownership'],
    [3, 'record-toxicology-beta-blocker-bounded-qualified-vasopressor-glucagon-insulin-euglycemia-and-rescue-intent-with-strict-later-review'],
    [4, 'handoff-toxicology-beta-blocker-recurrent-shock-bradycardia-hypoglycemia-electrolyte-volume-rescue-and-active-risk'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-beta-blocker-product-clock-pulse-perfusion-mentation-glucose-ecg-and-whole-patient'],
    [1, 'recognize-toxicology-beta-blocker-cardiogenic-shock-pattern-without-pulse-only-closure'],
    [2, 'activate-toxicology-beta-blocker-poison-center-resuscitation-cardiac-glucose-airway-and-safety-ownership'],
    [3, 'record-toxicology-beta-blocker-bounded-qualified-vasopressor-glucagon-insulin-euglycemia-and-rescue-intent-with-strict-later-review'],
    [4, 'review-toxicology-beta-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary'],
    [5, 'record-toxicology-beta-blocker-bounded-qualified-vasopressor-glucagon-insulin-euglycemia-and-rescue-intent-with-strict-later-review'],
    [6, 'handoff-toxicology-beta-blocker-recurrent-shock-bradycardia-hypoglycemia-electrolyte-volume-rescue-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, BetaBlockerAction])[];
  expert: readonly (readonly [number, BetaBlockerAction])[];
  commonError: readonly (readonly [number, BetaBlockerAction])[];
  recovery: readonly (readonly [number, BetaBlockerAction])[];
};

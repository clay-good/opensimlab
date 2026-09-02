import type { HeartFailureAction } from './heart-failure';

/**
 * Reference transcripts for the decompensated heart-failure lesson.
 *
 * This engine case authors no refusable choice and no time gate. The
 * common-error path is the readmission pattern: the symptom improved, so the
 * transition is recorded without ever weighing the decongestion response or
 * asking what it is costing. The recovery path takes that refusal and one
 * before it.
 */
export const HEART_FAILURE_FIXTURES = {
  scenarioId: 'acute-decompensated-heart-failure', contentVersion: '0.1.0', seed: 5936,
  noAction: [],
  expert: [
    [0, 'reconcile-heart-failure-congestion-and-perfusion'],
    [1, 'review-heart-failure-diuretic-response'],
    [2, 'review-heart-failure-tolerance-and-precipitant'],
    [3, 'record-heart-failure-transition-intent'],
    [4, 'reassess-heart-failure-discharge-readiness'],
  ],
  commonError: [
    [0, 'reconcile-heart-failure-congestion-and-perfusion'],
    // He feels better, so the transition is recorded on that alone.
    [1, 'record-heart-failure-transition-intent'],
    [2, 'reassess-heart-failure-discharge-readiness'],
  ],
  recovery: [
    // Judging the response before the congestion has been read.
    [0, 'review-heart-failure-diuretic-response'],
    [1, 'reconcile-heart-failure-congestion-and-perfusion'],
    [2, 'review-heart-failure-diuretic-response'],
    // Then the same skip-the-cost reflex, corrected.
    [3, 'record-heart-failure-transition-intent'],
    [4, 'review-heart-failure-tolerance-and-precipitant'],
    [5, 'record-heart-failure-transition-intent'],
    [6, 'reassess-heart-failure-discharge-readiness'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HeartFailureAction])[];
  expert: readonly (readonly [number, HeartFailureAction])[];
  commonError: readonly (readonly [number, HeartFailureAction])[];
  recovery: readonly (readonly [number, HeartFailureAction])[];
};

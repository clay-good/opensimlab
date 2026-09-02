import type { PediatricHypoglycemicSeizureAction } from './pediatric-hypoglycemic-seizure';

/**
 * Reference transcripts for the hypoglycemic-seizure lesson.
 *
 * This engine case authors no refusable choice, so the error paths are made of
 * order and time. The common-error path is the one this lesson is built
 * around: the sugar is owned, the child wakes up, and nobody ever asks why a
 * previously well five-year-old ran out of it. The recovery path takes the
 * unordered pair in the opposite order — cause review first, while his glucose
 * is still 34 — and walks into both time gates before clearing them.
 */
export const PEDIATRIC_HYPOGLYCEMIC_SEIZURE_FIXTURES = {
  scenarioId: 'pediatric-hypoglycemic-seizure', contentVersion: '0.1.0', seed: 3078,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose'],
    [1, 'recognize-pediatric-hypoglycemic-seizure'],
    [2, 'activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership'],
    [3, 'review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk'],
    [4, 'review-pediatric-hypoglycemic-seizure-later-response'],
    [5, 'handoff-pediatric-hypoglycemic-seizure-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose'],
    [1, 'recognize-pediatric-hypoglycemic-seizure'],
    [2, 'activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership'],
    // The sugar is fixed, so the question is treated as answered.
    [3, 'review-pediatric-hypoglycemic-seizure-later-response'],
  ],
  recovery: [
    // Recognition before there is a pattern to recognize it in.
    [0, 'recognize-pediatric-hypoglycemic-seizure'],
    [1, 'reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose'],
    [2, 'recognize-pediatric-hypoglycemic-seizure'],
    // The unordered pair, taken cause-review first.
    [3, 'review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk'],
    [4, 'review-pediatric-hypoglycemic-seizure-later-response'],
    [5, 'activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership'],
    // And both time gates, taken too early before they are taken correctly.
    [5, 'review-pediatric-hypoglycemic-seizure-later-response'],
    [6, 'review-pediatric-hypoglycemic-seizure-later-response'],
    [6, 'handoff-pediatric-hypoglycemic-seizure-active-risk'],
    [7, 'handoff-pediatric-hypoglycemic-seizure-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricHypoglycemicSeizureAction])[];
  expert: readonly (readonly [number, PediatricHypoglycemicSeizureAction])[];
  commonError: readonly (readonly [number, PediatricHypoglycemicSeizureAction])[];
  recovery: readonly (readonly [number, PediatricHypoglycemicSeizureAction])[];
};

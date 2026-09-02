import type { PediatricDehydrationAction } from './pediatric-dehydration-with-hypovolemia';

/**
 * Reference transcripts for the pediatric dehydration lesson.
 *
 * This engine case authors no refusable choice, so the error paths are made of
 * order and time. The common-error path activates the rehydration and then
 * reaches straight for the later report, having never set the watch for the
 * reason it might not work. The recovery path takes the unordered pair in the
 * opposite order — safety first, rehydration second — and walks into both time
 * gates before clearing them.
 */
export const PEDIATRIC_DEHYDRATION_FIXTURES = {
  scenarioId: 'pediatric-dehydration-with-hypovolemia', contentVersion: '0.1.0', seed: 8236,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-dehydration-losses-and-perfusion'],
    [1, 'recognize-pediatric-dehydration-with-hypovolemia'],
    [2, 'activate-pediatric-dehydration-qualified-rehydration-ownership'],
    [3, 'review-pediatric-dehydration-ongoing-losses-and-safety'],
    [4, 'review-pediatric-dehydration-later-response'],
    [5, 'handoff-pediatric-dehydration-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-dehydration-losses-and-perfusion'],
    [1, 'recognize-pediatric-dehydration-with-hypovolemia'],
    [2, 'activate-pediatric-dehydration-qualified-rehydration-ownership'],
    // Fluid is running, so the reassessment is assumed rather than owned.
    [3, 'review-pediatric-dehydration-later-response'],
  ],
  recovery: [
    // Recognition before there is a trajectory to recognize it in.
    [0, 'recognize-pediatric-dehydration-with-hypovolemia'],
    [1, 'reconcile-pediatric-dehydration-losses-and-perfusion'],
    [2, 'recognize-pediatric-dehydration-with-hypovolemia'],
    // The unordered pair, taken safety first.
    [3, 'review-pediatric-dehydration-ongoing-losses-and-safety'],
    [4, 'review-pediatric-dehydration-later-response'],
    [5, 'activate-pediatric-dehydration-qualified-rehydration-ownership'],
    // And both time gates, taken too early before they are taken correctly.
    [5, 'review-pediatric-dehydration-later-response'],
    [6, 'review-pediatric-dehydration-later-response'],
    [6, 'handoff-pediatric-dehydration-active-risk'],
    [7, 'handoff-pediatric-dehydration-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricDehydrationAction])[];
  expert: readonly (readonly [number, PediatricDehydrationAction])[];
  commonError: readonly (readonly [number, PediatricDehydrationAction])[];
  recovery: readonly (readonly [number, PediatricDehydrationAction])[];
};

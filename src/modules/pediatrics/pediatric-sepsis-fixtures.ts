import type { PediatricSepsisAction } from './pediatric-sepsis';

/**
 * Reference transcripts for the pediatric sepsis lesson.
 *
 * This engine case authors no refusable choice, so the error paths are made
 * of order and time rather than of wrong answers. The common-error path asks
 * for the later report in the same minute the source review was recorded —
 * declaring a trajectory before any time has passed to have one. The recovery
 * path additionally reaches for care ownership before the pattern is
 * reconciled and for the source review before the shock boundary is drawn,
 * and still reaches a correct handoff.
 */
export const PEDIATRIC_SEPSIS_FIXTURES = {
  scenarioId: 'pediatric-sepsis', contentVersion: '0.1.0', seed: 5188,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-sepsis-infection-and-organ-dysfunction'],
    [1, 'distinguish-pediatric-sepsis-without-shock'],
    [2, 'confirm-pediatric-sepsis-qualified-care-ownership'],
    [3, 'review-pediatric-sepsis-source-organs-and-alternatives'],
    [4, 'review-pediatric-sepsis-later-response'],
    [5, 'handoff-pediatric-sepsis-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-sepsis-infection-and-organ-dysfunction'],
    [1, 'distinguish-pediatric-sepsis-without-shock'],
    [2, 'confirm-pediatric-sepsis-qualified-care-ownership'],
    [3, 'review-pediatric-sepsis-source-organs-and-alternatives'],
    // A trajectory read in the same minute the review was recorded.
    [3, 'review-pediatric-sepsis-later-response'],
  ],
  recovery: [
    // Ownership before there is a pattern to own.
    [0, 'confirm-pediatric-sepsis-qualified-care-ownership'],
    [1, 'reconcile-pediatric-sepsis-infection-and-organ-dysfunction'],
    // Source work before the shock boundary is drawn.
    [2, 'review-pediatric-sepsis-source-organs-and-alternatives'],
    [3, 'distinguish-pediatric-sepsis-without-shock'],
    [4, 'confirm-pediatric-sepsis-qualified-care-ownership'],
    [5, 'review-pediatric-sepsis-source-organs-and-alternatives'],
    // And both time gates, taken too early before they are taken correctly.
    [5, 'review-pediatric-sepsis-later-response'],
    [6, 'review-pediatric-sepsis-later-response'],
    [6, 'handoff-pediatric-sepsis-active-risk'],
    [7, 'handoff-pediatric-sepsis-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricSepsisAction])[];
  expert: readonly (readonly [number, PediatricSepsisAction])[];
  commonError: readonly (readonly [number, PediatricSepsisAction])[];
  recovery: readonly (readonly [number, PediatricSepsisAction])[];
};

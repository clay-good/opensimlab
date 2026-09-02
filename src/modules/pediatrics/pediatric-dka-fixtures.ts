import type { PediatricDkaAction } from './pediatric-diabetic-ketoacidosis';

/**
 * Reference transcripts for the pediatric DKA lesson.
 *
 * This engine case authors no refusable choice, so the error paths are made of
 * order and time. The common-error path activates the protocol and then goes
 * straight for the later report, never having set the neurological watch —
 * which is the one thing this lesson is built around. The recovery path takes
 * the unordered pair in the opposite order, safety before care, and walks into
 * both time gates before clearing them.
 */
export const PEDIATRIC_DKA_FIXTURES = {
  scenarioId: 'pediatric-diabetic-ketoacidosis', contentVersion: '0.1.0', seed: 9514,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-dka-illness-and-fixed-pattern'],
    [1, 'recognize-pediatric-dka-and-current-risk'],
    [2, 'activate-pediatric-dka-qualified-care-ownership'],
    [3, 'review-pediatric-dka-neurologic-and-metabolic-safety'],
    [4, 'review-pediatric-dka-later-response'],
    [5, 'handoff-pediatric-dka-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-dka-illness-and-fixed-pattern'],
    [1, 'recognize-pediatric-dka-and-current-risk'],
    [2, 'activate-pediatric-dka-qualified-care-ownership'],
    // A protocol running, and nobody watching her brain.
    [3, 'review-pediatric-dka-later-response'],
  ],
  recovery: [
    // Recognition before there is a pattern to recognize it in.
    [0, 'recognize-pediatric-dka-and-current-risk'],
    [1, 'reconcile-pediatric-dka-illness-and-fixed-pattern'],
    [2, 'recognize-pediatric-dka-and-current-risk'],
    // The unordered pair, taken safety first.
    [3, 'review-pediatric-dka-neurologic-and-metabolic-safety'],
    [4, 'review-pediatric-dka-later-response'],
    [5, 'activate-pediatric-dka-qualified-care-ownership'],
    // And both time gates, taken too early before they are taken correctly.
    [5, 'review-pediatric-dka-later-response'],
    [6, 'review-pediatric-dka-later-response'],
    [6, 'handoff-pediatric-dka-active-risk'],
    [7, 'handoff-pediatric-dka-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricDkaAction])[];
  expert: readonly (readonly [number, PediatricDkaAction])[];
  commonError: readonly (readonly [number, PediatricDkaAction])[];
  recovery: readonly (readonly [number, PediatricDkaAction])[];
};

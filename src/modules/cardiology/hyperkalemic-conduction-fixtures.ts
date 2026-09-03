import type { HyperkalemicConductionAction } from './hyperkalemic-conduction';

/**
 * Reference transcripts for the hyperkalemic-conduction lesson.
 *
 * The common-error path is the one a better-looking monitor invites: the
 * trajectory and the calcium response are read correctly and the learner goes
 * straight for the later panel, as though a narrower QRS had finished the
 * review. The recovery path takes the unordered triple in a different order —
 * which the engine accepts without comment — after being refused for reviewing
 * before reconciling, and walks into both time gates before clearing them.
 */
export const HYPERKALEMIC_CONDUCTION_FIXTURES = {
  scenarioId: 'hyperkalemic-conduction-disturbance', contentVersion: '0.1.0', seed: 5284,
  noAction: [],
  expert: [
    [0, 'reconcile-hyperkalemic-conduction-trajectory'],
    [1, 'review-hyperkalemic-conduction-calcium-response'],
    [2, 'review-hyperkalemic-conduction-shift-surveillance'],
    [3, 'review-hyperkalemic-conduction-removal-and-device-restraint'],
    [4, 'review-hyperkalemic-conduction-later-panel'],
    [5, 'handoff-hyperkalemic-conduction-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-hyperkalemic-conduction-trajectory'],
    [1, 'review-hyperkalemic-conduction-calcium-response'],
    // A narrower QRS treated as the end of the review.
    [2, 'review-hyperkalemic-conduction-later-panel'],
  ],
  recovery: [
    // Reviewing before the three timepoints have been put in order.
    [0, 'review-hyperkalemic-conduction-calcium-response'],
    [1, 'reconcile-hyperkalemic-conduction-trajectory'],
    // The triple in a different order.
    [2, 'review-hyperkalemic-conduction-removal-and-device-restraint'],
    [3, 'review-hyperkalemic-conduction-shift-surveillance'],
    [4, 'review-hyperkalemic-conduction-calcium-response'],
    // Both time gates, each taken too early before it is taken correctly.
    [4, 'review-hyperkalemic-conduction-later-panel'],
    [5, 'review-hyperkalemic-conduction-later-panel'],
    [5, 'handoff-hyperkalemic-conduction-reassessment'],
    [6, 'handoff-hyperkalemic-conduction-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HyperkalemicConductionAction])[];
  expert: readonly (readonly [number, HyperkalemicConductionAction])[];
  commonError: readonly (readonly [number, HyperkalemicConductionAction])[];
  recovery: readonly (readonly [number, HyperkalemicConductionAction])[];
};

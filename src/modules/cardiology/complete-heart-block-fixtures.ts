import type { CompleteHeartBlockAction } from './complete-heart-block';

/**
 * Reference transcripts for the complete-heart-block lesson.
 *
 * The common-error path is the one stability invites: the block is read
 * correctly, the cause is reviewed, and the escalation is left until after the
 * reassessment that never comes. The recovery path takes the unordered pair in
 * the other order — which the engine accepts without comment — after being
 * refused for reviewing before reconciling, and walks into the time gate
 * before clearing it.
 */
export const COMPLETE_HEART_BLOCK_FIXTURES = {
  scenarioId: 'complete-heart-block', contentVersion: '0.1.0', seed: 3318,
  noAction: [],
  expert: [
    [0, 'reconcile-complete-heart-block-stability'],
    [1, 'activate-complete-heart-block-pathway'],
    [2, 'review-complete-heart-block-context'],
    [3, 'reassess-complete-heart-block-trajectory'],
    [4, 'handoff-complete-heart-block-pacing-plan'],
  ],
  commonError: [
    [0, 'reconcile-complete-heart-block-stability'],
    [1, 'review-complete-heart-block-context'],
    // The workup without the phone call.
    [2, 'reassess-complete-heart-block-trajectory'],
  ],
  recovery: [
    // Reviewing before the two rhythms have been reconciled.
    [0, 'review-complete-heart-block-context'],
    [1, 'reconcile-complete-heart-block-stability'],
    [2, 'review-complete-heart-block-context'],
    [3, 'activate-complete-heart-block-pathway'],
    // The time gate, taken too early before it is taken correctly.
    [3, 'reassess-complete-heart-block-trajectory'],
    [4, 'reassess-complete-heart-block-trajectory'],
    [5, 'handoff-complete-heart-block-pacing-plan'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CompleteHeartBlockAction])[];
  expert: readonly (readonly [number, CompleteHeartBlockAction])[];
  commonError: readonly (readonly [number, CompleteHeartBlockAction])[];
  recovery: readonly (readonly [number, CompleteHeartBlockAction])[];
};

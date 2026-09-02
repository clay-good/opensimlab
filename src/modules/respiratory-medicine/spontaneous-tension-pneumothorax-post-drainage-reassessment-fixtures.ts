import type { PostTensionPneumothoraxAction } from './spontaneous-tension-pneumothorax-post-drainage-reassessment';

/**
 * Reference transcripts for the post-drainage pneumothorax lesson.
 *
 * This lesson has two independent lanes rather than one chain: after the
 * drainage response is reviewed, the drain system and the definitive planning
 * can be opened in either order, and the handoff waits for both. So the error
 * path is not a wrong sequence — it is handing off with one lane still empty,
 * which is exactly how a persistent air leak leaves the room as somebody
 * else's problem without a pleural owner attached to it.
 */
export const POST_TENSION_PNEUMOTHORAX_FIXTURES = {
  scenarioId: 'spontaneous-tension-pneumothorax-post-drainage-reassessment', contentVersion: '0.1.0', seed: 7384,
  noAction: [],
  expert: [
    [0, 'reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care'],
    [1, 'review-spontaneous-tension-pneumothorax-drainage-response'],
    [2, 'review-spontaneous-tension-pneumothorax-drain-system-and-complications'],
    [3, 'review-spontaneous-tension-pneumothorax-etiology-recurrence-and-definitive-planning'],
    [4, 'handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care'],
    [1, 'review-spontaneous-tension-pneumothorax-drainage-response'],
    [2, 'review-spontaneous-tension-pneumothorax-drain-system-and-complications'],
    [3, 'handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment'],
  ],
  recovery: [
    [0, 'reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care'],
    [1, 'review-spontaneous-tension-pneumothorax-drainage-response'],
    [2, 'review-spontaneous-tension-pneumothorax-drain-system-and-complications'],
    [3, 'handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment'],
    [4, 'review-spontaneous-tension-pneumothorax-etiology-recurrence-and-definitive-planning'],
    [5, 'handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PostTensionPneumothoraxAction])[];
  expert: readonly (readonly [number, PostTensionPneumothoraxAction])[];
  commonError: readonly (readonly [number, PostTensionPneumothoraxAction])[];
  recovery: readonly (readonly [number, PostTensionPneumothoraxAction])[];
};

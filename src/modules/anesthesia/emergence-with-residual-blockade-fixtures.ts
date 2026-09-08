import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the emergence-with-residual-blockade lesson.
 *
 * This lesson has no drugs and no dials. Its five bounded choices are a review,
 * two classifications and two plans, and the engine enforces the order: nothing
 * can be classified before the monitor is reviewed, and no plan can be chosen
 * before a classification is recorded.
 *
 * The counterfactual isolates the classification. The error and the recovery are
 * identical for their first two actions — review the monitor, then call a ratio
 * of 0.72 recovered — and differ only in the third: proceed to extubation, or
 * defer it.
 *
 * Deferring after the wrong classification recovers a partial credit and no
 * more, which is the honest result. The plan is supposed to follow from the
 * reading; arriving at the safe plan while having misread the number is not the
 * same as having read it.
 */

const CHOOSE = (tick: number, action: string): LearnerAction =>
  ({ tick, type: 'emergence-residual-block-assessment', payload: { action } });

/** Reviewed, and then a ratio of 0.72 called recovered. */
const misreadTheRatio: readonly LearnerAction[] = [
  CHOOSE(300, 'review-quantitative-monitor'),
  CHOOSE(600, 'classify-recovered'),
];

export const EMERGENCE_RESIDUAL_BLOCKADE_FIXTURES = {
  scenarioId: 'emergence-with-residual-blockade', contentVersion: '0.1.0',
  seed: 2277, ticks: 3000,

  /** Nothing is chosen at all. The tube stays in by default rather than by plan. */
  noAction: [] as readonly LearnerAction[],

  /** Read the number, believe it, and keep the airway. */
  expert: [
    CHOOSE(300, 'review-quantitative-monitor'),
    CHOOSE(600, 'classify-residual'),
    CHOOSE(900, 'defer-extubation-and-support'),
  ] as readonly LearnerAction[],

  /** The number read and disbelieved, and the tube out on the strength of it. */
  commonError: [...misreadTheRatio, CHOOSE(900, 'proceed-to-extubation')] as readonly LearnerAction[],

  /** The identical misreading, and the safe plan anyway. */
  recovery: [...misreadTheRatio, CHOOSE(900, 'defer-extubation-and-support')] as readonly LearnerAction[],
} as const;

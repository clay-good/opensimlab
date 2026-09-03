import type { UnstableBradycardiaAction } from './unstable-bradycardia';

/**
 * Reference transcripts for the emergency unstable-bradycardia lesson.
 *
 * The common-error path is the one that treats the number: the rate and the
 * compromise are reviewed and the run reaches straight for atropine, skipping
 * the oxygen, the monitoring and the access. It is refused. The recovery path
 * skips the review, is refused, and then reaches for the reassessment on the
 * same tick as the atropine and is refused again, and still completes from the
 * same positions.
 */
export const UNSTABLE_BRADYCARDIA_FIXTURES = {
  scenarioId: 'unstable-bradycardia', contentVersion: '0.1.0', seed: 3846,
  noAction: [],
  expert: [
    [0, 'review-bradycardia-and-compromise'],
    [1, 'record-bradycardia-support'],
    [2, 'record-atropine-intent'],
    [3, 'reassess-bradycardia-response'],
  ],
  commonError: [
    [0, 'review-bradycardia-and-compromise'],
    // Straight to the drug, with no oxygen, no monitor and no line.
    [1, 'record-atropine-intent'],
  ],
  recovery: [
    // Support before anyone established that the rate is the problem.
    [0, 'record-bradycardia-support'],
    [1, 'review-bradycardia-and-compromise'],
    [2, 'record-bradycardia-support'],
    [3, 'record-atropine-intent'],
    // The reassessment on the same tick as the drug.
    [3, 'reassess-bradycardia-response'],
    [4, 'reassess-bradycardia-response'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, UnstableBradycardiaAction])[];
  expert: readonly (readonly [number, UnstableBradycardiaAction])[];
  commonError: readonly (readonly [number, UnstableBradycardiaAction])[];
  recovery: readonly (readonly [number, UnstableBradycardiaAction])[];
};

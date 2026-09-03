import type { RvFailureAction } from './rv-failure';

/**
 * Reference transcripts for the right-ventricular failure lesson.
 *
 * The common-error path is the one her appearance invites: the trajectory is
 * recognised and the learner records support without reading the two filling
 * pressures that decide which reflex would have been wrong. The recovery path
 * skips each intervening step in turn, is refused for both, and still completes
 * from the same positions.
 */
export const RV_FAILURE_FIXTURES = {
  scenarioId: 'right-ventricular-failure', contentVersion: '0.1.0', seed: 7208,
  noAction: [],
  expert: [
    [0, 'recognize-rv-failure-trajectory'],
    [1, 'review-rv-failure-phenotype'],
    [2, 'record-rv-failure-support'],
    [3, 'address-rv-failure-triggers'],
    [4, 'reassess-rv-failure-trajectory'],
  ],
  commonError: [
    [0, 'recognize-rv-failure-trajectory'],
    // Support before the two filling pressures have been read against each other.
    [1, 'record-rv-failure-support'],
    [2, 'address-rv-failure-triggers'],
  ],
  recovery: [
    // The phenotype before the trajectory has been named.
    [0, 'review-rv-failure-phenotype'],
    [1, 'recognize-rv-failure-trajectory'],
    [2, 'review-rv-failure-phenotype'],
    // Triggers before the support they are reviewed alongside.
    [3, 'address-rv-failure-triggers'],
    [4, 'record-rv-failure-support'],
    [5, 'address-rv-failure-triggers'],
    [6, 'reassess-rv-failure-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RvFailureAction])[];
  expert: readonly (readonly [number, RvFailureAction])[];
  commonError: readonly (readonly [number, RvFailureAction])[];
  recovery: readonly (readonly [number, RvFailureAction])[];
};

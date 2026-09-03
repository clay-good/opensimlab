import type { StatusEpilepticusAction } from './status-epilepticus';

/**
 * Reference transcripts for the critical-care refractory status lesson.
 *
 * The common-error path is the one urgency invites: the refractory pattern is
 * recognised and the learner reaches straight for the continuous-anesthetic
 * pathway, skipping the review that shows what the seizures are costing the
 * rest of him — a MAP of 62 before starting a drug that lowers it further. The
 * recovery path skips each intervening step in turn, is refused for both, and
 * still completes from the same positions.
 */
export const STATUS_EPILEPTICUS_FIXTURES = {
  scenarioId: 'status-epilepticus', contentVersion: '0.1.0', seed: 8264,
  noAction: [],
  expert: [
    [0, 'recognize-refractory-status-epilepticus'],
    [1, 'review-refractory-status-pattern'],
    [2, 'activate-refractory-status-pathway'],
    [3, 'address-refractory-status-causes'],
    [4, 'reassess-refractory-status-trajectory'],
  ],
  commonError: [
    [0, 'recognize-refractory-status-epilepticus'],
    // Straight to the anesthetic, without looking at the body it goes into.
    [1, 'activate-refractory-status-pathway'],
    [2, 'address-refractory-status-causes'],
  ],
  recovery: [
    // The pattern review before the refractory pattern has been recognised.
    [0, 'review-refractory-status-pattern'],
    [1, 'recognize-refractory-status-epilepticus'],
    [2, 'review-refractory-status-pattern'],
    // The cause work before the pathway that buys time for it.
    [3, 'address-refractory-status-causes'],
    [4, 'activate-refractory-status-pathway'],
    [5, 'address-refractory-status-causes'],
    [6, 'reassess-refractory-status-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, StatusEpilepticusAction])[];
  expert: readonly (readonly [number, StatusEpilepticusAction])[];
  commonError: readonly (readonly [number, StatusEpilepticusAction])[];
  recovery: readonly (readonly [number, StatusEpilepticusAction])[];
};

import type { StatusEpilepticusAction } from './status-epilepticus';

/**
 * Reference transcripts for the emergency status-epilepticus lesson.
 *
 * The common-error path is the one that reaches for the drug because the drug
 * is the treatment: the convulsive pattern is reviewed and the lorazepam is
 * recorded with nobody having positioned the airway, put suction to hand, or
 * checked a glucose. It is refused. The recovery path skips the review, is
 * refused, then reaches for the reassessment on the same tick as the drug and
 * is refused again, and still completes from the same positions.
 */
export const STATUS_EPILEPTICUS_FIXTURES = {
  scenarioId: 'status-epilepticus', contentVersion: '0.1.0', seed: 5240,
  noAction: [],
  expert: [
    [0, 'review-convulsive-status'],
    [1, 'record-status-stabilization'],
    [2, 'give-lorazepam-4-mg-iv'],
    [3, 'reassess-after-lorazepam'],
  ],
  commonError: [
    [0, 'review-convulsive-status'],
    // The drug, with no airway position, no suction and no glucose.
    [1, 'give-lorazepam-4-mg-iv'],
  ],
  recovery: [
    // Stabilisation before anyone established this is status rather than a fit.
    [0, 'record-status-stabilization'],
    [1, 'review-convulsive-status'],
    [2, 'record-status-stabilization'],
    [3, 'give-lorazepam-4-mg-iv'],
    // The reassessment on the same tick as the drug, before the physiology
    // update that stops the convulsions.
    [3, 'reassess-after-lorazepam'],
    [4, 'reassess-after-lorazepam'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, StatusEpilepticusAction])[];
  expert: readonly (readonly [number, StatusEpilepticusAction])[];
  commonError: readonly (readonly [number, StatusEpilepticusAction])[];
  recovery: readonly (readonly [number, StatusEpilepticusAction])[];
};

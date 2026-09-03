import type { AdultAsthmaAction } from './adult-asthma';

/**
 * Reference transcripts for the emergency adult-asthma lesson.
 *
 * The common-error path is the one that defers the corticosteroid because its
 * effect is hours away: severity, oxygen and the inhaled bundle are recorded,
 * and the run then reaches for the reassessment intending to decide about
 * steroids once the nebulised treatment has been judged. Early is the only
 * advantage that drug has, so deferring it is the one deferral this vignette
 * cannot recover. The recovery path reaches for treatment before the severity
 * review and is refused, then reaches for the reassessment on the same tick as
 * the last of the three treatments and is refused again, and still completes
 * from the same positions.
 */
export const ADULT_ASTHMA_FIXTURES = {
  scenarioId: 'adult-asthma', contentVersion: '0.1.0', seed: 3412,
  noAction: [],
  expert: [
    [0, 'review-severity-and-mimics'],
    [1, 'record-controlled-oxygen'],
    // The hours-away drug before the minutes-away one, because neither waits.
    [2, 'record-early-corticosteroid-intent'],
    [3, 'give-fixed-inhaled-bronchodilators'],
    [4, 'reassess-after-initial-treatment'],
  ],
  commonError: [
    [0, 'review-severity-and-mimics'],
    [1, 'record-controlled-oxygen'],
    [2, 'give-fixed-inhaled-bronchodilators'],
    // Straight to the reassessment, steroids left for after the verdict.
    [3, 'reassess-after-initial-treatment'],
  ],
  recovery: [
    // The inhaled bundle before severity and the immediate mimics were read.
    [0, 'give-fixed-inhaled-bronchodilators'],
    [1, 'review-severity-and-mimics'],
    [2, 'record-controlled-oxygen'],
    [3, 'give-fixed-inhaled-bronchodilators'],
    [4, 'record-early-corticosteroid-intent'],
    // The reassessment on the same tick as the last treatment, before the
    // engine clock has advanced far enough to have anything new to show.
    [4, 'reassess-after-initial-treatment'],
    [5, 'reassess-after-initial-treatment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AdultAsthmaAction])[];
  expert: readonly (readonly [number, AdultAsthmaAction])[];
  commonError: readonly (readonly [number, AdultAsthmaAction])[];
  recovery: readonly (readonly [number, AdultAsthmaAction])[];
};

import type { CopdExacerbationAction } from './copd-exacerbation';

/**
 * Reference transcripts for the emergency copd-exacerbation lesson.
 *
 * The common-error path is the one that skips the indication check: severity,
 * oxygen, bronchodilators and the corticosteroid course are all recorded, and
 * the run then reaches for the reassessment without ever asking what the
 * antibiotic is for. It is refused. The recovery path reaches for treatment
 * before the blood gas has been read and is refused, then reaches for the
 * reassessment on the same tick as the last of the four treatments and is
 * refused again, and still completes from the same positions.
 */
export const COPD_EXACERBATION_FIXTURES = {
  scenarioId: 'copd-exacerbation', contentVersion: '0.1.0', seed: 2857,
  noAction: [],
  expert: [
    [0, 'review-severity-and-mimics'],
    [1, 'record-controlled-oxygen'],
    [2, 'give-air-driven-bronchodilators'],
    [3, 'record-five-day-corticosteroid-intent'],
    [4, 'record-antibiotic-indication'],
    [5, 'reassess-and-review-ventilatory-support'],
  ],
  commonError: [
    [0, 'review-severity-and-mimics'],
    [1, 'record-controlled-oxygen'],
    [2, 'give-air-driven-bronchodilators'],
    [3, 'record-five-day-corticosteroid-intent'],
    // Straight to the reassessment, with nobody having named an indication.
    [4, 'reassess-and-review-ventilatory-support'],
  ],
  recovery: [
    // Oxygen before severity, the mimics and the blood gas were read.
    [0, 'record-controlled-oxygen'],
    [1, 'review-severity-and-mimics'],
    [2, 'record-controlled-oxygen'],
    [3, 'give-air-driven-bronchodilators'],
    [4, 'record-antibiotic-indication'],
    [5, 'record-five-day-corticosteroid-intent'],
    // The reassessment on the same tick as the last treatment, before the
    // engine clock has advanced far enough to have anything new to show.
    [5, 'reassess-and-review-ventilatory-support'],
    [6, 'reassess-and-review-ventilatory-support'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CopdExacerbationAction])[];
  expert: readonly (readonly [number, CopdExacerbationAction])[];
  commonError: readonly (readonly [number, CopdExacerbationAction])[];
  recovery: readonly (readonly [number, CopdExacerbationAction])[];
};

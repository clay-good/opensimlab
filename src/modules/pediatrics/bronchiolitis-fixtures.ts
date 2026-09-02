import type { BronchiolitisAction } from './bronchiolitis';

/**
 * Reference transcripts for the bronchiolitis lesson.
 *
 * The common-error path takes the two treatments this illness attracts most
 * — a bronchodilator for a wheeze that is not asthma, and an antibiotic for a
 * fever that is viral. The recovery path walks into all five refusals and
 * still reaches a correct handoff.
 */
export const BRONCHIOLITIS_FIXTURES = {
  scenarioId: 'bronchiolitis', contentVersion: '0.1.0', seed: 5348,
  noAction: [],
  expert: [
    [0, 'reconcile-bronchiolitis-risk-and-trajectory'],
    [1, 'recognize-bronchiolitis-supportive-care-pattern'],
    [2, 'activate-bronchiolitis-oxygenation-and-monitoring'],
    [3, 'review-bronchiolitis-feeding-and-hydration'],
    [4, 'review-bronchiolitis-later-response'],
    [5, 'handoff-bronchiolitis-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-bronchiolitis-risk-and-trajectory'],
    [1, 'recognize-bronchiolitis-supportive-care-pattern'],
    [2, 'select-routine-bronchiolitis-albuterol'],
    [3, 'start-routine-bronchiolitis-antibiotic'],
  ],
  recovery: [
    [0, 'reconcile-bronchiolitis-risk-and-trajectory'],
    // Two ways of avoiding the pattern rather than naming it.
    [1, 'wait-for-bronchiolitis-routine-radiograph'],
    [2, 'observe-bronchiolitis-saturation-alone'],
    [3, 'recognize-bronchiolitis-supportive-care-pattern'],
    // The two treatments this illness attracts.
    [4, 'select-routine-bronchiolitis-albuterol'],
    [5, 'start-routine-bronchiolitis-antibiotic'],
    [6, 'activate-bronchiolitis-oxygenation-and-monitoring'],
    [7, 'review-bronchiolitis-feeding-and-hydration'],
    // And sending him home on a number.
    [8, 'discharge-bronchiolitis-on-saturation-alone'],
    [9, 'review-bronchiolitis-later-response'],
    [10, 'handoff-bronchiolitis-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, BronchiolitisAction])[];
  expert: readonly (readonly [number, BronchiolitisAction])[];
  commonError: readonly (readonly [number, BronchiolitisAction])[];
  recovery: readonly (readonly [number, BronchiolitisAction])[];
};

import type { CroupAction } from './croup';

/**
 * Reference transcripts for the croup lesson.
 *
 * The common-error path takes the two that would upset her — a bronchodilator
 * for stridor and a neck film — because in this lesson distressing the child
 * is itself the harm. The recovery path walks into all four refusals,
 * including discharging on the peak of the treatment effect, and still
 * reaches a correct handoff.
 */
export const CROUP_FIXTURES = {
  scenarioId: 'croup', contentVersion: '0.1.0', seed: 7015,
  noAction: [],
  expert: [
    [0, 'reconcile-croup-whole-child-upper-airway-pattern'],
    [1, 'review-croup-severity-and-alternative-red-flags'],
    [2, 'record-croup-minimal-distress-support-and-qualified-treatment-intent'],
    [3, 'review-croup-early-response'],
    [4, 'review-croup-recurrence-and-preserve-airway-readiness'],
    [5, 'handoff-croup-active-upper-airway-risk'],
  ],
  commonError: [
    [0, 'reconcile-croup-whole-child-upper-airway-pattern'],
    [1, 'select-croup-albuterol-for-stridor'],
    [2, 'wait-for-croup-neck-radiograph'],
  ],
  recovery: [
    [0, 'reconcile-croup-whole-child-upper-airway-pattern'],
    [1, 'select-croup-albuterol-for-stridor'],
    [2, 'wait-for-croup-neck-radiograph'],
    [3, 'review-croup-severity-and-alternative-red-flags'],
    [4, 'record-croup-minimal-distress-support-and-qualified-treatment-intent'],
    [5, 'review-croup-early-response'],
    // The two ways of misreading what the treatment bought her.
    [6, 'discharge-croup-after-early-response'],
    [7, 'treat-croup-normal-saturation-as-low-risk'],
    [8, 'review-croup-recurrence-and-preserve-airway-readiness'],
    [9, 'handoff-croup-active-upper-airway-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CroupAction])[];
  expert: readonly (readonly [number, CroupAction])[];
  commonError: readonly (readonly [number, CroupAction])[];
  recovery: readonly (readonly [number, CroupAction])[];
};

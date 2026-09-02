import type { ApeSupportAction } from './acute-pulmonary-edema-respiratory-support-reassessment';

/**
 * Reference transcripts for the pulmonary-edema support lesson.
 *
 * The error path is the one a rich differential invites: go to the pressure,
 * perfusion and precipitants before naming what the mentation, the effort and
 * the gas are already saying. It is an ordering error rather than a treatment
 * error, because this lesson delivers no treatment. What it skips is the
 * recognition that she is failing on support that is already running — and in
 * this lesson the escalation deliberately follows the cause review rather than
 * preceding it, because the help being called is airway-capable help for a
 * failure that has been established.
 */
export const APE_SUPPORT_FIXTURES = {
  scenarioId: 'acute-pulmonary-edema-respiratory-support-reassessment', contentVersion: '0.1.0', seed: 7370,
  noAction: [],
  expert: [
    [0, 'reconcile-ape-initial-care-and-trajectory'],
    [1, 'review-ape-progressive-respiratory-failure'],
    [2, 'review-ape-pressure-perfusion-congestion-and-causes'],
    [3, 'activate-ape-airway-capable-escalation'],
    [4, 'handoff-ape-respiratory-support-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-ape-initial-care-and-trajectory'],
    [1, 'review-ape-pressure-perfusion-congestion-and-causes'],
    [2, 'activate-ape-airway-capable-escalation'],
  ],
  recovery: [
    [0, 'reconcile-ape-initial-care-and-trajectory'],
    [1, 'review-ape-pressure-perfusion-congestion-and-causes'],
    [2, 'review-ape-progressive-respiratory-failure'],
    [3, 'review-ape-pressure-perfusion-congestion-and-causes'],
    [4, 'activate-ape-airway-capable-escalation'],
    [5, 'handoff-ape-respiratory-support-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ApeSupportAction])[];
  expert: readonly (readonly [number, ApeSupportAction])[];
  commonError: readonly (readonly [number, ApeSupportAction])[];
  recovery: readonly (readonly [number, ApeSupportAction])[];
};

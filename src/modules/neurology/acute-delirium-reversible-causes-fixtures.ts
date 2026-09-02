import type { DeliriumAction } from './acute-delirium-reversible-causes';

/**
 * Reference transcripts for the delirium lesson.
 *
 * The error path is the one an eighty-two-year-old with fluctuating confusion
 * invites: go straight to the causes and the calm-care plan. It is an ordering
 * error rather than a treatment error, because this lesson delivers no
 * treatment. What it skips is the step that separates this from dementia — the
 * baseline her daughter can describe, and the fact that she was conversing
 * normally at eight o'clock this morning. Without that, the contributor review
 * is a workup attached to the wrong diagnosis. The recovery path starts from
 * that refusal and still reaches a correct handoff in the same run.
 */
export const DELIRIUM_FIXTURES = {
  scenarioId: 'acute-delirium-reversible-causes', contentVersion: '0.1.0', seed: 6638,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-delirium-baseline-clock-fluctuation-attention-perception-function-and-whole-patient'],
    [1, 'recognize-neurology-delirium-indicators-and-qualified-assessment-boundary-without-dementia-or-single-cause-closure'],
    [2, 'activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership'],
    [3, 'review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary'],
    [4, 'review-neurology-delirium-strict-later-contributor-and-unresolved-cognitive-trajectory'],
    [5, 'handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-delirium-baseline-clock-fluctuation-attention-perception-function-and-whole-patient'],
    [1, 'review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary'],
    [2, 'review-neurology-delirium-strict-later-contributor-and-unresolved-cognitive-trajectory'],
  ],
  recovery: [
    [0, 'reconcile-neurology-delirium-baseline-clock-fluctuation-attention-perception-function-and-whole-patient'],
    [1, 'review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary'],
    [2, 'recognize-neurology-delirium-indicators-and-qualified-assessment-boundary-without-dementia-or-single-cause-closure'],
    [3, 'activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership'],
    [4, 'review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary'],
    [5, 'review-neurology-delirium-strict-later-contributor-and-unresolved-cognitive-trajectory'],
    [6, 'handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, DeliriumAction])[];
  expert: readonly (readonly [number, DeliriumAction])[];
  commonError: readonly (readonly [number, DeliriumAction])[];
  recovery: readonly (readonly [number, DeliriumAction])[];
};

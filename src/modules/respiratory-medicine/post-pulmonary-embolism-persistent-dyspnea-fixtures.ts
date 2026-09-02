import type { PostPeDyspneaAction } from './post-pulmonary-embolism-persistent-dyspnea';

/**
 * Reference transcripts for the post-PE dyspnea lesson.
 *
 * The error path is the one an abnormal scan invites: go straight to the echo
 * and the perfusion defects before establishing that she is safe right now. It
 * is an ordering error rather than a treatment error, because this lesson
 * prescribes nothing. What it skips is the step that separates a chronic
 * limitation from a recurrence.
 */
export const POST_PE_DYSPNEA_FIXTURES = {
  scenarioId: 'post-pulmonary-embolism-persistent-dyspnea', contentVersion: '0.1.0', seed: 7356,
  noAction: [],
  expert: [
    [0, 'reconcile-post-pe-symptoms-and-anticoagulation-course'],
    [1, 'review-post-pe-functional-limitation-and-current-safety'],
    [2, 'review-post-pe-ctepd-evidence-and-alternatives'],
    [3, 'activate-post-pe-pulmonary-vascular-referral'],
    [4, 'handoff-post-pe-persistent-dyspnea-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-post-pe-symptoms-and-anticoagulation-course'],
    [1, 'review-post-pe-ctepd-evidence-and-alternatives'],
    [2, 'activate-post-pe-pulmonary-vascular-referral'],
  ],
  recovery: [
    [0, 'reconcile-post-pe-symptoms-and-anticoagulation-course'],
    [1, 'review-post-pe-ctepd-evidence-and-alternatives'],
    [2, 'review-post-pe-functional-limitation-and-current-safety'],
    [3, 'review-post-pe-ctepd-evidence-and-alternatives'],
    [4, 'activate-post-pe-pulmonary-vascular-referral'],
    [5, 'handoff-post-pe-persistent-dyspnea-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PostPeDyspneaAction])[];
  expert: readonly (readonly [number, PostPeDyspneaAction])[];
  commonError: readonly (readonly [number, PostPeDyspneaAction])[];
  recovery: readonly (readonly [number, PostPeDyspneaAction])[];
};

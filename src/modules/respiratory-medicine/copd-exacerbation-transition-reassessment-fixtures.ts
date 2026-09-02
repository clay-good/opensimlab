import type { CopdTransitionAction } from './copd-exacerbation-transition-reassessment';

/**
 * Reference transcripts for the COPD-transition lesson.
 *
 * The error path is the one a recovered blood gas invites: move to the
 * medication plan before looking at what she can actually do. It is an
 * ordering error rather than a treatment error, because this lesson delivers
 * no treatment. What it skips is the residual respiratory and oxygen review —
 * the step where the corridor walk says her numbers came back and her function
 * did not.
 */
export const COPD_TRANSITION_FIXTURES = {
  scenarioId: 'copd-exacerbation-transition-reassessment', contentVersion: '0.1.0', seed: 7328,
  noAction: [],
  expert: [
    [0, 'reconcile-copd-exacerbation-recovery-and-readiness'],
    [1, 'review-copd-exacerbation-residual-respiratory-and-oxygen-needs'],
    [2, 'review-copd-exacerbation-maintenance-and-acute-medication-plan'],
    [3, 'coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up'],
    [4, 'handoff-copd-exacerbation-transition-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-copd-exacerbation-recovery-and-readiness'],
    [1, 'review-copd-exacerbation-maintenance-and-acute-medication-plan'],
    [2, 'coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up'],
  ],
  recovery: [
    [0, 'reconcile-copd-exacerbation-recovery-and-readiness'],
    [1, 'review-copd-exacerbation-maintenance-and-acute-medication-plan'],
    [2, 'review-copd-exacerbation-residual-respiratory-and-oxygen-needs'],
    [3, 'review-copd-exacerbation-maintenance-and-acute-medication-plan'],
    [4, 'coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up'],
    [5, 'handoff-copd-exacerbation-transition-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CopdTransitionAction])[];
  expert: readonly (readonly [number, CopdTransitionAction])[];
  commonError: readonly (readonly [number, CopdTransitionAction])[];
  recovery: readonly (readonly [number, CopdTransitionAction])[];
};

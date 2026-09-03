import type { PostIntubationHypotensionAction } from './post-intubation-hypotension';

/**
 * Reference transcripts for the post-intubation hypotension lesson.
 *
 * The common-error path is the one an explanation-in-hand invites: the pressure
 * is validated and the learner goes straight to classifying the mechanism,
 * skipping the danger review that would have found a tension pneumothorax or a
 * misplaced tube. The recovery path skips each intervening step in turn, is
 * refused for both, and still completes from the same positions.
 */
export const POST_INTUBATION_HYPOTENSION_FIXTURES = {
  scenarioId: 'post-intubation-hypotension', contentVersion: '0.1.0', seed: 7530,
  noAction: [],
  expert: [
    [0, 'validate-post-intubation-pressure-and-call-help'],
    [1, 'review-post-intubation-danger-pattern'],
    [2, 'classify-post-intubation-hemodynamics'],
    [3, 'record-post-intubation-support-intent'],
    [4, 'reassess-post-intubation-hypotension'],
  ],
  commonError: [
    [0, 'validate-post-intubation-pressure-and-call-help'],
    // Straight to the mechanism, on the strength of a story that fits.
    [1, 'classify-post-intubation-hemodynamics'],
    [2, 'record-post-intubation-support-intent'],
  ],
  recovery: [
    // The danger review before the pressure has been validated.
    [0, 'review-post-intubation-danger-pattern'],
    [1, 'validate-post-intubation-pressure-and-call-help'],
    [2, 'review-post-intubation-danger-pattern'],
    // Support before the pattern has been classified.
    [3, 'record-post-intubation-support-intent'],
    [4, 'classify-post-intubation-hemodynamics'],
    [5, 'record-post-intubation-support-intent'],
    [6, 'reassess-post-intubation-hypotension'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PostIntubationHypotensionAction])[];
  expert: readonly (readonly [number, PostIntubationHypotensionAction])[];
  commonError: readonly (readonly [number, PostIntubationHypotensionAction])[];
  recovery: readonly (readonly [number, PostIntubationHypotensionAction])[];
};

import type { DkaResolutionAction } from './dka-resolution';

/**
 * Reference transcripts for the DKA resolution lesson.
 *
 * The error path here is not a wrong treatment — this lesson delivers none. It
 * is reading the second panel without the first and closing the case on the
 * glucose, which the engine refuses as an ordering violation. The recovery path
 * starts from those same two refusals, because a learner who tried them can
 * still reach a correct handoff in the same run.
 */
export const DKA_RESOLUTION_FIXTURES = {
  scenarioId: 'dka-resolution-transition', contentVersion: '0.1.0', seed: 4911,
  noAction: [],
  expert: [
    [0, 'activate-dka-resolution-endocrine-nursing-pharmacy-electrolyte-nutrition-and-transition-support'],
    [1, 'reconcile-dka-resolution-initial-triad-treatment-clock-current-ketone-acid-base-potassium-glucose-and-whole-person'],
    [2, 'recognize-persistent-dka-despite-lower-glucose-and-closed-anion-gap'],
    [3, 'review-qualified-dka-insulin-dextrose-potassium-monitoring-resolution-and-bridged-transition-boundaries'],
    [4, 'review-dka-resolution-fixed-four-hour-qualified-report'],
    [5, 'handoff-dka-recurrence-insulin-potassium-nutrition-precipitant-education-follow-up-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-persistent-dka-despite-lower-glucose-and-closed-anion-gap'],
    [1, 'review-dka-resolution-fixed-four-hour-qualified-report'],
    [2, 'handoff-dka-recurrence-insulin-potassium-nutrition-precipitant-education-follow-up-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-persistent-dka-despite-lower-glucose-and-closed-anion-gap'],
    [1, 'handoff-dka-recurrence-insulin-potassium-nutrition-precipitant-education-follow-up-and-outcome-risk'],
    [2, 'activate-dka-resolution-endocrine-nursing-pharmacy-electrolyte-nutrition-and-transition-support'],
    [3, 'reconcile-dka-resolution-initial-triad-treatment-clock-current-ketone-acid-base-potassium-glucose-and-whole-person'],
    [4, 'recognize-persistent-dka-despite-lower-glucose-and-closed-anion-gap'],
    [5, 'review-qualified-dka-insulin-dextrose-potassium-monitoring-resolution-and-bridged-transition-boundaries'],
    [6, 'review-dka-resolution-fixed-four-hour-qualified-report'],
    [7, 'handoff-dka-recurrence-insulin-potassium-nutrition-precipitant-education-follow-up-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, DkaResolutionAction])[];
  expert: readonly (readonly [number, DkaResolutionAction])[];
  commonError: readonly (readonly [number, DkaResolutionAction])[];
  recovery: readonly (readonly [number, DkaResolutionAction])[];
};

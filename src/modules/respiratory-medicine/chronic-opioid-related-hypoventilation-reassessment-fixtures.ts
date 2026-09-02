import type { ChronicOpioidHypoventilationAction } from './chronic-opioid-related-hypoventilation-reassessment';

/**
 * Reference transcripts for the opioid-hypoventilation lesson.
 *
 * The evidence and contributor reviews may be completed in either order, so
 * the error path is not a wrong sequence between them. It is coordinating the
 * prescriber, sleep and respiratory plan before either review exists — which
 * is how a clinic ends up changing somebody's long-term analgesia on the
 * strength of a partner's description.
 */
export const CHRONIC_OPIOID_HYPOVENTILATION_FIXTURES = {
  scenarioId: 'chronic-opioid-related-hypoventilation-reassessment', contentVersion: '0.1.0', seed: 7426,
  noAction: [],
  expert: [
    [0, 'reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory'],
    [1, 'review-chronic-opioid-related-hypoventilation-awake-and-sleep-evidence'],
    [2, 'review-chronic-opioid-related-hypoventilation-contributors-and-alternatives'],
    [3, 'coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan'],
    [4, 'handoff-chronic-opioid-related-hypoventilation-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory'],
    [1, 'coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan'],
  ],
  recovery: [
    [0, 'reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory'],
    [1, 'coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan'],
    [2, 'review-chronic-opioid-related-hypoventilation-awake-and-sleep-evidence'],
    [3, 'review-chronic-opioid-related-hypoventilation-contributors-and-alternatives'],
    [4, 'coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan'],
    [5, 'handoff-chronic-opioid-related-hypoventilation-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ChronicOpioidHypoventilationAction])[];
  expert: readonly (readonly [number, ChronicOpioidHypoventilationAction])[];
  commonError: readonly (readonly [number, ChronicOpioidHypoventilationAction])[];
  recovery: readonly (readonly [number, ChronicOpioidHypoventilationAction])[];
};

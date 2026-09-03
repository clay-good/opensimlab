import type { EmergencyAnaphylaxisAction } from './emergency-anaphylaxis';

/**
 * Reference transcripts for the emergency anaphylaxis lesson.
 *
 * The common-error path is the one that treats the adjuncts as prerequisites:
 * the pattern is reviewed, positioning and help are recorded, and the run then
 * reaches for oxygen and a line before the intramuscular epinephrine. Both are
 * refused, because the drug whose delay is what kills people in anaphylaxis
 * does not wait on the two things that feel like getting ready. The recovery
 * path reaches for the drug before positioning and is refused, then reaches for
 * the reassessment on the same tick as the second adjunct and is refused again,
 * and still completes from the same positions.
 */
export const EMERGENCY_ANAPHYLAXIS_FIXTURES = {
  scenarioId: 'anaphylaxis', contentVersion: '0.1.0', seed: 4174,
  noAction: [],
  expert: [
    [0, 'review-systemic-pattern'],
    [1, 'position-and-call-for-help'],
    [2, 'give-im-epinephrine'],
    [3, 'give-high-flow-oxygen'],
    [4, 'begin-fixed-crystalloid'],
    [5, 'reassess-response'],
  ],
  commonError: [
    [0, 'review-systemic-pattern'],
    [1, 'position-and-call-for-help'],
    // The adjuncts first, as though they were how you get ready for the drug.
    [2, 'give-high-flow-oxygen'],
    [3, 'begin-fixed-crystalloid'],
    [4, 'reassess-response'],
  ],
  recovery: [
    // The drug before positioning and help were recorded.
    [0, 'give-im-epinephrine'],
    [1, 'review-systemic-pattern'],
    [2, 'give-im-epinephrine'],
    [3, 'position-and-call-for-help'],
    [4, 'give-im-epinephrine'],
    [5, 'begin-fixed-crystalloid'],
    [6, 'give-high-flow-oxygen'],
    // The reassessment on the same tick as the second adjunct, before the
    // engine clock has advanced far enough to have anything new to show.
    [6, 'reassess-response'],
    [7, 'reassess-response'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, EmergencyAnaphylaxisAction])[];
  expert: readonly (readonly [number, EmergencyAnaphylaxisAction])[];
  commonError: readonly (readonly [number, EmergencyAnaphylaxisAction])[];
  recovery: readonly (readonly [number, EmergencyAnaphylaxisAction])[];
};

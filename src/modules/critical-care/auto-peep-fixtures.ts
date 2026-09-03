import type { AutoPeepAction } from './auto-peep';

/**
 * Reference transcripts for the auto-PEEP lesson.
 *
 * The common-error path is the one a peak pressure of 35 invites: the flow is
 * reviewed and the learner goes straight to a correction, without the hold that
 * quantifies the trapping or the classification that links it to her blood
 * pressure. The recovery path skips each intervening step in turn, is refused
 * for both, and still completes from the same positions.
 */
export const AUTO_PEEP_FIXTURES = {
  scenarioId: 'auto-peep', contentVersion: '0.1.0', seed: 3517,
  noAction: [],
  expert: [
    [0, 'review-auto-peep-patient-and-flow'],
    [1, 'measure-auto-peep'],
    [2, 'classify-auto-peep-pattern'],
    [3, 'record-auto-peep-correction-intent'],
    [4, 'reassess-auto-peep-response'],
  ],
  commonError: [
    [0, 'review-auto-peep-patient-and-flow'],
    // Straight to a correction, with neither the hold nor the classification.
    [1, 'record-auto-peep-correction-intent'],
    [2, 'reassess-auto-peep-response'],
  ],
  recovery: [
    // The hold before the patient and the flow have been read together.
    [0, 'measure-auto-peep'],
    [1, 'review-auto-peep-patient-and-flow'],
    [2, 'measure-auto-peep'],
    // The correction before the pattern has been classified.
    [3, 'record-auto-peep-correction-intent'],
    [4, 'classify-auto-peep-pattern'],
    [5, 'record-auto-peep-correction-intent'],
    [6, 'reassess-auto-peep-response'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AutoPeepAction])[];
  expert: readonly (readonly [number, AutoPeepAction])[];
  commonError: readonly (readonly [number, AutoPeepAction])[];
  recovery: readonly (readonly [number, AutoPeepAction])[];
};

import type { DyssynchronyAction } from './dyssynchrony';

/**
 * Reference transcripts for the ventilator-dyssynchrony lesson.
 *
 * The common-error path is the one a fighting patient invites: the graphics are
 * read and the learner goes straight to a correction, skipping the drivers that
 * might explain why he is fighting and the classification that says which
 * mismatch this is. The recovery path skips each intervening step in turn, is
 * refused for both, and still completes from the same positions.
 */
export const DYSSYNCHRONY_FIXTURES = {
  scenarioId: 'ventilator-dyssynchrony', contentVersion: '0.1.0', seed: 6142,
  noAction: [],
  expert: [
    [0, 'review-dyssynchrony-patient-and-graphics'],
    [1, 'review-dyssynchrony-drivers'],
    [2, 'classify-dyssynchrony-pattern'],
    [3, 'record-dyssynchrony-correction-intent'],
    [4, 'reassess-dyssynchrony-response'],
  ],
  commonError: [
    [0, 'review-dyssynchrony-patient-and-graphics'],
    // Straight to a correction, with neither the drivers nor the pattern.
    [1, 'record-dyssynchrony-correction-intent'],
    [2, 'reassess-dyssynchrony-response'],
  ],
  recovery: [
    // The drivers before the patient and the graphics have been read together.
    [0, 'review-dyssynchrony-drivers'],
    [1, 'review-dyssynchrony-patient-and-graphics'],
    [2, 'review-dyssynchrony-drivers'],
    // The correction before the pattern has been classified.
    [3, 'record-dyssynchrony-correction-intent'],
    [4, 'classify-dyssynchrony-pattern'],
    [5, 'record-dyssynchrony-correction-intent'],
    [6, 'reassess-dyssynchrony-response'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, DyssynchronyAction])[];
  expert: readonly (readonly [number, DyssynchronyAction])[];
  commonError: readonly (readonly [number, DyssynchronyAction])[];
  recovery: readonly (readonly [number, DyssynchronyAction])[];
};

import type { DiabeticKetoacidosisAction } from './diabetic-ketoacidosis';

/**
 * Reference transcripts for the emergency diabetic-ketoacidosis lesson.
 *
 * The common-error path is the one that reaches for insulin because the word
 * after DKA is insulin: the presentation is reviewed, fluids and monitoring are
 * recorded, and the insulin intent is then reached for with a potassium of 3.2
 * mmol/L still uncorrected. It is refused, and the run stops there. The
 * recovery path skips each intervening step in turn, is refused for both, and
 * still completes from the same positions.
 */
export const DIABETIC_KETOACIDOSIS_FIXTURES = {
  scenarioId: 'diabetic-ketoacidosis', contentVersion: '0.1.0', seed: 9314,
  noAction: [],
  expert: [
    [0, 'review-dka-presentation'],
    [1, 'record-dka-fluids-and-monitoring'],
    [2, 'record-dka-potassium-replacement'],
    [3, 'record-dka-insulin-intent'],
    [4, 'add-dextrose-and-continue-insulin'],
    [5, 'confirm-dka-resolution-and-transition'],
  ],
  commonError: [
    [0, 'review-dka-presentation'],
    [1, 'record-dka-fluids-and-monitoring'],
    // Insulin with a potassium of 3.2 mmol/L, because DKA means insulin.
    [2, 'record-dka-insulin-intent'],
  ],
  recovery: [
    // Fluids before the panel that establishes what this is.
    [0, 'record-dka-fluids-and-monitoring'],
    [1, 'review-dka-presentation'],
    [2, 'record-dka-fluids-and-monitoring'],
    [3, 'record-dka-potassium-replacement'],
    // The transition before the interval panel has been worked through.
    [4, 'confirm-dka-resolution-and-transition'],
    [5, 'record-dka-insulin-intent'],
    [6, 'add-dextrose-and-continue-insulin'],
    [7, 'confirm-dka-resolution-and-transition'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, DiabeticKetoacidosisAction])[];
  expert: readonly (readonly [number, DiabeticKetoacidosisAction])[];
  commonError: readonly (readonly [number, DiabeticKetoacidosisAction])[];
  recovery: readonly (readonly [number, DiabeticKetoacidosisAction])[];
};

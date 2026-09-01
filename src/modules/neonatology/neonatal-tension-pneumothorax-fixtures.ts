import type { TensionPneumothoraxAction } from './neonatal-tension-pneumothorax';

/**
 * Reference transcripts for the neonatal tension pneumothorax lesson.
 *
 * The error path is an ordering error rather than a treatment error, because
 * this lesson delivers no treatment. Recognizing the pattern before the support
 * and the clock have been connected, then reading the fixed report as an
 * ending, is the shape it refuses; the recovery path starts from exactly those
 * refusals and still reaches a correct handoff in the same run.
 */
export const TENSION_PNEUMOTHORAX_FIXTURES = {
  scenarioId: 'neonatal-tension-pneumothorax', contentVersion: '0.1.0', seed: 4931,
  noAction: [],
  expert: [
    [0, 'activate-neonatal-tension-pneumothorax-respiratory-decompression-monitoring-and-family-support'],
    [1, 'reconcile-neonatal-tension-pneumothorax-support-clock-sudden-change-asymmetry-perfusion-and-whole-dyad'],
    [2, 'recognize-suspected-neonatal-tension-pneumothorax-with-cardiopulmonary-compromise-without-imaging-delay'],
    [3, 'review-qualified-neonatal-tension-pneumothorax-oxygenation-ventilation-decompression-drain-and-reassessment-boundaries'],
    [4, 'review-neonatal-tension-pneumothorax-fixed-two-minute-qualified-report'],
    [5, 'handoff-neonatal-tension-pneumothorax-air-leak-lung-support-circulatory-family-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-suspected-neonatal-tension-pneumothorax-with-cardiopulmonary-compromise-without-imaging-delay'],
    [1, 'review-neonatal-tension-pneumothorax-fixed-two-minute-qualified-report'],
    [2, 'handoff-neonatal-tension-pneumothorax-air-leak-lung-support-circulatory-family-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-suspected-neonatal-tension-pneumothorax-with-cardiopulmonary-compromise-without-imaging-delay'],
    [1, 'handoff-neonatal-tension-pneumothorax-air-leak-lung-support-circulatory-family-and-outcome-risk'],
    [2, 'activate-neonatal-tension-pneumothorax-respiratory-decompression-monitoring-and-family-support'],
    [3, 'reconcile-neonatal-tension-pneumothorax-support-clock-sudden-change-asymmetry-perfusion-and-whole-dyad'],
    [4, 'recognize-suspected-neonatal-tension-pneumothorax-with-cardiopulmonary-compromise-without-imaging-delay'],
    [5, 'review-qualified-neonatal-tension-pneumothorax-oxygenation-ventilation-decompression-drain-and-reassessment-boundaries'],
    [6, 'review-neonatal-tension-pneumothorax-fixed-two-minute-qualified-report'],
    [7, 'handoff-neonatal-tension-pneumothorax-air-leak-lung-support-circulatory-family-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, TensionPneumothoraxAction])[];
  expert: readonly (readonly [number, TensionPneumothoraxAction])[];
  commonError: readonly (readonly [number, TensionPneumothoraxAction])[];
  recovery: readonly (readonly [number, TensionPneumothoraxAction])[];
};

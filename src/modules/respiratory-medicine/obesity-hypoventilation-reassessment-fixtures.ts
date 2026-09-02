import type { ObesityHypoventilationAction } from './obesity-hypoventilation-reassessment';

/**
 * Reference transcripts for the obesity-hypoventilation lesson.
 *
 * The awake gas and the sleep-plus-open-causes review are two parallel lanes,
 * so the order between them is not the failure. The error path is recording
 * the convergent working pattern with only one lane read — which is how a
 * clinic reaches a conclusion from an AHI of 48 without ever looking at what
 * her carbon dioxide does while she is awake.
 */
export const OBESITY_HYPOVENTILATION_FIXTURES = {
  scenarioId: 'obesity-hypoventilation-reassessment', contentVersion: '0.1.0', seed: 5192,
  noAction: [],
  expert: [
    [0, 'reconcile-obesity-hypoventilation-phenotype-and-trajectory'],
    [1, 'review-obesity-hypoventilation-awake-evidence'],
    [2, 'review-obesity-hypoventilation-sleep-evidence-and-open-causes'],
    [3, 'recognize-obesity-hypoventilation-working-pattern'],
    [4, 'coordinate-obesity-hypoventilation-shared-plan'],
    [5, 'handoff-obesity-hypoventilation-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-obesity-hypoventilation-phenotype-and-trajectory'],
    [1, 'review-obesity-hypoventilation-sleep-evidence-and-open-causes'],
    [2, 'recognize-obesity-hypoventilation-working-pattern'],
  ],
  recovery: [
    [0, 'reconcile-obesity-hypoventilation-phenotype-and-trajectory'],
    [1, 'review-obesity-hypoventilation-sleep-evidence-and-open-causes'],
    [2, 'recognize-obesity-hypoventilation-working-pattern'],
    [3, 'review-obesity-hypoventilation-awake-evidence'],
    [4, 'recognize-obesity-hypoventilation-working-pattern'],
    [5, 'coordinate-obesity-hypoventilation-shared-plan'],
    [6, 'handoff-obesity-hypoventilation-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ObesityHypoventilationAction])[];
  expert: readonly (readonly [number, ObesityHypoventilationAction])[];
  commonError: readonly (readonly [number, ObesityHypoventilationAction])[];
  recovery: readonly (readonly [number, ObesityHypoventilationAction])[];
};

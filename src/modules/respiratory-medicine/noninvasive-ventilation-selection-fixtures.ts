import type { NoninvasiveVentilationSelectionAction } from './noninvasive-ventilation-selection';

/**
 * Reference transcripts for the support-selection lesson.
 *
 * This is the only lesson in the module whose authored error is a clinical
 * choice rather than an ordering mistake. CPAP alone is offered at exactly
 * the right moment in the sequence, is refused, and leaves the patient
 * unchanged — which is the point. The recovery path then makes the correct
 * selection from the same position.
 */
export const NIV_SELECTION_FIXTURES = {
  scenarioId: 'noninvasive-ventilation-selection', contentVersion: '0.1.0', seed: 8634,
  noAction: [],
  expert: [
    [0, 'reconcile-noninvasive-ventilation-selection-treatment-and-trajectory'],
    [1, 'review-noninvasive-ventilation-selection-suitability-and-rescue-readiness'],
    [2, 'select-bilevel-noninvasive-ventilation'],
    [3, 'review-noninvasive-ventilation-selection-early-response'],
    [4, 'review-noninvasive-ventilation-selection-failure-guards'],
    [5, 'handoff-noninvasive-ventilation-selection-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-noninvasive-ventilation-selection-treatment-and-trajectory'],
    [1, 'review-noninvasive-ventilation-selection-suitability-and-rescue-readiness'],
    [2, 'select-cpap-alone'],
  ],
  recovery: [
    [0, 'reconcile-noninvasive-ventilation-selection-treatment-and-trajectory'],
    [1, 'review-noninvasive-ventilation-selection-suitability-and-rescue-readiness'],
    [2, 'select-cpap-alone'],
    [3, 'select-high-flow-nasal-oxygen-alone'],
    [4, 'select-bilevel-noninvasive-ventilation'],
    [5, 'review-noninvasive-ventilation-selection-early-response'],
    [6, 'review-noninvasive-ventilation-selection-failure-guards'],
    [7, 'handoff-noninvasive-ventilation-selection-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NoninvasiveVentilationSelectionAction])[];
  expert: readonly (readonly [number, NoninvasiveVentilationSelectionAction])[];
  commonError: readonly (readonly [number, NoninvasiveVentilationSelectionAction])[];
  recovery: readonly (readonly [number, NoninvasiveVentilationSelectionAction])[];
};

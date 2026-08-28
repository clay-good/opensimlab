import type { SeverePneumoniaAction } from './severe-pneumonia';

export const SEVERE_PNEUMONIA_FIXTURES = {
  scenarioId: 'severe-pneumonia-the-score-answered-another-question', contentVersion: '0.1.0', seed: 5623,
  noAction: [],
  expert: [[0, 'reconcile-supplied-scores'], [1, 'recognize-instrument-mismatch'],
    [2, 'call-critical-care'], [3, 'record-escalation-intent'], [4, 'review-boundaries'],
    [5, 'monitor'], [3001, 'reassess'], [72005, 'reassess'], [72006, 'handoff']],
  commonError: [[0, 'mortality-score-decides-the-bed'], [1, 'wait-for-deterioration'],
    [2, 'marker-grades-severity'], [3, 'saturation-alone-is-adequate'], [9000, 'check-labs']],
  recovery: [[0, 'mortality-score-decides-the-bed'], [1, 'wait-for-deterioration'],
    [2, 'reconcile-supplied-scores'], [3, 'recognize-instrument-mismatch'], [4, 'call-critical-care'],
    [5, 'record-escalation-intent'], [6, 'review-boundaries'], [7, 'monitor'],
    [3002, 'reassess'], [72007, 'reassess'], [72008, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SeverePneumoniaAction])[];
  expert: readonly (readonly [number, SeverePneumoniaAction])[];
  commonError: readonly (readonly [number, SeverePneumoniaAction])[];
  recovery: readonly (readonly [number, SeverePneumoniaAction])[];
};

import type { ObstructedKidneyAction } from './obstructed-kidney';

export const OBSTRUCTED_KIDNEY_FIXTURES = {
  scenarioId: 'obstructed-infected-kidney-decompression', contentVersion: '0.1.0', seed: 5203,
  noAction: [],
  expert: [[0, 'recognize-obstruction'], [1, 'call-urology'], [2, 'request-cultures'],
    [3, 'record-decompression-intent'], [4, 'defer-stone-treatment'], [5, 'review-boundaries'],
    [6, 'monitor'], [3001, 'reassess'], [216005, 'reassess'], [216006, 'handoff']],
  commonError: [[0, 'antibiotics-are-enough'], [1, 'wait-for-crp'], [2, 'choose-modality'],
    [3, 'treat-stone-now'], [9000, 'check-labs']],
  recovery: [[0, 'antibiotics-are-enough'], [1, 'wait-for-crp'], [2, 'recognize-obstruction'],
    [3, 'call-urology'], [4, 'request-cultures'], [5, 'record-decompression-intent'],
    [6, 'defer-stone-treatment'], [7, 'review-boundaries'], [8, 'monitor'], [3002, 'reassess'],
    [216008, 'reassess'], [216009, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ObstructedKidneyAction])[];
  expert: readonly (readonly [number, ObstructedKidneyAction])[];
  commonError: readonly (readonly [number, ObstructedKidneyAction])[];
  recovery: readonly (readonly [number, ObstructedKidneyAction])[];
};

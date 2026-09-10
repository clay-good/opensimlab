import type { RenalContrastAction } from './contrast-attribution';

export const RENAL_CONTRAST_FIXTURES = {
  scenarioId: 'contrast-attribution-a-label-that-stopped-the-search', contentVersion: '0.1.0', seed: 5023,
  noAction: [],
  expert: [[0, 'review-label'], [1, 'review-alternatives'], [2, 'withdraw-exposures'], [3, 'review-evidence'],
    [4, 'call-support'], [5, 'monitor'], [3002, 'reassess'], [36002, 'reassess'], [36003, 'handoff']],
  commonError: [[0, 'attribute-to-contrast'], [1, 'stop-looking'], [9000, 'check-creatinine']],
  recovery: [[0, 'attribute-to-contrast'], [1, 'stop-looking'], [2, 'review-label'], [3, 'review-alternatives'],
    [4, 'withdraw-exposures'], [5, 'review-evidence'], [6, 'call-support'], [7, 'monitor'],
    [3004, 'reassess'], [36004, 'reassess'], [36005, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalContrastAction])[];
  expert: readonly (readonly [number, RenalContrastAction])[];
  commonError: readonly (readonly [number, RenalContrastAction])[];
  recovery: readonly (readonly [number, RenalContrastAction])[];
};

import type { RenalHypocalcemiaAction } from './hypocalcemia';

export const RENAL_HYPOCALCEMIA_FIXTURES = {
  scenarioId: 'hypocalcemia-ionized-calcium-and-ckd', contentVersion: '0.1.0', seed: 4987,
  noAction: [],
  expert: [[0, 'rescue-calcium'], [1, 'continue-calcium'], [2, 'call-support'], [3, 'review-context'],
    [4, 'monitor'], [5, 'coordinate-mineral-care'], [6, 'arrange-follow-up'],
    [9000, 'reassess'], [36001, 'reassess'], [36002, 'handoff']],
  commonError: [[0, 'trust-adjusted-total'], [1, 'oral-only'], [2, 'stop-after-relief'], [9000, 'check-ionized']],
  recovery: [[0, 'trust-adjusted-total'], [1, 'oral-only'], [2, 'stop-after-relief'], [3, 'rescue-calcium'],
    [4, 'call-support'], [5, 'review-context'], [6, 'monitor'], [7, 'coordinate-mineral-care'], [8, 'arrange-follow-up'],
    [9003, 'reassess'], [27003, 'reassess'], [27004, 'continue-calcium'], [63004, 'reassess'], [63005, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalHypocalcemiaAction])[];
  expert: readonly (readonly [number, RenalHypocalcemiaAction])[];
  commonError: readonly (readonly [number, RenalHypocalcemiaAction])[];
  recovery: readonly (readonly [number, RenalHypocalcemiaAction])[];
};

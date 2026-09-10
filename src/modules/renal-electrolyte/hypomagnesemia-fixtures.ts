import type { RenalHypomagnesemiaAction } from './hypomagnesemia';

export const RENAL_HYPOMAGNESEMIA_FIXTURES = {
  scenarioId: 'hypomagnesemia-refractory-potassium-and-the-normal-number', contentVersion: '0.1.0', seed: 5011,
  noAction: [],
  expert: [[0, 'monitor'], [1, 'review-number'], [2, 'replace-magnesium'], [3, 'stop-exposure'],
    [4, 'call-support'], [5, 'review-context'], [3002, 'reassess'], [54002, 'reassess'], [54003, 'handoff']],
  commonError: [[0, 'normal-number-excludes'], [1, 'potassium-alone'], [9000, 'check-potassium']],
  recovery: [[0, 'normal-number-excludes'], [1, 'potassium-alone'], [2, 'monitor'], [3, 'review-number'],
    [4, 'replace-magnesium'], [5, 'stop-exposure'], [6, 'call-support'], [7, 'review-context'],
    [3004, 'reassess'], [54004, 'reassess'], [54005, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalHypomagnesemiaAction])[];
  expert: readonly (readonly [number, RenalHypomagnesemiaAction])[];
  commonError: readonly (readonly [number, RenalHypomagnesemiaAction])[];
  recovery: readonly (readonly [number, RenalHypomagnesemiaAction])[];
};

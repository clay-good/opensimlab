import type { HypocalcemiaAction } from './hypocalcemia';

export const HYPOCALCEMIA_FIXTURES = {
  scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', contentVersion: '0.1.0', seed: 4906,
  noAction: [],
  expert: [[0, 'calcium-rescue'], [1, 'assess-risk'], [2, 'review-cause'], [3, 'magnesium'],
    [4, 'continuing-care'], [6, 'call-support'], [9000, 'reassess'], [36006, 'reassess'], [36007, 'handoff']],
  commonError: [[0, 'oral-only'], [1, 'wait-for-labs'], [2, 'wait-for-magnesium'],
    [3, 'call-support'], [3000, 'reassess']],
  recovery: [[0, 'oral-only'], [1, 'wait-for-labs'], [2, 'wait-for-magnesium'], [3, 'call-support'],
    [3000, 'reassess'], [3001, 'calcium-rescue'], [3002, 'assess-risk'], [3003, 'review-cause'],
    [12001, 'reassess'], [12002, 'stop-after-relief'], [30001, 'reassess'],
    [30002, 'magnesium'], [30003, 'continuing-care'], [66003, 'reassess'], [66004, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HypocalcemiaAction])[];
  expert: readonly (readonly [number, HypocalcemiaAction])[];
  commonError: readonly (readonly [number, HypocalcemiaAction])[];
  recovery: readonly (readonly [number, HypocalcemiaAction])[];
};

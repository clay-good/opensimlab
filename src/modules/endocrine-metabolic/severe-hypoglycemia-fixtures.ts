import type { HypoglycemiaAction } from './severe-hypoglycemia';

/** Exact-version reference decisions; ticks are 100 ms and contain no learner data. */
export const HYPOGLYCEMIA_FIXTURES = {
  scenarioId: 'severe-hypoglycemia-recurrence', contentVersion: '0.1.3', seed: 4901,
  expert: [
    [0, 'check-glucose'], [0, 'call-support'], [10, 'iv-rescue'],
    [6010, 'check-glucose'], [6011, 'review-medications'], [6012, 'continue-monitoring'],
    [18010, 'check-glucose'], [18011, 'iv-rescue'], [24011, 'check-glucose'], [24012, 'handoff'],
  ],
  commonError: [
    [0, 'check-glucose'], [0, 'oral-glucose'], [0, 'call-support'], [10, 'iv-rescue'],
    [6010, 'check-glucose'], [6011, 'close-case'],
  ],
  recovery: [
    [0, 'check-glucose'], [0, 'oral-glucose'], [0, 'call-support'], [10, 'iv-rescue'],
    [6010, 'check-glucose'], [6011, 'close-case'], [6012, 'review-medications'],
    [18010, 'check-glucose'], [18011, 'iv-rescue'], [18012, 'continue-monitoring'],
    [24011, 'check-glucose'], [24012, 'handoff'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  expert: readonly (readonly [number, HypoglycemiaAction])[];
  commonError: readonly (readonly [number, HypoglycemiaAction])[];
  recovery: readonly (readonly [number, HypoglycemiaAction])[];
};

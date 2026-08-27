import type { RenalHyponatremiaAction } from './hyponatremia';

export const RENAL_HYPONATREMIA_FIXTURES = {
  scenarioId: 'hyponatremia-symptoms-and-reassessment', contentVersion: '0.1.0', seed: 4961,
  noAction: [],
  expert: [[0, 'rescue'], [1, 'call-support'], [2, 'review-context'], [3, 'monitor'],
    [36000, 'reassess'], [36001, 'additional-rescue'], [36002, 'evaluate-neurology'],
    [54001, 'reassess'], [54002, 'handoff']],
  commonError: [[0, 'check-sodium'], [1, 'normalize-now'], [2, 'sodium-means-recovered'], [3, 'siadh-now']],
  recovery: [[0, 'normalize-now'], [1, 'siadh-now'], [18000, 'rescue'], [18001, 'call-support'],
    [18002, 'review-context'], [18003, 'monitor'], [54000, 'check-sodium'], [54001, 'sodium-means-recovered'],
    [54002, 'check-neurology'], [54003, 'additional-rescue'], [54004, 'reassess'],
    [54005, 'evaluate-neurology'], [54006, 'additional-rescue'], [72006, 'reassess'], [72007, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalHyponatremiaAction])[];
  expert: readonly (readonly [number, RenalHyponatremiaAction])[];
  commonError: readonly (readonly [number, RenalHyponatremiaAction])[];
  recovery: readonly (readonly [number, RenalHyponatremiaAction])[];
};

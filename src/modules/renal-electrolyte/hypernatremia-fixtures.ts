import type { RenalHypernatremiaAction } from './hypernatremia';

export const RENAL_HYPERNATREMIA_FIXTURES = {
  scenarioId: 'hypernatremia-water-access-and-losses', contentVersion: '0.1.0', seed: 4973,
  noAction: [],
  expert: [[0, 'restore-volume'], [1, 'call-support'], [2, 'review-context'], [3, 'monitor'],
    [9000, 'reassess'], [9001, 'replace-water'], [9002, 'manage-losses'], [9003, 'assist-water-access'],
    [153002, 'reassess'], [153003, 'handoff']],
  commonError: [[0, 'empiric-desmopressin'], [1, 'normalize-now'], [2, 'assist-water-access'], [18000, 'check-sodium']],
  recovery: [[0, 'restore-volume'], [1, 'empiric-desmopressin'], [2, 'normalize-now'], [3, 'call-support'],
    [4, 'review-context'], [5, 'monitor'], [9000, 'reassess'], [9001, 'replace-water'],
    [81001, 'reassess'], [153001, 'check-sodium'], [153002, 'reassess'],
    [153003, 'manage-losses'], [153004, 'assist-water-access'], [297003, 'reassess'], [297004, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalHypernatremiaAction])[];
  expert: readonly (readonly [number, RenalHypernatremiaAction])[];
  commonError: readonly (readonly [number, RenalHypernatremiaAction])[];
  recovery: readonly (readonly [number, RenalHypernatremiaAction])[];
};

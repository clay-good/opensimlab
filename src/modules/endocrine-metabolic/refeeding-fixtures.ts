import type { RefeedingAction } from './refeeding';

export const REFEEDING_FIXTURES = {
  scenarioId: 'refeeding-electrolyte-shift', contentVersion: '0.1.0', seed: 4921,
  noAction: [],
  expert: [[0, 'replace-electrolytes'], [1, 'thiamine'], [2, 'review-nutrition'],
    [3, 'call-support'], [4, 'review-context'], [5, 'monitor'],
    [18000, 'reassess'], [36002, 'reassess'], [36003, 'handoff']],
  commonError: [[0, 'phosphate-only'], [1, 'advance-feeding'], [2, 'stop-monitoring'], [18000, 'reassess']],
  recovery: [[0, 'phosphate-only'], [1, 'advance-feeding'], [2, 'stop-monitoring'], [18000, 'reassess'],
    [18001, 'replace-electrolytes'], [18002, 'thiamine'], [18003, 'call-support'],
    [18004, 'review-context'], [18005, 'monitor'], [54001, 'reassess'], [54002, 'review-nutrition'],
    [90002, 'reassess'], [90003, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RefeedingAction])[];
  expert: readonly (readonly [number, RefeedingAction])[];
  commonError: readonly (readonly [number, RefeedingAction])[];
  recovery: readonly (readonly [number, RefeedingAction])[];
};

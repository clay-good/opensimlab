import type { AdrenalCrisisAction } from './adrenal-crisis';

export const ADRENAL_FIXTURES = {
  scenarioId: 'adrenal-crisis-treatment-before-tests', contentVersion: '0.1.2', seed: 4902,
  expert: [[0, 'hydrocortisone'], [1, 'saline'], [2, 'call-support'], [3, 'review-record'],
    [6001, 'reassess'], [6002, 'prevention'], [6003, 'handoff']],
  commonError: [[0, 'wait-for-cortisol'], [1, 'oral-only'], [2, 'call-support'], [3, 'saline'],
    [3000, 'reassess'], [3001, 'review-record']],
  recovery: [[0, 'wait-for-cortisol'], [1, 'oral-only'], [2, 'call-support'], [3, 'saline'],
    [3000, 'reassess'], [3001, 'review-record'], [3002, 'hydrocortisone'],
    [9002, 'reassess'], [9003, 'prevention'], [9004, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  expert: readonly (readonly [number, AdrenalCrisisAction])[];
  commonError: readonly (readonly [number, AdrenalCrisisAction])[];
  recovery: readonly (readonly [number, AdrenalCrisisAction])[];
};

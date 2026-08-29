import type { NormalTestToxicityAction } from './normal-test-toxicity';

export const NORMAL_TEST_TOXICITY_FIXTURES = {
  scenarioId: 'normal-test-toxicity-the-dose-in-his-bag', contentVersion: '0.1.0', seed: 7312,
  noAction: [],
  expert: [[0, 'withhold-the-drug-now'], [1, 'record-the-toxicity-and-its-severity'],
    [2, 'record-what-the-normal-test-does-not-exclude'], [3, 'escalate-to-acute-oncology'],
    [4, 'record-bounded-supportive-intent'], [5, 'review-boundaries'],
    [24010, 'reassess'], [42020, 'reassess'], [42021, 'handoff']],
  commonError: [[0, 'the-test-was-normal-so-not-the-drug'], [1, 'wait-for-oncology-before-stopping'],
    [2, 'advise-him-to-halve-the-dose'], [3, 'treat-the-symptoms-and-review-tomorrow'],
    [30000, 'check-the-treatment-record']],
  recovery: [[0, 'the-test-was-normal-so-not-the-drug'], [1, 'wait-for-oncology-before-stopping'],
    [2, 'withhold-the-drug-now'], [3, 'record-the-toxicity-and-its-severity'],
    [4, 'record-what-the-normal-test-does-not-exclude'], [5, 'escalate-to-acute-oncology'],
    [6, 'record-bounded-supportive-intent'], [7, 'review-boundaries'],
    [24020, 'reassess'], [42030, 'reassess'], [42031, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NormalTestToxicityAction])[];
  expert: readonly (readonly [number, NormalTestToxicityAction])[];
  commonError: readonly (readonly [number, NormalTestToxicityAction])[];
  recovery: readonly (readonly [number, NormalTestToxicityAction])[];
};

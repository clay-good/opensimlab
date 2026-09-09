import type { NegativeScanAction } from './negative-scan';

export const NEGATIVE_SCAN_FIXTURES = {
  scenarioId: 'negative-scan-a-scan-that-cannot-say-no', contentVersion: '0.1.0', seed: 6841,
  noAction: [],
  expert: [[0, 'record-the-operative-course'], [1, 'record-the-failure-to-progress'],
    [2, 'record-what-the-scan-excludes'], [27010, 'escalate-to-the-operating-team'],
    [27011, 'record-bounded-surgical-intent'], [27012, 'review-boundaries'], [27013, 'reassess'],
    [63020, 'reassess'], [63021, 'handoff']],
  commonError: [[0, 'the-scan-was-negative-so-it-is-not-a-leak'],
    [1, 'abnormal-vitals-are-routine-after-bowel-surgery'],
    [2, 'repeat-the-scan-tomorrow-and-review-then'], [3, 'treat-the-numbers-and-watch-overnight'],
    [9000, 'check-observations']],
  recovery: [[0, 'the-scan-was-negative-so-it-is-not-a-leak'],
    [1, 'repeat-the-scan-tomorrow-and-review-then'], [2, 'record-the-operative-course'],
    [3, 'record-the-failure-to-progress'], [4, 'record-what-the-scan-excludes'],
    [27020, 'escalate-to-the-operating-team'], [27021, 'record-bounded-surgical-intent'],
    [27022, 'review-boundaries'], [27023, 'reassess'],
    [63030, 'reassess'], [63031, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NegativeScanAction])[];
  expert: readonly (readonly [number, NegativeScanAction])[];
  commonError: readonly (readonly [number, NegativeScanAction])[];
  recovery: readonly (readonly [number, NegativeScanAction])[];
};

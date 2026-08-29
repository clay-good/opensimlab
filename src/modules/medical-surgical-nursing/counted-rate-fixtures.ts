import type { CountedRateAction } from './counted-rate';

export const COUNTED_RATE_FIXTURES = {
  scenarioId: 'counted-rate-a-number-nobody-counted', contentVersion: '0.1.0', seed: 9153,
  noAction: [],
  expert: [[0, 'review-the-charted-trend'], [1, 'count-for-a-full-minute'],
    [2, 'record-the-discrepancy'], [3, 'escalate-on-the-counted-value'], [4, 'review-boundaries'],
    [5, 'monitor'], [6, 'reassess'], [36010, 'reassess'], [36011, 'handoff']],
  commonError: [[0, 'trust-the-flat-trend'], [1, 'chart-the-monitor-value'],
    [2, 'round-to-the-previous-entry'], [3, 'correct-the-earlier-entries'], [9000, 'check-chart']],
  recovery: [[0, 'trust-the-flat-trend'], [1, 'correct-the-earlier-entries'],
    [2, 'review-the-charted-trend'], [3, 'count-for-a-full-minute'], [4, 'record-the-discrepancy'],
    [5, 'escalate-on-the-counted-value'], [6, 'review-boundaries'], [7, 'monitor'], [8, 'reassess'],
    [36020, 'reassess'], [36021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CountedRateAction])[];
  expert: readonly (readonly [number, CountedRateAction])[];
  commonError: readonly (readonly [number, CountedRateAction])[];
  recovery: readonly (readonly [number, CountedRateAction])[];
};

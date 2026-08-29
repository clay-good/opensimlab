import type { LowScoreAction } from './low-score';

export const LOW_SCORE_FIXTURES = {
  scenarioId: 'low-score-what-the-threshold-does-not-exclude', contentVersion: '0.1.0', seed: 8241,
  noAction: [],
  expert: [[0, 'record-observations-and-score'], [1, 'record-what-the-score-excludes'],
    [12010, 'record-the-family-report'], [12011, 'escalate-on-concern'], [12012, 'review-boundaries'],
    [12013, 'monitor'], [12014, 'reassess'], [66020, 'reassess'], [66021, 'handoff']],
  commonError: [[0, 'score-is-low-so-recheck-later'], [1, 'no-fever-so-not-infection'],
    [2, 'use-qsofa-instead'], [3, 'document-and-move-on'], [9000, 'check-observations']],
  recovery: [[0, 'score-is-low-so-recheck-later'], [1, 'document-and-move-on'],
    [2, 'record-observations-and-score'], [3, 'record-what-the-score-excludes'],
    [12020, 'record-the-family-report'], [12021, 'escalate-on-concern'], [12022, 'review-boundaries'],
    [12023, 'monitor'], [12024, 'reassess'], [66030, 'reassess'], [66031, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, LowScoreAction])[];
  expert: readonly (readonly [number, LowScoreAction])[];
  commonError: readonly (readonly [number, LowScoreAction])[];
  recovery: readonly (readonly [number, LowScoreAction])[];
};

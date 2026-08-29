import type { OxygenTargetScaleAction } from './oxygen-target-scale';

export const OXYGEN_TARGET_SCALE_FIXTURES = {
  scenarioId: 'oxygen-target-scale-a-score-that-should-be-lower', contentVersion: '0.1.0', seed: 5307,
  noAction: [],
  expert: [[0, 'check-the-prescription'], [1, 'check-the-chart'], [2, 'record-the-scale-mismatch'],
    [3, 'rescore-on-the-prescribed-scale'], [4, 'record-what-the-rescore-changes'],
    [5, 'confirm-the-scale-with-the-team'], [6, 'review-boundaries'], [7, 'monitor'], [8, 'reassess'],
    [17_000, 'reassess'], [17_001, 'handoff']],
  commonError: [[0, 'raise-the-oxygen-to-correct-it'], [1, 'assume-the-diagnosis-sets-the-scale'],
    [2, 'a-lower-score-means-she-is-improving'], [3, 'score-both-and-take-the-higher'],
    [9_000, 'check-the-chart']],
  recovery: [[0, 'raise-the-oxygen-to-correct-it'], [1, 'score-both-and-take-the-higher'],
    [2, 'check-the-prescription'], [3, 'check-the-chart'], [4, 'record-the-scale-mismatch'],
    [5, 'rescore-on-the-prescribed-scale'], [6, 'record-what-the-rescore-changes'],
    [7, 'confirm-the-scale-with-the-team'], [8, 'review-boundaries'], [9, 'monitor'], [10, 'reassess'],
    [17_010, 'reassess'], [17_011, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, OxygenTargetScaleAction])[];
  expert: readonly (readonly [number, OxygenTargetScaleAction])[];
  commonError: readonly (readonly [number, OxygenTargetScaleAction])[];
  recovery: readonly (readonly [number, OxygenTargetScaleAction])[];
};

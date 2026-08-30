import type { EasyLabelAction } from './easy-label';

export const EASY_LABEL_FIXTURES = {
  scenarioId: 'easy-label-a-label-that-fits-too-easily', contentVersion: '0.1.0', seed: 2830,
  noAction: [],
  expert: [[0, 'record-that-the-label-is-a-diagnosis-of-exclusion'], [1, 'escalate-so-both-can-start-together'],
    [2, 'record-what-has-not-been-excluded'], [3, 'record-bounded-treatment-intent'],
    [4, 'review-boundaries'], [40010, 'reassess'], [40011, 'handoff']],
  commonError: [[0, 'four-cycles-in-so-it-is-the-drug'], [1, 'no-fever-so-it-cannot-be-infection'],
    [2, 'start-immunosuppression-now-it-is-obviously-colitis'], [3, 'wait-for-every-result-before-telling-anyone'],
    [9000, 'check-observations']],
  recovery: [[0, 'four-cycles-in-so-it-is-the-drug'], [1, 'start-immunosuppression-now-it-is-obviously-colitis'],
    [2, 'record-that-the-label-is-a-diagnosis-of-exclusion'], [3, 'escalate-so-both-can-start-together'],
    [4, 'record-what-has-not-been-excluded'], [5, 'record-bounded-treatment-intent'],
    [6, 'review-boundaries'], [40020, 'reassess'], [40021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, EasyLabelAction])[];
  expert: readonly (readonly [number, EasyLabelAction])[];
  commonError: readonly (readonly [number, EasyLabelAction])[];
  recovery: readonly (readonly [number, EasyLabelAction])[];
};

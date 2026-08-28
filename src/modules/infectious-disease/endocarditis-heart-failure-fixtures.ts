import type { EndocarditisHeartFailureAction } from './endocarditis-heart-failure';

export const ENDOCARDITIS_HEART_FAILURE_FIXTURES = {
  scenarioId: 'endocarditis-mechanical-failure-on-a-surgical-clock', contentVersion: '0.1.0', seed: 5519,
  noAction: [],
  expert: [[0, 'recognize-mechanical-failure'], [1, 'call-endocarditis-team'],
    [2, 'record-surgical-referral-intent'], [3, 'review-boundaries'], [4, 'monitor'],
    [3001, 'reassess'], [27005, 'reassess'], [27006, 'handoff']],
  commonError: [[0, 'markers-improving-means-better'], [1, 'wide-pulse-pressure-expected'],
    [2, 'vegetation-size-alone-decides'], [3, 'continue-antimicrobials-and-review-tomorrow'], [9000, 'check-labs']],
  recovery: [[0, 'markers-improving-means-better'], [1, 'continue-antimicrobials-and-review-tomorrow'],
    [2, 'recognize-mechanical-failure'], [3, 'call-endocarditis-team'],
    [4, 'record-surgical-referral-intent'], [5, 'review-boundaries'], [6, 'monitor'],
    [3002, 'reassess'], [27007, 'reassess'], [27008, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, EndocarditisHeartFailureAction])[];
  expert: readonly (readonly [number, EndocarditisHeartFailureAction])[];
  commonError: readonly (readonly [number, EndocarditisHeartFailureAction])[];
  recovery: readonly (readonly [number, EndocarditisHeartFailureAction])[];
};

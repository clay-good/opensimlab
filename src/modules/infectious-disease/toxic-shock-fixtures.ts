import type { ToxicShockAction } from './toxic-shock';

export const TOXIC_SHOCK_FIXTURES = {
  scenarioId: 'toxic-shock-a-definition-that-cannot-close', contentVersion: '0.1.0', seed: 5731,
  noAction: [],
  expert: [[0, 'recognize-toxin-pattern'], [1, 'activate-critical-care'], [2, 'request-cultures'],
    [3, 'record-treatment-intent'], [4, 'record-definition-status'], [5, 'review-boundaries'],
    [6, 'monitor'], [3001, 'reassess'], [144005, 'reassess'], [144006, 'handoff']],
  commonError: [[0, 'declare-confirmed'], [1, 'criteria-count-excludes'],
    [2, 'pending-cultures-exclude'], [3, 'negative-cultures-mean-no-infection'], [9000, 'check-labs']],
  recovery: [[0, 'declare-confirmed'], [1, 'criteria-count-excludes'], [2, 'recognize-toxin-pattern'],
    [3, 'activate-critical-care'], [4, 'request-cultures'], [5, 'record-treatment-intent'],
    [6, 'record-definition-status'], [7, 'review-boundaries'], [8, 'monitor'],
    [3002, 'reassess'], [144007, 'reassess'], [144008, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ToxicShockAction])[];
  expert: readonly (readonly [number, ToxicShockAction])[];
  commonError: readonly (readonly [number, ToxicShockAction])[];
  recovery: readonly (readonly [number, ToxicShockAction])[];
};

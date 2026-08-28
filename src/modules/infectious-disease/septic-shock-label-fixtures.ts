import type { SepticShockLabelAction } from './septic-shock-label';

export const SEPTIC_SHOCK_LABEL_FIXTURES = {
  scenarioId: 'septic-shock-a-label-the-treatment-creates', contentVersion: '0.1.0', seed: 6127,
  noAction: [],
  expert: [[0, 'record-hypoperfusion'], [1, 'activate-critical-care'], [2, 'record-classification-open'],
    [3, 'record-resuscitation-intent'], [4, 'review-boundaries'], [5, 'monitor'], [3001, 'reassess'],
    [56010, 'reassess'], [56011, 'handoff']],
  commonError: [[0, 'declare-shock-now'], [1, 'lactate-means-hypoxia'],
    [2, 'resuscitate-to-normal-lactate'], [3, 'raise-the-map-target'], [9000, 'check-labs']],
  recovery: [[0, 'declare-shock-now'], [1, 'raise-the-map-target'], [2, 'record-hypoperfusion'],
    [3, 'activate-critical-care'], [4, 'record-classification-open'], [5, 'record-resuscitation-intent'],
    [6, 'review-boundaries'], [7, 'monitor'], [3002, 'reassess'],
    [56020, 'reassess'], [56021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SepticShockLabelAction])[];
  expert: readonly (readonly [number, SepticShockLabelAction])[];
  commonError: readonly (readonly [number, SepticShockLabelAction])[];
  recovery: readonly (readonly [number, SepticShockLabelAction])[];
};

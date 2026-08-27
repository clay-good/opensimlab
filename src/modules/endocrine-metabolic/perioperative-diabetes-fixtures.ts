import type { PerioperativeDiabetesAction } from './perioperative-diabetes';

export const PERIOPERATIVE_DIABETES_FIXTURES = {
  scenarioId: 'perioperative-diabetes-insulin-continuity', contentVersion: '0.1.0', seed: 4931,
  noAction: [],
  expert: [[0, 'restore-insulin'], [1, 'call-support'], [2, 'review-context'], [3, 'plan-fasting'],
    [4, 'monitor'], [18000, 'reassess'], [36000, 'reassess'], [36001, 'handoff']],
  commonError: [[0, 'check-glucose'], [1, 'omit-insulin'], [2, 'cgm-only'], [3, 'clear-surgery'], [36000, 'check-glucose']],
  recovery: [[0, 'check-glucose'], [1, 'omit-insulin'], [2, 'cgm-only'], [3, 'clear-surgery'],
    [36000, 'reassess'], [36001, 'restore-insulin'], [36002, 'call-support'], [36003, 'review-context'],
    [36004, 'plan-fasting'], [36005, 'monitor'], [54001, 'check-glucose'], [72001, 'reassess'], [72002, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PerioperativeDiabetesAction])[];
  expert: readonly (readonly [number, PerioperativeDiabetesAction])[];
  commonError: readonly (readonly [number, PerioperativeDiabetesAction])[];
  recovery: readonly (readonly [number, PerioperativeDiabetesAction])[];
};

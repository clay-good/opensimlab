import type { RenalEstimateAction } from './estimated-filtration';

export const RENAL_ESTIMATE_FIXTURES = {
  scenarioId: 'estimated-filtration-a-number-she-was-never-measured-by', contentVersion: '0.1.0', seed: 5041,
  noAction: [],
  expert: [[0, 'review-precision'], [1, 'review-generation'], [2, 'request-second-marker'],
    [3, 'own-medicine-decision'], [4, 'call-support'], [5, 'monitor'], [3002, 'reassess'],
    [36002, 'review-discordance'], [36003, 'reassess'], [36004, 'handoff']],
  commonError: [[0, 'dose-on-estimate'], [1, 'take-the-convenient-number'], [9000, 'check-creatinine']],
  recovery: [[0, 'dose-on-estimate'], [1, 'take-the-convenient-number'], [2, 'review-precision'],
    [3, 'review-generation'], [4, 'request-second-marker'], [5, 'own-medicine-decision'],
    [6, 'call-support'], [7, 'monitor'], [3004, 'reassess'], [36004, 'review-discordance'],
    [36005, 'reassess'], [36006, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalEstimateAction])[];
  expert: readonly (readonly [number, RenalEstimateAction])[];
  commonError: readonly (readonly [number, RenalEstimateAction])[];
  recovery: readonly (readonly [number, RenalEstimateAction])[];
};

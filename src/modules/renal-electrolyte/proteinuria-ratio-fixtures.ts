import type { RenalProteinuriaAction } from './proteinuria-ratio';

export const RENAL_PROTEINURIA_FIXTURES = {
  scenarioId: 'proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not', contentVersion: '0.1.0', seed: 5077,
  noAction: [],
  // The matched sample is requested at tick 3 and returns 36,000 ticks later, so the closing
  // reassessment has to sit after 36,003 or it captures a picture without it.
  expert: [[0, 'compare-variation'], [1, 'review-sampling'], [2, 'review-patient'], [3, 'request-repeat'],
    [4, 'own-decision'], [5, 'call-support'], [6, 'monitor'], [3002, 'reassess'],
    [36004, 'reassess'], [36005, 'handoff']],
  commonError: [[0, 'call-it-progression'], [1, 'change-treatment'], [9000, 'check-ratio']],
  recovery: [[0, 'call-it-progression'], [1, 'change-treatment'], [2, 'compare-variation'],
    [3, 'review-sampling'], [4, 'review-patient'], [5, 'request-repeat'], [6, 'own-decision'],
    [7, 'call-support'], [8, 'monitor'], [3004, 'reassess'], [36006, 'reassess'], [36007, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalProteinuriaAction])[];
  expert: readonly (readonly [number, RenalProteinuriaAction])[];
  commonError: readonly (readonly [number, RenalProteinuriaAction])[];
  recovery: readonly (readonly [number, RenalProteinuriaAction])[];
};

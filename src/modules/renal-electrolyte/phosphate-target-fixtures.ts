import type { RenalPhosphateAction } from './phosphate-target';

export const RENAL_PHOSPHATE_FIXTURES = {
  scenarioId: 'phosphate-target-a-surrogate-that-moved-the-wrong-way', contentVersion: '0.1.0', seed: 5059,
  noAction: [],
  expert: [[0, 'review-surrogate'], [1, 'review-trial'], [2, 'review-intake'], [3, 'own-decision'],
    [4, 'call-support'], [5, 'monitor'], [3002, 'reassess'], [36002, 'reassess'], [36003, 'handoff']],
  commonError: [[0, 'treat-the-number'], [1, 'restrict-further'], [9000, 'check-phosphate']],
  recovery: [[0, 'treat-the-number'], [1, 'restrict-further'], [2, 'review-surrogate'], [3, 'review-trial'],
    [4, 'review-intake'], [5, 'own-decision'], [6, 'call-support'], [7, 'monitor'],
    [3004, 'reassess'], [36004, 'reassess'], [36005, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalPhosphateAction])[];
  expert: readonly (readonly [number, RenalPhosphateAction])[];
  commonError: readonly (readonly [number, RenalPhosphateAction])[];
  recovery: readonly (readonly [number, RenalPhosphateAction])[];
};

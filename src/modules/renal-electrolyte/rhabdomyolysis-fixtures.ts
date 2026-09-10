import type { RenalRhabdomyolysisAction } from './rhabdomyolysis';

export const RENAL_RHABDOMYOLYSIS_FIXTURES = {
  scenarioId: 'rhabdomyolysis-a-number-that-does-not-carry-the-risk', contentVersion: '0.1.0', seed: 5037,
  noAction: [],
  expert: [[0, 'examine-compartments'], [1, 'review-cause'], [2, 'arrange-fluids'], [3, 'review-number'],
    [4, 'review-additions'], [5, 'call-support'], [6, 'monitor'], [3002, 'reassess'],
    [54002, 'reassess'], [54003, 'handoff']],
  commonError: [[0, 'dialyse-on-number'], [1, 'add-bicarbonate-and-mannitol'], [9000, 'check-creatine-kinase']],
  recovery: [[0, 'dialyse-on-number'], [1, 'add-bicarbonate-and-mannitol'], [2, 'examine-compartments'],
    [3, 'review-cause'], [4, 'arrange-fluids'], [5, 'review-number'], [6, 'review-additions'],
    [7, 'call-support'], [8, 'monitor'], [3004, 'reassess'], [54004, 'reassess'], [54005, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalRhabdomyolysisAction])[];
  expert: readonly (readonly [number, RenalRhabdomyolysisAction])[];
  commonError: readonly (readonly [number, RenalRhabdomyolysisAction])[];
  recovery: readonly (readonly [number, RenalRhabdomyolysisAction])[];
};

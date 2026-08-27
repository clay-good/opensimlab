import type { RenalHypokalemiaAction } from './hypokalemia';

export const RENAL_HYPOKALEMIA_FIXTURES = {
  scenarioId: 'hypokalemia-magnesium-and-ongoing-losses', contentVersion: '0.1.0', seed: 4951,
  noAction: [],
  expert: [[0, 'potassium'], [1, 'magnesium'], [2, 'call-support'], [3, 'review-context'],
    [4, 'manage-losses'], [5, 'monitor'], [18000, 'check-potassium'], [18001, 'reassess'],
    [36001, 'reassess'], [36002, 'handoff']],
  commonError: [[0, 'magnesium'], [1, 'rapid-potassium'], [2, 'stop-monitoring'], [18000, 'check-potassium']],
  recovery: [[0, 'potassium'], [1, 'magnesium'], [2, 'call-support'], [3, 'review-context'], [4, 'monitor'],
    [18000, 'check-potassium'], [18001, 'reassess'], [36001, 'reassess'],
    [36002, 'rapid-potassium'], [36003, 'stop-monitoring'], [72000, 'reassess'],
    [72001, 'manage-losses'], [108001, 'reassess'], [108002, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalHypokalemiaAction])[];
  expert: readonly (readonly [number, RenalHypokalemiaAction])[];
  commonError: readonly (readonly [number, RenalHypokalemiaAction])[];
  recovery: readonly (readonly [number, RenalHypokalemiaAction])[];
};

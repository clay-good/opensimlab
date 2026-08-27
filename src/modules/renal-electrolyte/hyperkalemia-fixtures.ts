import type { RenalHyperkalemiaAction } from './hyperkalemia';

export const RENAL_HYPERKALEMIA_FIXTURES = {
  scenarioId: 'hyperkalemia-cardioprotection-and-rebound', contentVersion: '0.1.0', seed: 4941,
  noAction: [],
  expert: [[0, 'calcium'], [1, 'check-ecg'], [2, 'shift'], [3, 'call-support'], [4, 'review-context'],
    [5, 'plan-removal'], [6, 'deliver-removal'], [7, 'monitor'],
    [18002, 'reassess'], [36006, 'reassess'], [36007, 'handoff']],
  commonError: [[0, 'calcium'], [1, 'check-ecg'], [2, 'ecg-resolved'], [3, 'stop-glucose-monitoring']],
  recovery: [[0, 'calcium'], [1, 'shift'], [2, 'call-support'], [3, 'review-context'], [4, 'plan-removal'],
    [5, 'monitor'], [18001, 'reassess'], [18002, 'ecg-resolved'], [18003, 'stop-glucose-monitoring'],
    [90001, 'reassess'], [90002, 'calcium'], [90003, 'deliver-removal'],
    [126003, 'reassess'], [126004, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalHyperkalemiaAction])[];
  expert: readonly (readonly [number, RenalHyperkalemiaAction])[];
  commonError: readonly (readonly [number, RenalHyperkalemiaAction])[];
  recovery: readonly (readonly [number, RenalHyperkalemiaAction])[];
};

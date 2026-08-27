import type { AvpDeficiencyAction } from './avp-deficiency';

export const AVP_DEFICIENCY_FIXTURES = {
  scenarioId: 'hypernatremic-dehydration-avp-deficiency', contentVersion: '0.1.1', seed: 4919,
  noAction: [],
  expert: [[0, 'restore-volume'], [1, 'review-context'], [2, 'call-support'], [3, 'monitor'],
    [9000, 'reassess'], [9001, 'replace-water'], [9002, 'restore-desmopressin'],
    [81002, 'reassess'], [81003, 'handoff']],
  commonError: [[0, 'normalize-now'], [1, 'withhold-desmopressin'], [18000, 'reassess']],
  recovery: [[0, 'normalize-now'], [1, 'withhold-desmopressin'], [18000, 'reassess'],
    [18001, 'restore-volume'], [18002, 'review-context'], [18003, 'call-support'], [18004, 'monitor'],
    [27001, 'reassess'], [27002, 'restore-desmopressin'], [27003, 'replace-water'],
    [99003, 'reassess'], [99004, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AvpDeficiencyAction])[];
  expert: readonly (readonly [number, AvpDeficiencyAction])[];
  commonError: readonly (readonly [number, AvpDeficiencyAction])[];
  recovery: readonly (readonly [number, AvpDeficiencyAction])[];
};

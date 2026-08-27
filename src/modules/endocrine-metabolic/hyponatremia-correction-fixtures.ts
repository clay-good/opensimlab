import type { HyponatremiaCorrectionAction } from './hyponatremia-correction';

export const HYPONATREMIA_CORRECTION_FIXTURES = {
  scenarioId: 'hyponatremia-aquaresis-and-overcorrection', contentVersion: '0.1.0', seed: 4907,
  noAction: [],
  expert: [[0, 'review-risk'], [1, 'call-support'], [2, 'monitor'], [18000, 'reassess'],
    [18001, 'control-water-loss'], [54001, 'reassess'], [54002, 'handoff']],
  commonError: [[0, 'normalize-now'], [1, 'wait-for-symptoms'], [36000, 'reassess']],
  recovery: [[0, 'normalize-now'], [1, 'wait-for-symptoms'], [36000, 'reassess'],
    [36001, 'relower'], [36002, 'control-water-loss'], [36003, 'review-risk'],
    [36004, 'call-support'], [36005, 'monitor'], [72002, 'reassess'], [72003, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HyponatremiaCorrectionAction])[];
  expert: readonly (readonly [number, HyponatremiaCorrectionAction])[];
  commonError: readonly (readonly [number, HyponatremiaCorrectionAction])[];
  recovery: readonly (readonly [number, HyponatremiaCorrectionAction])[];
};

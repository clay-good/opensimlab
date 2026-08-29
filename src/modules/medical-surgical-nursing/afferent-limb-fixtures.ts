import type { AfferentLimbAction } from './afferent-limb';

export const AFFERENT_LIMB_FIXTURES = {
  scenarioId: 'afferent-limb-a-threshold-met-and-a-call-not-made', contentVersion: '0.1.0', seed: 3608,
  noAction: [],
  expert: [[0, 'record-the-met-criteria'], [1, 'record-the-obstacles'], [2, 'call-the-response-team'],
    [3, 'state-the-concern-explicitly'], [4, 'review-boundaries'], [5, 'monitor'],
    [6010, 'reassess'], [6011, 'handoff']],
  commonError: [[0, 'call-the-doctor-first'], [1, 'wait-for-the-ward-round'],
    [2, 'document-and-wait'], [3, 'ask-permission-to-call'], [9000, 'check-criteria']],
  recovery: [[0, 'call-the-doctor-first'], [1, 'ask-permission-to-call'],
    [2, 'record-the-met-criteria'], [3, 'record-the-obstacles'], [4, 'call-the-response-team'],
    [5, 'state-the-concern-explicitly'], [6, 'review-boundaries'], [7, 'monitor'],
    [6020, 'reassess'], [6021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AfferentLimbAction])[];
  expert: readonly (readonly [number, AfferentLimbAction])[];
  commonError: readonly (readonly [number, AfferentLimbAction])[];
  recovery: readonly (readonly [number, AfferentLimbAction])[];
};

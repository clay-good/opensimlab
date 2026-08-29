import type { MeningitisImagingAction } from './meningitis-imaging';

export const MENINGITIS_IMAGING_FIXTURES = {
  scenarioId: 'meningitis-imaging-a-rule-that-does-not-agree', contentVersion: '0.1.0', seed: 7314,
  noAction: [],
  expert: [[0, 'record-triggering-features'], [1, 'activate-time-critical-owners'],
    [2, 'record-antimicrobial-intent'], [3, 'compare-criteria-sets'], [4, 'review-boundaries'],
    [5, 'monitor'], [3001, 'reassess'], [46010, 'reassess'], [46011, 'handoff']],
  commonError: [[0, 'scan-first-is-safer'], [1, 'delay-antimicrobials-for-the-puncture'],
    [2, 'normal-crp-excludes'], [3, 'negative-gram-stain-excludes'], [9000, 'check-labs']],
  recovery: [[0, 'scan-first-is-safer'], [1, 'normal-crp-excludes'],
    [2, 'record-triggering-features'], [3, 'activate-time-critical-owners'],
    [4, 'record-antimicrobial-intent'], [5, 'compare-criteria-sets'], [6, 'review-boundaries'],
    [7, 'monitor'], [3002, 'reassess'], [46020, 'reassess'], [46021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MeningitisImagingAction])[];
  expert: readonly (readonly [number, MeningitisImagingAction])[];
  commonError: readonly (readonly [number, MeningitisImagingAction])[];
  recovery: readonly (readonly [number, MeningitisImagingAction])[];
};

import type { LastKnownWellAction } from './last-known-well';

export const LAST_KNOWN_WELL_FIXTURES = {
  scenarioId: 'last-known-well-a-time-nobody-can-supply', contentVersion: '0.1.0', seed: 7845,
  noAction: [],
  expert: [[0, 'record-last-known-well'], [1, 'record-the-uncertain-recollection'],
    [2, 'activate-the-stroke-pathway'], [3, 'record-what-the-unknown-changes'],
    [4, 'review-boundaries'], [5, 'monitor'], [6, 'reassess'],
    [12030, 'reassess'], [12031, 'handoff']],
  commonError: [[0, 'chart-the-recollection-as-onset'], [1, 'chart-last-known-well-as-onset'],
    [2, 'unknown-onset-means-nothing-offered'], [3, 'wait-for-the-family-to-confirm'],
    [9000, 'check-the-timeline']],
  recovery: [[0, 'chart-the-recollection-as-onset'], [1, 'wait-for-the-family-to-confirm'],
    [2, 'record-last-known-well'], [3, 'record-the-uncertain-recollection'],
    [4, 'activate-the-stroke-pathway'], [5, 'record-what-the-unknown-changes'],
    [6, 'review-boundaries'], [7, 'monitor'], [8, 'reassess'],
    [12040, 'reassess'], [12041, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, LastKnownWellAction])[];
  expert: readonly (readonly [number, LastKnownWellAction])[];
  commonError: readonly (readonly [number, LastKnownWellAction])[];
  recovery: readonly (readonly [number, LastKnownWellAction])[];
};

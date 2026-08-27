import type { RenalHypermagnesemiaAction } from './hypermagnesemia';

export const RENAL_HYPERMAGNESEMIA_FIXTURES = {
  scenarioId: 'hypermagnesemia-antagonism-and-removal', contentVersion: '0.1.0', seed: 4999,
  noAction: [],
  expert: [[0, 'support-breathing'], [1, 'calcium'], [2, 'deliver-removal'], [3, 'stop-magnesium'],
    [4, 'call-support'], [5, 'review-context'], [6, 'monitor'], [3001, 'reassess'],
    [18001, 'reassess'], [18002, 'calcium'], [36002, 'reassess'], [36003, 'handoff']],
  commonError: [[0, 'calcium-means-clearance'], [1, 'routine-diuresis'], [9000, 'check-magnesium']],
  recovery: [[0, 'calcium-means-clearance'], [1, 'routine-diuresis'], [2, 'support-breathing'], [3, 'calcium'],
    [4, 'stop-magnesium'], [5, 'call-support'], [6, 'review-context'], [7, 'monitor'], [3003, 'reassess'],
    [18003, 'reassess'], [18004, 'calcium'], [18005, 'deliver-removal'], [36004, 'reassess'],
    [36005, 'calcium'], [54005, 'reassess'], [54006, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RenalHypermagnesemiaAction])[];
  expert: readonly (readonly [number, RenalHypermagnesemiaAction])[];
  commonError: readonly (readonly [number, RenalHypermagnesemiaAction])[];
  recovery: readonly (readonly [number, RenalHypermagnesemiaAction])[];
};

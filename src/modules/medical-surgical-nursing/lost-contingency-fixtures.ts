import type { LostContingencyAction } from './lost-contingency';

export const LOST_CONTINGENCY_FIXTURES = {
  scenarioId: 'lost-contingency-a-plan-that-was-not-said', contentVersion: '0.1.0', seed: 6194,
  noAction: [],
  expert: [[0, 'record-what-was-said'], [1, 'check-the-notes'],
    [2, 'record-the-gap-as-a-transmission-gap'], [3, 'reconstruct-the-contingency'],
    [4, 'record-what-the-gap-changes'], [5, 'confirm-the-plan-with-the-team'],
    [6, 'review-boundaries'], [7, 'monitor'], [8, 'reassess'],
    [11_000, 'reassess'], [11_001, 'handoff']],
  commonError: [[0, 'nothing-said-means-nothing-applies'], [1, 'ask-the-day-nurse-to-remember'],
    [2, 'a-quiet-handover-means-a-stable-patient'], [3, 'write-a-plan-of-my-own'],
    [9_000, 'check-the-notes']],
  recovery: [[0, 'nothing-said-means-nothing-applies'], [1, 'write-a-plan-of-my-own'],
    [2, 'record-what-was-said'], [3, 'check-the-notes'],
    [4, 'record-the-gap-as-a-transmission-gap'], [5, 'reconstruct-the-contingency'],
    [6, 'record-what-the-gap-changes'], [7, 'confirm-the-plan-with-the-team'],
    [8, 'review-boundaries'], [9, 'monitor'], [10, 'reassess'],
    [11_010, 'reassess'], [11_011, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, LostContingencyAction])[];
  expert: readonly (readonly [number, LostContingencyAction])[];
  commonError: readonly (readonly [number, LostContingencyAction])[];
  recovery: readonly (readonly [number, LostContingencyAction])[];
};

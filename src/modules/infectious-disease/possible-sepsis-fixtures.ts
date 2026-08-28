import type { PossibleSepsisAction } from './possible-sepsis';

export const POSSIBLE_SEPSIS_FIXTURES = {
  scenarioId: 'possible-sepsis-a-clock-that-runs-either-way', contentVersion: '0.1.0', seed: 5843,
  noAction: [],
  expert: [[0, 'record-time-zero'], [1, 'record-uncertainty'], [2, 'request-time-limited-assessment'],
    [3, 'review-boundaries'], [4, 'monitor'], [3001, 'reassess'],
    [54005, 'reassess'], [54006, 'record-antimicrobial-intent'], [54007, 'reassess'], [54008, 'handoff']],
  commonError: [[0, 'wait-and-see'], [1, 'assign-the-tier'], [2, 'single-test-rules-out'],
    [3, 'defer-without-a-ceiling'], [9000, 'check-labs']],
  recovery: [[0, 'wait-and-see'], [1, 'assign-the-tier'], [2, 'record-time-zero'],
    [3, 'record-uncertainty'], [4, 'request-time-limited-assessment'], [5, 'review-boundaries'],
    [6, 'monitor'], [3002, 'reassess'], [54009, 'record-antimicrobial-intent'],
    [54010, 'reassess'], [54011, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PossibleSepsisAction])[];
  expert: readonly (readonly [number, PossibleSepsisAction])[];
  commonError: readonly (readonly [number, PossibleSepsisAction])[];
  recovery: readonly (readonly [number, PossibleSepsisAction])[];
};

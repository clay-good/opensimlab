import type { TransientResponseAction } from './transient-response';

export const TRANSIENT_RESPONSE_FIXTURES = {
  scenarioId: 'transient-response-a-patient-who-will-not-stay-up', contentVersion: '0.1.0', seed: 6241,
  noAction: [],
  expert: [[0, 'record-the-mechanism-and-the-clock'], [1, 'record-the-shape-of-the-response'],
    [2, 'record-what-a-picture-cannot-do'], [3, 'escalate-to-the-theatre-team'],
    [4, 'record-bounded-operative-intent'], [5, 'review-boundaries'], [6, 'reassess'],
    [4810, 'reassess'], [4811, 'handoff']],
  commonError: [[0, 'he-came-back-up-so-he-is-stable'],
    [1, 'send-him-for-a-scan-before-calling'],
    [2, 'give-another-litre-and-see'],
    [3, 'wait-for-the-cross-matched-blood-before-calling'], [3200, 'check-observations']],
  recovery: [[0, 'he-came-back-up-so-he-is-stable'],
    [1, 'send-him-for-a-scan-before-calling'], [2, 'record-the-mechanism-and-the-clock'],
    [3, 'record-the-shape-of-the-response'], [4, 'record-what-a-picture-cannot-do'],
    [5, 'escalate-to-the-theatre-team'], [6, 'record-bounded-operative-intent'],
    [7, 'review-boundaries'], [8, 'reassess'],
    [4820, 'reassess'], [4821, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, TransientResponseAction])[];
  expert: readonly (readonly [number, TransientResponseAction])[];
  commonError: readonly (readonly [number, TransientResponseAction])[];
  recovery: readonly (readonly [number, TransientResponseAction])[];
};

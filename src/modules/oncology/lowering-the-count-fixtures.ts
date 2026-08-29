import type { LoweringTheCountAction } from './lowering-the-count';

export const LOWERING_THE_COUNT_FIXTURES = {
  scenarioId: 'lowering-the-count-a-number-that-can-be-moved', contentVersion: '0.1.0', seed: 2790,
  noAction: [],
  expert: [[0, 'record-the-clinical-picture-not-the-count'], [1, 'escalate-to-haematology-now'],
    [2, 'record-what-the-count-does-and-does-not-license'], [3, 'record-bounded-cytoreduction-intent'],
    [4, 'review-boundaries'], [24010, 'reassess'], [24011, 'handoff']],
  commonError: [[0, 'the-count-alone-makes-the-diagnosis'], [1, 'send-him-for-apheresis-and-stand-down'],
    [2, 'wait-for-the-marrow-before-calling'], [3, 'treat-the-confusion-as-delirium'],
    [9000, 'check-observations']],
  recovery: [[0, 'the-count-alone-makes-the-diagnosis'], [1, 'send-him-for-apheresis-and-stand-down'],
    [2, 'record-the-clinical-picture-not-the-count'], [3, 'escalate-to-haematology-now'],
    [4, 'record-what-the-count-does-and-does-not-license'], [5, 'record-bounded-cytoreduction-intent'],
    [6, 'review-boundaries'], [24020, 'reassess'], [24021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, LoweringTheCountAction])[];
  expert: readonly (readonly [number, LoweringTheCountAction])[];
  commonError: readonly (readonly [number, LoweringTheCountAction])[];
  recovery: readonly (readonly [number, LoweringTheCountAction])[];
};

import type { FebrileNeutropeniaAction } from './febrile-neutropenia';

export const FEBRILE_NEUTROPENIA_FIXTURES = {
  scenarioId: 'febrile-neutropenia-blind-examination', contentVersion: '0.1.0', seed: 5307,
  noAction: [],
  expert: [[0, 'recognize-neutropenic-fever'], [1, 'activate-pathway'], [2, 'request-cultures'],
    [3, 'record-antimicrobial-intent'], [4, 'review-boundaries'], [5, 'monitor'],
    [3001, 'reassess'], [90005, 'reassess'], [90006, 'handoff']],
  commonError: [[0, 'crp-reassures'], [1, 'score-defers-antimicrobials'], [2, 'wait-for-source'],
    [3, 'expect-leukocytosis'], [9000, 'check-labs']],
  recovery: [[0, 'crp-reassures'], [1, 'wait-for-source'], [2, 'recognize-neutropenic-fever'],
    [3, 'activate-pathway'], [4, 'request-cultures'], [5, 'record-antimicrobial-intent'],
    [6, 'review-boundaries'], [7, 'monitor'], [3002, 'reassess'], [90007, 'reassess'], [90008, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, FebrileNeutropeniaAction])[];
  expert: readonly (readonly [number, FebrileNeutropeniaAction])[];
  commonError: readonly (readonly [number, FebrileNeutropeniaAction])[];
  recovery: readonly (readonly [number, FebrileNeutropeniaAction])[];
};

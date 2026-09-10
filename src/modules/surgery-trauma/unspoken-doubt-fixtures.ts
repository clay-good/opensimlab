import type { UnspokenDoubtAction } from './unspoken-doubt';

export const UNSPOKEN_DOUBT_FIXTURES = {
  scenarioId: 'unspoken-doubt-an-interval-nobody-else-can-see', contentVersion: '0.1.0', seed: 5063,
  noAction: [],
  expert: [[0, 'state-what-you-have-noticed'], [1, 'state-what-would-make-you-wrong'],
    [2, 'state-the-cost-of-each-mistake'], [3, 'say-it-before-the-incision'],
    [4, 'record-bounded-team-intent'], [5, 'review-boundaries'], [6, 'reassess'],
    [1010, 'reassess'], [1011, 'handoff']],
  commonError: [[0, 'wait-until-someone-more-senior-notices'],
    [1, 'you-are-probably-misreading-it'],
    [2, 'ask-a-colleague-quietly-first'],
    [3, 'mention-it-afterwards'], [950, 'check-observations']],
  recovery: [[0, 'wait-until-someone-more-senior-notices'],
    [1, 'you-are-probably-misreading-it'], [2, 'state-what-you-have-noticed'],
    [3, 'state-what-would-make-you-wrong'], [4, 'state-the-cost-of-each-mistake'],
    [5, 'say-it-before-the-incision'], [6, 'record-bounded-team-intent'],
    [7, 'review-boundaries'], [8, 'reassess'],
    [1020, 'reassess'], [1021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, UnspokenDoubtAction])[];
  expert: readonly (readonly [number, UnspokenDoubtAction])[];
  commonError: readonly (readonly [number, UnspokenDoubtAction])[];
  recovery: readonly (readonly [number, UnspokenDoubtAction])[];
};

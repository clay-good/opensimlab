import type { RareEarlyMyocarditisAction } from './rare-early-myocarditis';

export const RARE_EARLY_MYOCARDITIS_FIXTURES = {
  scenarioId: 'rare-early-myocarditis-a-base-rate-is-not-a-threshold', contentVersion: '0.1.0', seed: 5604,
  noAction: [],
  expert: [[0, 'record-the-exposure-interval'], [1, 'record-what-is-present-that-is-not-cardiac'],
    [2, 'arrange-continuous-rhythm-monitoring'], [3, 'escalate-to-both-teams'],
    [4, 'record-bounded-treatment-intent'], [5, 'review-boundaries'],
    [36010, 'reassess'], [36011, 'handoff']],
  commonError: [[0, 'it-is-too-rare-to-be-that'], [1, 'the-troponin-is-raised-in-lots-of-things'],
    [2, 'repeat-the-troponin-in-a-week'], [3, 'treat-it-as-a-coronary-syndrome-and-stop-there'],
    [9000, 'check-observations']],
  recovery: [[0, 'it-is-too-rare-to-be-that'], [1, 'repeat-the-troponin-in-a-week'],
    [2, 'record-the-exposure-interval'], [3, 'record-what-is-present-that-is-not-cardiac'],
    [4, 'arrange-continuous-rhythm-monitoring'], [5, 'escalate-to-both-teams'],
    [6, 'record-bounded-treatment-intent'], [7, 'review-boundaries'],
    [36020, 'reassess'], [36021, 'handoff']],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RareEarlyMyocarditisAction])[];
  expert: readonly (readonly [number, RareEarlyMyocarditisAction])[];
  commonError: readonly (readonly [number, RareEarlyMyocarditisAction])[];
  recovery: readonly (readonly [number, RareEarlyMyocarditisAction])[];
};

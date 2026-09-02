import type { PediatricRespiratoryDistressAction } from './pediatric-respiratory-distress';

/**
 * Reference transcripts for the pediatric respiratory-distress lesson.
 *
 * The common-error path takes the refusal this lesson is built around:
 * reading a respiratory rate that has fallen from 46 to 28, in a child who
 * has become drowsy with shallow irregular breathing, as recovery. The
 * recovery path walks into all four refusals and still reaches a correct
 * handoff.
 */
export const PEDIATRIC_RESPIRATORY_DISTRESS_FIXTURES = {
  scenarioId: 'pediatric-respiratory-distress', contentVersion: '0.1.0', seed: 3620,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-respiratory-distress-whole-child'],
    [1, 'activate-pediatric-respiratory-distress-support'],
    [2, 'review-pediatric-respiratory-distress-early-response'],
    [3, 'review-pediatric-respiratory-distress-later-panel'],
    [4, 'activate-pediatric-respiratory-failure-rescue'],
    [5, 'handoff-pediatric-respiratory-distress-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-respiratory-distress-whole-child'],
    [1, 'activate-pediatric-respiratory-distress-support'],
    [2, 'review-pediatric-respiratory-distress-early-response'],
    [3, 'review-pediatric-respiratory-distress-later-panel'],
    [4, 'treat-pediatric-respiratory-distress-falling-rate-as-recovery'],
  ],
  recovery: [
    [0, 'reconcile-pediatric-respiratory-distress-whole-child'],
    // Both ways of delaying support, before any of it is organized.
    [1, 'complete-pediatric-respiratory-distress-history-first'],
    [2, 'wait-for-pediatric-respiratory-distress-imaging'],
    [3, 'activate-pediatric-respiratory-distress-support'],
    [4, 'review-pediatric-respiratory-distress-early-response'],
    // An improved saturation read as an improved child.
    [5, 'reassure-pediatric-respiratory-distress-saturation-alone'],
    [6, 'review-pediatric-respiratory-distress-later-panel'],
    // And the one the lesson exists for.
    [7, 'treat-pediatric-respiratory-distress-falling-rate-as-recovery'],
    [8, 'activate-pediatric-respiratory-failure-rescue'],
    [9, 'handoff-pediatric-respiratory-distress-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricRespiratoryDistressAction])[];
  expert: readonly (readonly [number, PediatricRespiratoryDistressAction])[];
  commonError: readonly (readonly [number, PediatricRespiratoryDistressAction])[];
  recovery: readonly (readonly [number, PediatricRespiratoryDistressAction])[];
};

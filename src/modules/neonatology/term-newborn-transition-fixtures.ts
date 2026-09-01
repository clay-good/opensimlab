import type { TermTransitionAction } from './term-newborn-transition';

/**
 * Reference transcripts for the term newborn transition lesson.
 *
 * The error path is the one this lesson exists for: the newborn looks well, so
 * the learner declares the transition normal without having confirmed who is
 * prepared or connected the birth, the thermal picture and the parents. Normal
 * assumed rather than established is the shape it refuses. The recovery path
 * starts from exactly those refusals and still reaches a correct handoff in the
 * same run.
 */
export const TERM_TRANSITION_FIXTURES = {
  scenarioId: 'term-newborn-transition', contentVersion: '0.1.0', seed: 2187,
  noAction: [],
  expert: [
    [0, 'activate-term-newborn-transition-prepared-newborn-and-dyad-support'],
    [1, 'reconcile-term-newborn-transition-gestation-birth-breathing-tone-heart-rate-temperature-and-whole-dyad'],
    [2, 'recognize-term-newborn-transition-without-resuscitation-or-well-newborn-closure'],
    [3, 'review-term-newborn-transition-qualified-cord-skin-to-skin-thermal-and-observation-care'],
    [4, 'review-term-newborn-transition-fixed-one-hour-qualified-report'],
    [5, 'handoff-term-newborn-transition-breathing-temperature-feeding-parent-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-term-newborn-transition-without-resuscitation-or-well-newborn-closure'],
    [1, 'review-term-newborn-transition-fixed-one-hour-qualified-report'],
    [2, 'handoff-term-newborn-transition-breathing-temperature-feeding-parent-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-term-newborn-transition-without-resuscitation-or-well-newborn-closure'],
    [1, 'handoff-term-newborn-transition-breathing-temperature-feeding-parent-and-outcome-risk'],
    [2, 'activate-term-newborn-transition-prepared-newborn-and-dyad-support'],
    [3, 'reconcile-term-newborn-transition-gestation-birth-breathing-tone-heart-rate-temperature-and-whole-dyad'],
    [4, 'recognize-term-newborn-transition-without-resuscitation-or-well-newborn-closure'],
    [5, 'review-term-newborn-transition-qualified-cord-skin-to-skin-thermal-and-observation-care'],
    [6, 'review-term-newborn-transition-fixed-one-hour-qualified-report'],
    [7, 'handoff-term-newborn-transition-breathing-temperature-feeding-parent-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, TermTransitionAction])[];
  expert: readonly (readonly [number, TermTransitionAction])[];
  commonError: readonly (readonly [number, TermTransitionAction])[];
  recovery: readonly (readonly [number, TermTransitionAction])[];
};

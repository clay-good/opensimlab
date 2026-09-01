import type { MeconiumTransitionAction } from './meconium-stained-transition';

/**
 * Reference transcripts for the meconium-stained transition lesson.
 *
 * The error path declines the suction without having earned the right to. The
 * answer this lesson arrives at is the same one a learner can guess from the
 * title, and guessing it is not the lesson: recognizing a vigorous transition
 * requires the attendance, the fluid character, the breathing, the tone, the
 * heart rate and the visible airway first. The recovery path starts from
 * exactly those refusals and still reaches a correct handoff in the same run.
 */
export const MECONIUM_TRANSITION_FIXTURES = {
  scenarioId: 'meconium-stained-transition', contentVersion: '0.1.0', seed: 8409,
  noAction: [],
  expert: [
    [0, 'activate-meconium-stained-transition-prepared-newborn-airway-and-dyad-support'],
    [1, 'reconcile-meconium-stained-transition-fluid-breathing-tone-heart-rate-airway-and-whole-dyad'],
    [2, 'recognize-vigorous-meconium-stained-transition-without-routine-suction'],
    [3, 'review-qualified-selective-airway-clearing-observation-and-escalation-boundaries'],
    [4, 'review-meconium-stained-transition-fixed-thirty-minute-qualified-report'],
    [5, 'handoff-meconium-stained-transition-respiratory-thermal-feeding-parent-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-vigorous-meconium-stained-transition-without-routine-suction'],
    [1, 'review-meconium-stained-transition-fixed-thirty-minute-qualified-report'],
    [2, 'handoff-meconium-stained-transition-respiratory-thermal-feeding-parent-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-vigorous-meconium-stained-transition-without-routine-suction'],
    [1, 'handoff-meconium-stained-transition-respiratory-thermal-feeding-parent-and-outcome-risk'],
    [2, 'activate-meconium-stained-transition-prepared-newborn-airway-and-dyad-support'],
    [3, 'reconcile-meconium-stained-transition-fluid-breathing-tone-heart-rate-airway-and-whole-dyad'],
    [4, 'recognize-vigorous-meconium-stained-transition-without-routine-suction'],
    [5, 'review-qualified-selective-airway-clearing-observation-and-escalation-boundaries'],
    [6, 'review-meconium-stained-transition-fixed-thirty-minute-qualified-report'],
    [7, 'handoff-meconium-stained-transition-respiratory-thermal-feeding-parent-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MeconiumTransitionAction])[];
  expert: readonly (readonly [number, MeconiumTransitionAction])[];
  commonError: readonly (readonly [number, MeconiumTransitionAction])[];
  recovery: readonly (readonly [number, MeconiumTransitionAction])[];
};

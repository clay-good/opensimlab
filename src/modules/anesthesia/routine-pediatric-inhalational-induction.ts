import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the paediatric inhalational-
 * induction lesson.
 *
 * The thirty-ninth and last anaesthesia lab. Its third objective reads the sixty
 * seconds immediately after the vaporizer is turned down -- not the best sixty
 * seconds of the case -- which makes when to reduce the whole of the skill.
 */

/** The three declared objectives, in order, as the scenario states them. */
export const ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION_OBJECTIVES = [
  'prepare-pediatric-inhalational-circuit',
  'follow-pediatric-end-tidal-wash-in',
  'settle-pediatric-volatile-depth',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Checks the child as well as the objectives: the module's other paediatric
 * induction lesson has a same-sized child and a different route in.
 */
export function supportsRoutinePediatricInhalationalInduction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'routine-pediatric-inhalational-induction'
    && scenario.patient.ageYears === 6 && scenario.patient.weightKg === 20
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION_OBJECTIVES.join('|');
}

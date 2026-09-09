import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the paediatric IV-induction
 * lesson.
 *
 * The thirty-eighth anaesthesia lab. Its second objective scores the UNIT the
 * dose was entered in, not the milligrams that resulted: the same 60 mg reaches
 * this 20 kg child either way, and only one of the two entries is credited.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const ROUTINE_PEDIATRIC_IV_INDUCTION_OBJECTIVES = [
  'preoxygenate-child',
  'dose-pediatric-propofol',
  'ventilate-child-by-weight',
  'avoid-pediatric-desaturation',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Checks the child's age and weight as well as the objectives, because the
 * module's other paediatric induction lesson shares three of the four objective
 * ids and differs in how the child is induced.
 */
export function supportsRoutinePediatricIvInduction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'routine-pediatric-iv-induction'
    && scenario.patient.ageYears === 6 && scenario.patient.weightKg === 20
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ROUTINE_PEDIATRIC_IV_INDUCTION_OBJECTIVES.join('|');
}

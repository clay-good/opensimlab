import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the geriatric-induction lesson.
 *
 * The eleventh anaesthesia lab, and the counterpart to routine induction: the
 * same uneventful case, in a seventy-six-year-old, with the labelled older-adult
 * dose range and an objective that asks for it in increments.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const ROUTINE_GERIATRIC_INDUCTION_OBJECTIVES = [
  'preoxygenate-older-adult',
  'titrate-geriatric-propofol',
  'protect-geriatric-perfusion',
  'ventilate-geriatric-induction',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the age, because every threshold in this lesson is the older-adult
 * one: an end-tidal endpoint of 0.85 rather than 0.90, a total of 1 to 1.5 mg/kg
 * rather than 2, and a 20 mg ceiling on any single increment.
 */
export function supportsRoutineGeriatricInduction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'routine-geriatric-induction'
    && scenario.patient.ageYears >= 70
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ROUTINE_GERIATRIC_INDUCTION_OBJECTIVES.join('|');
}

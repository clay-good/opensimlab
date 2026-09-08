import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the obstetric-general-anaesthesia
 * lesson.
 *
 * The tenth anaesthesia lab. Its objectives are the rapid-sequence ones tightened
 * for a pregnant patient: the saturation floor is 95% rather than 92%, and the
 * preparation objective asks for a fresh-gas flow as well as an inspired fraction,
 * because a circle system at 2 L/min does not wash a functional residual capacity
 * out however high the dial reads.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const OBSTETRIC_GENERAL_ANESTHESIA_OBJECTIVES = [
  'prepare-obstetric-oxygen-reserve',
  'wait-for-intubating-block',
  'protect-obstetric-apnea-margin',
  'confirm-obstetric-ventilation',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * The formulary is the discriminator: this lesson stocks rocuronium at 1.0 and
 * 1.2 mg/kg only, with no lower option and no reversal, because the whole case
 * is the induction and the airway rather than the block's recovery.
 */
export function supportsObstetricGeneralAnesthesia(scenario: Scenario): boolean {
  const rocuronium = scenario.formulary.find((entry) => entry.drugId === 'rocuronium');
  return scenario.metadata.id === 'obstetric-general-anesthesia'
    && rocuronium !== undefined
    && rocuronium.presets.every((preset) => preset.unit === 'mg/kg' && preset.amount >= 1)
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === OBSTETRIC_GENERAL_ANESTHESIA_OBJECTIVES.join('|');
}

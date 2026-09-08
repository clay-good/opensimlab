import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the rapid-sequence-induction
 * lesson.
 *
 * The fourth anaesthesia lab, and the first one whose central quantity is not a
 * pressure or a saturation but a block. It shares the ordinary cockpit with the
 * three before it and adds one syringe and one monitor: rocuronium, and a
 * quantitative train-of-four.
 */

/** The five declared objectives, in order, as the scenario states them. */
export const RAPID_SEQUENCE_INDUCTION_OBJECTIVES = [
  'preoxygenate-before-induction',
  'wait-for-intubating-block',
  'protect-the-apnea-margin',
  'secure-and-confirm',
  'reverse-observed-block',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * The patient is named by the two properties the transcripts depend on: a
 * bolus-only rocuronium syringe, and a quantitative train-of-four on the screen.
 * Without either of them three of these five objectives cannot be scored at all.
 */
export function supportsRapidSequenceInduction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'rapid-sequence-induction'
    && scenario.equipment.monitoring.includes('train-of-four')
    && scenario.formulary.some((entry) => entry.drugId === 'rocuronium'
      && entry.deliveryModes?.join('|') === 'bolus')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === RAPID_SEQUENCE_INDUCTION_OBJECTIVES.join('|');
}

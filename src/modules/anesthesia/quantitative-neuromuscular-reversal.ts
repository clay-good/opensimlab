import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the quantitative-reversal
 * lesson.
 *
 * The fifteenth anaesthesia lab, and the one rapid-sequence induction sets up.
 * That lesson had to reverse a block as its last objective; this one is about
 * nothing else, and its whole argument is that the post-tetanic count cannot
 * tell you which limb of the block you are on.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const QUANTITATIVE_REVERSAL_OBJECTIVES = [
  'establish-quantitative-baseline',
  'reverse-recovering-block',
  'confirm-quantitative-recovery',
  'maintain-anesthesia-during-block',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the single-preset formulary: this lesson stocks rocuronium at
 * 0.6 mg/kg and nothing else, because the dose is fixed so that everything the
 * objectives measure is about the monitor rather than the syringe.
 */
export function supportsQuantitativeNeuromuscularReversal(scenario: Scenario): boolean {
  const rocuronium = scenario.formulary.find((entry) => entry.drugId === 'rocuronium');
  return scenario.metadata.id === 'quantitative-neuromuscular-reversal'
    && scenario.formulary.length === 1
    && rocuronium?.presets.length === 1
    && rocuronium.presets[0]?.amount === 0.6
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === QUANTITATIVE_REVERSAL_OBJECTIVES.join('|');
}

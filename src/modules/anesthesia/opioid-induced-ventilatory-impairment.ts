import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the opioid-induced
 * ventilatory-impairment lesson.
 *
 * The twenty-third anaesthesia lab, and the one whose counterfactual is an
 * intervention that makes the monitored number better while treating nothing.
 */

/** The five declared objectives, in order, as the scenario states them. */
export const OPIOID_INDUCED_VENTILATORY_IMPAIRMENT_OBJECTIVES = [
  'recognize-opioid-ventilatory-impairment',
  'support-opioid-impaired-ventilation',
  'prevent-further-opioid-harm',
  'escalate-opioid-reversal',
  'reassess-opioid-ventilatory-recovery',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted onset event rather than a narrative target, because the
 * whole rubric measures delay FROM that event: without it there is no clock to
 * score against and every timed objective is not-exercised.
 */
export function supportsOpioidInducedVentilatoryImpairment(scenario: Scenario): boolean {
  return scenario.metadata.id === 'opioid-induced-ventilatory-impairment'
    && scenario.timeline.some((event) => event.type === 'opioid-ventilatory-impairment')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === OPIOID_INDUCED_VENTILATORY_IMPAIRMENT_OBJECTIVES.join('|');
}

import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the LAST lesson.
 *
 * The twelfth anaesthesia lab. Like the dilutional-coagulopathy one, its central
 * argument is enforced by the engine rather than scored by the rubric: during
 * modelled local-anaesthetic toxicity an intravenous epinephrine bolus above
 * 1 microgram per kilogram is refused outright, so the ASRA reduced-dose rule is
 * a precondition of the action rather than an opinion about it.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const LAST_OBJECTIVES = [
  'recognize-last-pattern',
  'support-last-airway-and-seizure',
  'start-last-lipid',
  'use-reduced-last-epinephrine',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the modelled exposure, because every window in this lesson is
 * measured from it and the lipid, benzodiazepine and reduced-epinephrine actions
 * are all refused by the engine unless it is running.
 */
export function supportsLocalAnestheticSystemicToxicity(scenario: Scenario): boolean {
  return scenario.metadata.id === 'local-anesthetic-systemic-toxicity'
    && scenario.timeline.some((event) => event.type === 'local-anesthetic-toxicity')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === LAST_OBJECTIVES.join('|');
}

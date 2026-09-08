import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the early-MH lesson.
 *
 * The thirteenth anaesthesia lab, and the only one so far whose crisis the
 * LEARNER causes. The malignant-hyperthermia event is latent: it fires on
 * genuine end-tidal volatile exposure rather than at a tick, so a session in
 * which nobody turns the vaporizer on never develops rigidity and exercises
 * none of the four objectives.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const EARLY_MH_OBJECTIVES = [
  'recognize-mh-hypermetabolism',
  'stop-trigger-and-hyperventilate',
  'give-initial-dantrolene',
  'reassess-mh-response',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the latent trigger, because without it the scenario has no crisis at
 * all: every window is measured from the first modelled rigidity, and rigidity
 * only appears once volatile has actually reached the patient.
 */
export function supportsEarlyMalignantHyperthermia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'early-malignant-hyperthermia-during-volatile-anesthesia'
    && scenario.timeline.some((event) => event.type === 'malignant-hyperthermia'
      && event.target === 'volatile-trigger')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === EARLY_MH_OBJECTIVES.join('|');
}

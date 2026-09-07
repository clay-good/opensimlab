import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the rapid-desaturation lesson.
 *
 * Like routine induction it has no tray of its own: it drives the ordinary
 * cockpit and its objectives are scored on physiological trajectories. What it
 * adds is the airway, and the decision the difficult-airway guideline is built
 * around — how many attempts, and when to stop.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const RAPID_DESATURATION_OBJECTIVES = [
  'preoxygenate',
  'ventilate-before-desaturation',
  'limit-attempts',
  'hysteresis',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * The patient is named by the two properties the transcripts actually depend on:
 * a difficult airway and an obese respiratory profile. Routine induction shares
 * this formulary and three of these four objective ids, and must not match.
 */
export function supportsRapidDesaturation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'rapid-desaturation'
    && scenario.patient.respiratory?.profile === 'obese'
    && scenario.patient.airway.difficultMaskVentilation === true
    && scenario.patient.airway.difficulty > 0.5
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === RAPID_DESATURATION_OBJECTIVES.join('|');
}

import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the hypotension-after-induction
 * lesson.
 *
 * Like the two lessons before it this one has no tray of its own: it drives the
 * ordinary cockpit. What it adds is the fluid bag, and the decision the two
 * previous lessons never had to make — whether the pressure fell because the
 * vessels dilated or because the tank is empty, because the treatment that works
 * for one only borrows time from the other.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const HYPOTENSION_AFTER_INDUCTION_OBJECTIVES = [
  'dose-for-the-patient',
  'manage-hypotension',
  'read-the-mechanism',
  'ventilate-before-desaturation',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * The patient is named by the three properties the transcripts actually depend
 * on: she is elderly, she is 15% down on circulating volume before anything is
 * given, and an ACE inhibitor taken this morning has left her defending that
 * pressure poorly. Every one of those three is what the fixtures measure.
 */
export function supportsHypotensionAfterInduction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hypotension-after-induction'
    && scenario.patient.ageYears >= 70
    && scenario.patient.baseline.bloodVolumeMl === 3100
    && scenario.patient.baseline.baroreflexGain === 0.55
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HYPOTENSION_AFTER_INDUCTION_OBJECTIVES.join('|');
}

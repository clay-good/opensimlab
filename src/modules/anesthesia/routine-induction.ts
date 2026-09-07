import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the routine-induction lesson.
 *
 * This lesson is unlike every module lesson in the catalog. It has no tray of
 * its own and no `<id>-response` action: it drives the ordinary cockpit — the
 * flowmeter, two syringes, a laryngoscope, a ventilator — and its objectives are
 * scored on physiological trajectories rather than on recorded steps. Seconds at
 * an end-tidal oxygen fraction, seconds of mean pressure below a threshold, the
 * percentage a heart rate rose after incision. There is no state sidecar to name
 * because the patient IS the state.
 */

/** The five declared objectives, in order, as the scenario states them. */
export const ROUTINE_INDUCTION_OBJECTIVES = [
  'preoxygenate',
  'hysteresis',
  'manage-hypotension',
  'ventilate-before-desaturation',
  'blunt-incision',
] as const;

/**
 * The same identity guard the demonstration applies, so nothing reads a
 * look-alike.
 *
 * Both drugs are named, because the reference transcripts give doses in this
 * formulary's units and a scenario that carried a different formulary would
 * replay them into a different patient.
 */
export function supportsRoutineInduction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'routine-induction'
    && scenario.formulary.map((entry) => entry.drugId).join('|') === 'propofol|remifentanil'
    && scenario.timeline.filter((event) => event.type === 'surgical-stimulus').length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ROUTINE_INDUCTION_OBJECTIVES.join('|');
}

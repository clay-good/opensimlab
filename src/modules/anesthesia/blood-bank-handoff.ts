import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the blood-bank-handoff lesson.
 *
 * The thirty-second anaesthesia lab, and the only one in the module where a
 * REFUSED action is itself the penalty: reaching for blood before the release is
 * declined by the engine, and the second objective never recovers from it.
 */

/** The three declared objectives, in order, as the scenario states them. */
export const BLOOD_BANK_HANDOFF_OBJECTIVES = [
  'request-blood-bank-release',
  'use-released-red-cells',
  'reassess-red-cell-response',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted blood-loss event, because the bounded release action is
 * available only while modelled hemorrhage is running and every objective is
 * timed from its onset.
 */
export function supportsBloodBankHandoff(scenario: Scenario): boolean {
  return scenario.metadata.id === 'blood-bank-handoff'
    && scenario.timeline.some((event) => event.type === 'blood-loss')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === BLOOD_BANK_HANDOFF_OBJECTIVES.join('|');
}

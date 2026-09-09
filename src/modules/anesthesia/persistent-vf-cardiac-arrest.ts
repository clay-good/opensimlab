import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the persistent-VF lesson.
 *
 * The thirty-seventh anaesthesia lab. Emergency medicine ships a lesson of the
 * same shape under the id `persistent-vf-arrest`, and its guard checks that id,
 * so the two never answer for each other -- this one needs its own everything.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const PERSISTENT_VF_CARDIAC_ARREST_OBJECTIVES = [
  'resume-arrest-compressions',
  'give-arrest-epinephrine',
  'defibrillate-persistent-vf',
  'avoid-shocking-nonshockable-rhythm',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted rhythm change, because every bounded arrest action is
 * refused unless the scripted arrest is active -- including, importantly, after
 * return of spontaneous circulation has ended it.
 */
export function supportsPersistentVfCardiacArrest(scenario: Scenario): boolean {
  return scenario.metadata.id === 'persistent-vf-cardiac-arrest'
    && scenario.timeline.some((event) => event.type === 'rhythm-change'
      && event.target === 'ventricular-fibrillation')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PERSISTENT_VF_CARDIAC_ARREST_OBJECTIVES.join('|');
}

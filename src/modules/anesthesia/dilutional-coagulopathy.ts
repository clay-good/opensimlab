import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the dilutional-coagulopathy
 * lesson.
 *
 * The ninth anaesthesia lab, and the sequel to the haemorrhage one: this is the
 * patient whose earlier blood loss was replaced predominantly with crystalloid,
 * arriving at the point where that decision presents its bill.
 *
 * It is also the first lesson in the module whose central argument the ENGINE
 * enforces rather than the rubric merely scoring. Plasma is refused outright
 * until a coagulation panel has been reported, so "use the lab, not the volume
 * lost" is a precondition of the action and not an opinion about it.
 */

/** The three declared objectives, in order, as the scenario states them. */
export const DILUTIONAL_COAGULOPATHY_OBJECTIVES = [
  'identify-dilutional-coagulopathy',
  'give-lab-guided-plasma',
  'reassess-coagulation-response',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the oozing cue every window is measured from and by the continuing
 * loss, because the panel, the plasma and the repeat panel are all refused by
 * the engine unless modelled bleeding is running.
 */
export function supportsDilutionalCoagulopathy(scenario: Scenario): boolean {
  return scenario.metadata.id === 'dilutional-coagulopathy'
    && scenario.timeline.some((event) => event.id === 'diffuse-oozing')
    && scenario.timeline.some((event) => event.type === 'blood-loss')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === DILUTIONAL_COAGULOPATHY_OBJECTIVES.join('|');
}

import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the perioperative-anaphylaxis
 * lesson.
 *
 * The fourteenth anaesthesia lab. Its whole argument is a drug substitution: a
 * vasopressor and epinephrine both raise a collapsed pressure on the monitor,
 * both are on the tray, and only one of them treats what is happening.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const PERIOPERATIVE_ANAPHYLAXIS_OBJECTIVES = [
  'recognize-anaphylaxis-pattern',
  'give-initial-epinephrine',
  'support-anaphylaxis-circulation',
  'support-anaphylaxis-oxygenation',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the modelled exposure, because every window is measured from it and
 * the first two objectives have nothing to score without it.
 */
export function supportsPerioperativeAnaphylaxis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'perioperative-anaphylaxis-after-antibiotic'
    && scenario.timeline.some((event) => event.type === 'anaphylaxis')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PERIOPERATIVE_ANAPHYLAXIS_OBJECTIVES.join('|');
}

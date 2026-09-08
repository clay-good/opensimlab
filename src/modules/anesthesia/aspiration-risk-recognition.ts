import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the aspiration-risk lesson.
 *
 * The seventeenth anaesthesia lab, and the second focused decision vignette:
 * five bounded choices, no drugs, no dials, and an engine that enforces the
 * order rather than scoring it.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const ASPIRATION_RISK_OBJECTIVES = [
  'review-aspiration-risk-cues',
  'classify-elevated-aspiration-risk',
  'choose-shared-elective-plan',
  'avoid-blanket-glp1-rule',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the narrative target the engine itself checks before offering any of
 * the five choices: without it every action in this lesson is refused as
 * belonging to another scenario.
 */
export function supportsAspirationRiskRecognition(scenario: Scenario): boolean {
  return scenario.metadata.id === 'aspiration-risk-recognition'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'aspiration-risk-recognition')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ASPIRATION_RISK_OBJECTIVES.join('|');
}

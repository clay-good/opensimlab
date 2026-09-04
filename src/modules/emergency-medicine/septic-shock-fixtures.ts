import type { SepticShockAction } from './septic-shock';

/**
 * Reference transcripts for the emergency septic-shock lesson.
 *
 * Every path begins at tick 1. The sepsis pattern is declared at tick 0 and is
 * not active until the first engine step, so the engine refuses these controls
 * outright before then.
 *
 * The common-error path is the one that lets the source wait its turn: the
 * evidence, the cultures, the antimicrobial, the fluid, the reassessment and
 * the vasopressor are all recorded correctly, and the run ends without anyone
 * having escalated the obstructed urinary source. The engine never refuses
 * that — source control is gated only by the review — which is precisely why
 * the objective has to catch it.
 */
export const SEPTIC_SHOCK_FIXTURES = {
  scenarioId: 'septic-shock', contentVersion: '0.1.0', seed: 7409,
  noAction: [],
  expert: [
    [1, 'review-infection-and-organ-dysfunction'],
    [2, 'obtain-cultures-and-lactate'],
    [3, 'record-immediate-antimicrobial-intent'],
    [4, 'begin-initial-crystalloid'],
    [5, 'reassess-after-initial-fluid'],
    [6, 'start-norepinephrine-intent'],
    [7, 'escalate-source-control'],
  ],
  commonError: [
    [1, 'review-infection-and-organ-dysfunction'],
    [2, 'obtain-cultures-and-lactate'],
    [3, 'record-immediate-antimicrobial-intent'],
    [4, 'begin-initial-crystalloid'],
    [5, 'reassess-after-initial-fluid'],
    [6, 'start-norepinephrine-intent'],
    // No source control. Nothing is refused; the drainage simply never happens.
  ],
  recovery: [
    // Refused outright: the sepsis pattern is not yet active.
    [0, 'review-infection-and-organ-dysfunction'],
    [1, 'review-infection-and-organ-dysfunction'],
    // The antimicrobial before the cultures that must precede it.
    [2, 'record-immediate-antimicrobial-intent'],
    [3, 'obtain-cultures-and-lactate'],
    [4, 'record-immediate-antimicrobial-intent'],
    // Source control taken early, which the engine allows and the lesson wants.
    [5, 'escalate-source-control'],
    [6, 'begin-initial-crystalloid'],
    // The reassessment on the same tick as the fluid course.
    [6, 'reassess-after-initial-fluid'],
    [7, 'reassess-after-initial-fluid'],
    [8, 'start-norepinephrine-intent'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SepticShockAction])[];
  expert: readonly (readonly [number, SepticShockAction])[];
  commonError: readonly (readonly [number, SepticShockAction])[];
  recovery: readonly (readonly [number, SepticShockAction])[];
};

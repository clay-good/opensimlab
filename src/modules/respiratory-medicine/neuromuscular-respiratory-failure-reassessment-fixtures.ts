import type { NeuromuscularRespiratoryFailureAction } from './neuromuscular-respiratory-failure-reassessment';

/**
 * Reference transcripts for the neuromuscular respiratory-failure lesson.
 *
 * Escalation and the bulbar, cough and alternatives review are two parallel
 * lanes, so the order between them is not the failure. The error path is
 * coordinating shared ownership with the safety-review lane still empty —
 * which is how a team agrees who owns the plan before anyone has asked what
 * his cough, his swallowing or his triggers actually look like.
 */
export const NEUROMUSCULAR_RESPIRATORY_FAILURE_FIXTURES = {
  scenarioId: 'neuromuscular-respiratory-failure-reassessment', contentVersion: '0.1.0', seed: 3158,
  noAction: [],
  expert: [
    [0, 'reconcile-neuromuscular-respiratory-failure-trajectory'],
    [1, 'recognize-neuromuscular-respiratory-failure'],
    [2, 'activate-neuromuscular-respiratory-failure-escalation'],
    [3, 'review-neuromuscular-respiratory-failure-bulbar-cough-and-alternatives'],
    [4, 'coordinate-neuromuscular-respiratory-failure-goals-and-ownership'],
    [5, 'handoff-neuromuscular-respiratory-failure-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-neuromuscular-respiratory-failure-trajectory'],
    [1, 'recognize-neuromuscular-respiratory-failure'],
    [2, 'activate-neuromuscular-respiratory-failure-escalation'],
    [3, 'coordinate-neuromuscular-respiratory-failure-goals-and-ownership'],
  ],
  recovery: [
    [0, 'reconcile-neuromuscular-respiratory-failure-trajectory'],
    [1, 'recognize-neuromuscular-respiratory-failure'],
    [2, 'activate-neuromuscular-respiratory-failure-escalation'],
    [3, 'coordinate-neuromuscular-respiratory-failure-goals-and-ownership'],
    [4, 'review-neuromuscular-respiratory-failure-bulbar-cough-and-alternatives'],
    [5, 'coordinate-neuromuscular-respiratory-failure-goals-and-ownership'],
    [6, 'handoff-neuromuscular-respiratory-failure-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NeuromuscularRespiratoryFailureAction])[];
  expert: readonly (readonly [number, NeuromuscularRespiratoryFailureAction])[];
  commonError: readonly (readonly [number, NeuromuscularRespiratoryFailureAction])[];
  recovery: readonly (readonly [number, NeuromuscularRespiratoryFailureAction])[];
};

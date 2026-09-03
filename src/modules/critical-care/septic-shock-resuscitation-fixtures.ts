import type { SepticShockResuscitationAction } from './septic-shock-resuscitation';

/**
 * Reference transcripts for the persistent septic-shock lesson.
 *
 * The common-error path is the one the patient's appearance invites: the prior
 * claims are reconciled and the learner goes straight to the plan, skipping the
 * perfusion review and the dynamic test — which is exactly the sequence that
 * ends in another bolus. The recovery path skips each of the two intervening
 * steps in turn, is refused for both, and still completes from the same
 * positions.
 */
export const SEPTIC_SHOCK_RESUSCITATION_FIXTURES = {
  scenarioId: 'septic-shock-resuscitation', contentVersion: '0.1.0', seed: 5821,
  noAction: [],
  expert: [
    [0, 'reconcile-septic-shock-resuscitation-so-far'],
    [1, 'reassess-septic-shock-perfusion'],
    [2, 'test-septic-shock-fluid-responsiveness'],
    [3, 'individualize-septic-shock-support-and-source-control'],
    [4, 'reassess-septic-shock-trajectory'],
  ],
  commonError: [
    [0, 'reconcile-septic-shock-resuscitation-so-far'],
    // Straight to the plan, with neither the perfusion nor the dynamic test.
    [1, 'individualize-septic-shock-support-and-source-control'],
    [2, 'reassess-septic-shock-trajectory'],
  ],
  recovery: [
    // The perfusion review before the claims have been separated.
    [0, 'reassess-septic-shock-perfusion'],
    [1, 'reconcile-septic-shock-resuscitation-so-far'],
    // The dynamic test before the perfusion review.
    [2, 'test-septic-shock-fluid-responsiveness'],
    [3, 'reassess-septic-shock-perfusion'],
    [4, 'test-septic-shock-fluid-responsiveness'],
    [5, 'individualize-septic-shock-support-and-source-control'],
    [6, 'reassess-septic-shock-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SepticShockResuscitationAction])[];
  expert: readonly (readonly [number, SepticShockResuscitationAction])[];
  commonError: readonly (readonly [number, SepticShockResuscitationAction])[];
  recovery: readonly (readonly [number, SepticShockResuscitationAction])[];
};

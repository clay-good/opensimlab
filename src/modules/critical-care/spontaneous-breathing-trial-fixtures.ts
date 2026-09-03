import type { SpontaneousBreathingTrialAction } from './spontaneous-breathing-trial';

/**
 * Reference transcripts for the spontaneous-breathing-trial lesson.
 *
 * The common-error path is the one enthusiasm invites: the trial is started on
 * a patient nobody assessed, which the engine refuses, and the readiness review
 * that would have made the trial mean something never happens. The recovery
 * path skips each intervening step in turn, is refused for both, and still
 * completes from the same positions.
 */
export const SPONTANEOUS_BREATHING_TRIAL_FIXTURES = {
  scenarioId: 'spontaneous-breathing-trial', contentVersion: '0.1.0', seed: 7132,
  noAction: [],
  expert: [
    [0, 'review-sbt-readiness'],
    [1, 'start-bounded-sbt'],
    [2, 'recognize-sbt-failure'],
    [3, 'stop-failed-sbt-and-recover'],
    [4, 'plan-after-failed-sbt'],
  ],
  commonError: [
    // Straight to the trial, on a patient nobody assessed.
    [0, 'start-bounded-sbt'],
    [1, 'recognize-sbt-failure'],
    [2, 'stop-failed-sbt-and-recover'],
  ],
  recovery: [
    // The failure panel before anyone has been assessed.
    [0, 'recognize-sbt-failure'],
    [1, 'review-sbt-readiness'],
    [2, 'start-bounded-sbt'],
    [3, 'recognize-sbt-failure'],
    // The plan before the failed trial has been stopped.
    [4, 'plan-after-failed-sbt'],
    [5, 'stop-failed-sbt-and-recover'],
    [6, 'plan-after-failed-sbt'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SpontaneousBreathingTrialAction])[];
  expert: readonly (readonly [number, SpontaneousBreathingTrialAction])[];
  commonError: readonly (readonly [number, SpontaneousBreathingTrialAction])[];
  recovery: readonly (readonly [number, SpontaneousBreathingTrialAction])[];
};

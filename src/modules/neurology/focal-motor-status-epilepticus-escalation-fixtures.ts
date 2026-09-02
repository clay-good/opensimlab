import type { FocalMotorStatusAction } from './focal-motor-status-epilepticus-escalation';

/**
 * Reference transcripts for the focal-motor-status lesson.
 *
 * The error path is the one a partial response invites: the bilateral
 * convulsions stopped, the room got calmer, so move on to the airway, the
 * glucose and the search for a cause. It is an ordering error rather than a
 * treatment error, because this lesson delivers no treatment. What it skips is
 * the beat that says the seizure has not stopped — overt left face and arm
 * clonus is still running and she has not come back — and everything after
 * that depends on having said it. The recovery path starts from that refusal
 * and still reaches a correct handoff in the same run.
 */
export const FOCAL_MOTOR_STATUS_FIXTURES = {
  scenarioId: 'focal-motor-status-epilepticus-escalation', contentVersion: '0.1.0', seed: 6269,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-focal-motor-status-clock-semiology-recovery-and-whole-patient'],
    [1, 'recognize-neurology-focal-motor-status-despite-reduced-convulsions'],
    [2, 'activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership'],
    [3, 'review-neurology-focal-motor-status-airway-glucose-causes-and-injury-boundary'],
    [4, 'review-neurology-focal-motor-status-strict-later-visible-motor-trajectory'],
    [5, 'handoff-neurology-focal-motor-status-recovery-cause-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-focal-motor-status-clock-semiology-recovery-and-whole-patient'],
    [1, 'review-neurology-focal-motor-status-airway-glucose-causes-and-injury-boundary'],
    [2, 'review-neurology-focal-motor-status-strict-later-visible-motor-trajectory'],
  ],
  recovery: [
    [0, 'reconcile-neurology-focal-motor-status-clock-semiology-recovery-and-whole-patient'],
    [1, 'review-neurology-focal-motor-status-airway-glucose-causes-and-injury-boundary'],
    [2, 'recognize-neurology-focal-motor-status-despite-reduced-convulsions'],
    [3, 'activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership'],
    [4, 'review-neurology-focal-motor-status-airway-glucose-causes-and-injury-boundary'],
    [5, 'review-neurology-focal-motor-status-strict-later-visible-motor-trajectory'],
    [6, 'handoff-neurology-focal-motor-status-recovery-cause-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, FocalMotorStatusAction])[];
  expert: readonly (readonly [number, FocalMotorStatusAction])[];
  commonError: readonly (readonly [number, FocalMotorStatusAction])[];
  recovery: readonly (readonly [number, FocalMotorStatusAction])[];
};

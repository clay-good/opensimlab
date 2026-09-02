import type { OxygenDeviceFailureAction } from './oxygen-device-failure';

/**
 * Reference transcripts for the portable-oxygen-failure lesson.
 *
 * The authored errors are the reflexes, not blunders. The common-error path
 * takes the most institutional one — carrying on to a scheduled scan with a
 * hypoxemic patient, in the least monitored place in the hospital — and the
 * recovery path walks into all four refusals and still reaches a correct
 * handoff.
 */
export const OXYGEN_DEVICE_FAILURE_FIXTURES = {
  scenarioId: 'oxygen-device-failure', contentVersion: '0.1.1', seed: 6083,
  noAction: [],
  expert: [
    [0, 'reconcile-oxygen-device-failure-patient-signal-and-delivery'],
    [1, 'activate-oxygen-device-failure-immediate-bridge-and-help'],
    [2, 'review-oxygen-device-failure-source-to-patient-path'],
    [3, 'record-oxygen-device-failure-restoration-and-backup-intent'],
    [4, 'review-oxygen-device-failure-delivery-and-patient-response'],
    [5, 'handoff-oxygen-device-failure-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-oxygen-device-failure-patient-signal-and-delivery'],
    [1, 'continue-oxygen-device-failure-transport'],
  ],
  recovery: [
    [0, 'reconcile-oxygen-device-failure-patient-signal-and-delivery'],
    [1, 'continue-oxygen-device-failure-transport'],
    [2, 'wait-for-oxygen-device-failure-blood-gas'],
    [3, 'activate-oxygen-device-failure-immediate-bridge-and-help'],
    [4, 'review-oxygen-device-failure-source-to-patient-path'],
    // The second decision point: the empty cylinder is now a known fact, and
    // both reflexes here have already been answered by the path review.
    [5, 'increase-depleted-oxygen-source-control'],
    [6, 'reseat-patent-oxygen-interface'],
    [7, 'record-oxygen-device-failure-restoration-and-backup-intent'],
    [8, 'review-oxygen-device-failure-delivery-and-patient-response'],
    [9, 'handoff-oxygen-device-failure-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, OxygenDeviceFailureAction])[];
  expert: readonly (readonly [number, OxygenDeviceFailureAction])[];
  commonError: readonly (readonly [number, OxygenDeviceFailureAction])[];
  recovery: readonly (readonly [number, OxygenDeviceFailureAction])[];
};

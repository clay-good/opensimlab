import type { PacemakerCaptureFailureAction } from './pacemaker-capture-failure';

/**
 * Reference transcripts for the pacemaker capture-failure lesson.
 *
 * The common-error path is the one a device problem invites: the pattern is
 * recognised and both troubleshooting lanes are worked through correctly while
 * the rescue is never activated, so a dependent man at 32 waits for an
 * explanation. The recovery path takes the unordered triple in a different
 * order — which the engine accepts without comment — after being refused for
 * reviewing before recognising, and walks into both time gates.
 */
export const PACEMAKER_CAPTURE_FAILURE_FIXTURES = {
  scenarioId: 'pacemaker-capture-failure', contentVersion: '0.1.0', seed: 1739,
  noAction: [],
  expert: [
    [0, 'reconcile-pacemaker-capture-failure-pulse-and-pattern'],
    [1, 'activate-pacemaker-capture-failure-rescue-pathway'],
    [2, 'review-pacemaker-capture-failure-device-system'],
    [3, 'review-pacemaker-capture-failure-causes'],
    [4, 'review-pacemaker-capture-failure-later-panel'],
    [5, 'handoff-pacemaker-capture-failure-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-pacemaker-capture-failure-pulse-and-pattern'],
    // Both troubleshooting lanes, and nobody has organised the bridge.
    [1, 'review-pacemaker-capture-failure-device-system'],
    [2, 'review-pacemaker-capture-failure-causes'],
    [3, 'review-pacemaker-capture-failure-later-panel'],
  ],
  recovery: [
    // Reviewing before the pulse and the pattern have been reconciled.
    [0, 'review-pacemaker-capture-failure-device-system'],
    [1, 'reconcile-pacemaker-capture-failure-pulse-and-pattern'],
    // The triple in a different order.
    [2, 'review-pacemaker-capture-failure-causes'],
    [3, 'review-pacemaker-capture-failure-device-system'],
    [4, 'activate-pacemaker-capture-failure-rescue-pathway'],
    // Both time gates, each taken too early before it is taken correctly.
    [4, 'review-pacemaker-capture-failure-later-panel'],
    [5, 'review-pacemaker-capture-failure-later-panel'],
    [5, 'handoff-pacemaker-capture-failure-reassessment'],
    [6, 'handoff-pacemaker-capture-failure-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PacemakerCaptureFailureAction])[];
  expert: readonly (readonly [number, PacemakerCaptureFailureAction])[];
  commonError: readonly (readonly [number, PacemakerCaptureFailureAction])[];
  recovery: readonly (readonly [number, PacemakerCaptureFailureAction])[];
};

import type { PediatricStatusAsthmaticusAction } from './pediatric-status-asthmaticus';

/**
 * Reference transcripts for the status-asthmaticus lesson.
 *
 * The common-error path delays escalation for a trigger review — the refusal
 * that is hardest to argue with, because the questions it asks are genuinely
 * owed to this child, just not in this hour. The recovery path walks into all
 * four refusals and still reaches a correct handoff.
 */
export const PEDIATRIC_STATUS_ASTHMATICUS_FIXTURES = {
  scenarioId: 'pediatric-status-asthmaticus', contentVersion: '0.1.0', seed: 4472,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-status-asthmaticus-treatment-and-trajectory'],
    [1, 'recognize-pediatric-status-asthmaticus-severe-nonresponse'],
    [2, 'activate-pediatric-status-asthmaticus-critical-care-escalation'],
    [3, 'record-pediatric-status-asthmaticus-qualified-second-line-care-intent'],
    [4, 'review-pediatric-status-asthmaticus-later-response'],
    [5, 'handoff-pediatric-status-asthmaticus-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-status-asthmaticus-treatment-and-trajectory'],
    [1, 'recognize-pediatric-status-asthmaticus-severe-nonresponse'],
    [2, 'activate-pediatric-status-asthmaticus-critical-care-escalation'],
    [3, 'delay-pediatric-status-asthmaticus-escalation-for-trigger-review'],
  ],
  recovery: [
    [0, 'reconcile-pediatric-status-asthmaticus-treatment-and-trajectory'],
    // Two ways of measuring instead of recognizing.
    [1, 'force-pediatric-status-asthmaticus-peak-flow'],
    [2, 'wait-for-pediatric-status-asthmaticus-routine-radiograph'],
    [3, 'recognize-pediatric-status-asthmaticus-severe-nonresponse'],
    [4, 'activate-pediatric-status-asthmaticus-critical-care-escalation'],
    [5, 'delay-pediatric-status-asthmaticus-escalation-for-trigger-review'],
    [6, 'record-pediatric-status-asthmaticus-qualified-second-line-care-intent'],
    [7, 'review-pediatric-status-asthmaticus-later-response'],
    // And reading a partial response as an ending.
    [8, 'discharge-pediatric-status-asthmaticus-from-saturation-alone'],
    [9, 'handoff-pediatric-status-asthmaticus-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricStatusAsthmaticusAction])[];
  expert: readonly (readonly [number, PediatricStatusAsthmaticusAction])[];
  commonError: readonly (readonly [number, PediatricStatusAsthmaticusAction])[];
  recovery: readonly (readonly [number, PediatricStatusAsthmaticusAction])[];
};

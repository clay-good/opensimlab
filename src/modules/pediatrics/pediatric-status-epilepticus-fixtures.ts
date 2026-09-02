import type { PediatricStatusEpilepticusAction } from './pediatric-status-epilepticus';

/**
 * Reference transcripts for the status-epilepticus lesson.
 *
 * This engine case authors no refusable choice, so the error paths are made of
 * order and time. The common-error path gets the second-line agent owned and
 * then goes straight to the later report, never having set the airway, cause
 * and refractory work — in a child whose respiratory rate cannot be counted
 * and whose next drug can depress her breathing. The recovery path takes the
 * unordered pair the other way round, and walks into both time gates before
 * clearing them.
 */
export const PEDIATRIC_STATUS_EPILEPTICUS_FIXTURES = {
  scenarioId: 'pediatric-status-epilepticus', contentVersion: '0.1.0', seed: 7159,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-status-epilepticus-clock-care-and-whole-child'],
    [1, 'recognize-pediatric-convulsive-status-after-first-line-care'],
    [2, 'activate-pediatric-status-epilepticus-qualified-second-line-ownership'],
    [3, 'review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary'],
    [4, 'review-pediatric-status-epilepticus-later-response'],
    [5, 'handoff-pediatric-status-epilepticus-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-status-epilepticus-clock-care-and-whole-child'],
    [1, 'recognize-pediatric-convulsive-status-after-first-line-care'],
    [2, 'activate-pediatric-status-epilepticus-qualified-second-line-ownership'],
    // A drug is running, so the airway and the refractory line are assumed.
    [3, 'review-pediatric-status-epilepticus-later-response'],
  ],
  recovery: [
    // Recognition before there is a clock to recognize it against.
    [0, 'recognize-pediatric-convulsive-status-after-first-line-care'],
    [1, 'reconcile-pediatric-status-epilepticus-clock-care-and-whole-child'],
    [2, 'recognize-pediatric-convulsive-status-after-first-line-care'],
    // The unordered pair, taken safety-review first while she still convulses.
    [3, 'review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary'],
    [4, 'review-pediatric-status-epilepticus-later-response'],
    [5, 'activate-pediatric-status-epilepticus-qualified-second-line-ownership'],
    // And both time gates, taken too early before they are taken correctly.
    [5, 'review-pediatric-status-epilepticus-later-response'],
    [6, 'review-pediatric-status-epilepticus-later-response'],
    [6, 'handoff-pediatric-status-epilepticus-active-risk'],
    [7, 'handoff-pediatric-status-epilepticus-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricStatusEpilepticusAction])[];
  expert: readonly (readonly [number, PediatricStatusEpilepticusAction])[];
  commonError: readonly (readonly [number, PediatricStatusEpilepticusAction])[];
  recovery: readonly (readonly [number, PediatricStatusEpilepticusAction])[];
};

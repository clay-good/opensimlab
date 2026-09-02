import type { PediatricSepticShockAction } from './pediatric-septic-shock';

/**
 * Reference transcripts for the pediatric septic-shock lesson.
 *
 * This engine case authors no refusable choice, so the error paths are made of
 * order and time. The common-error path is the one the lesson exists for after
 * the third aliquot: it rescues the shock correctly and then reaches for the
 * later report having never escalated the source. The recovery path takes the
 * unordered pair in the opposite order — source first, rescue second — and
 * walks into both time gates before clearing them.
 */
export const PEDIATRIC_SEPTIC_SHOCK_FIXTURES = {
  scenarioId: 'pediatric-septic-shock', contentVersion: '0.1.0', seed: 6704,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-septic-shock-care-and-trajectory'],
    [1, 'recognize-pediatric-septic-shock-after-fluid-reassessment'],
    [2, 'activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership'],
    [3, 'escalate-pediatric-septic-shock-source-control'],
    [4, 'review-pediatric-septic-shock-later-response'],
    [5, 'handoff-pediatric-septic-shock-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-septic-shock-care-and-trajectory'],
    [1, 'recognize-pediatric-septic-shock-after-fluid-reassessment'],
    [2, 'activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership'],
    // The shock has an owner and the abdomen does not.
    [3, 'review-pediatric-septic-shock-later-response'],
  ],
  recovery: [
    // Recognition before there is a trajectory to recognize it in.
    [0, 'recognize-pediatric-septic-shock-after-fluid-reassessment'],
    [1, 'reconcile-pediatric-septic-shock-care-and-trajectory'],
    [2, 'recognize-pediatric-septic-shock-after-fluid-reassessment'],
    // The unordered pair, taken source first.
    [3, 'escalate-pediatric-septic-shock-source-control'],
    [4, 'review-pediatric-septic-shock-later-response'],
    [5, 'activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership'],
    // And both time gates, taken too early before they are taken correctly.
    [5, 'review-pediatric-septic-shock-later-response'],
    [6, 'review-pediatric-septic-shock-later-response'],
    [6, 'handoff-pediatric-septic-shock-active-risk'],
    [7, 'handoff-pediatric-septic-shock-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricSepticShockAction])[];
  expert: readonly (readonly [number, PediatricSepticShockAction])[];
  commonError: readonly (readonly [number, PediatricSepticShockAction])[];
  recovery: readonly (readonly [number, PediatricSepticShockAction])[];
};

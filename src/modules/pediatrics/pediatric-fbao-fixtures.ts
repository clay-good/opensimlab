import type { PediatricFbaoAction } from './pediatric-foreign-body-airway-obstruction';

/**
 * Reference transcripts for the foreign-body airway lesson.
 *
 * This engine case authors no refusable choice, and the error paths here are
 * made of impatience against three separate time gates rather than one. The
 * common-error path is the one the top of the ladder invites: reaching for the
 * severe-obstruction transition in the same minute the effective cough was
 * preserved, which is a learner deciding the child has deteriorated before he
 * has. The recovery path walks into all three gates before clearing them.
 */
export const PEDIATRIC_FBAO_FIXTURES = {
  scenarioId: 'pediatric-foreign-body-airway-obstruction', contentVersion: '0.1.0', seed: 8371,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child'],
    [1, 'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance'],
    [2, 'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition'],
    [3, 'activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway'],
    [4, 'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway'],
    [5, 'handoff-pediatric-foreign-body-airway-obstruction-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child'],
    [1, 'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance'],
    // Declaring the transition in the same minute the cough was preserved.
    [1, 'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition'],
    [2, 'activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway'],
  ],
  recovery: [
    // Preserving the cough before the event has been read at all.
    [0, 'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance'],
    [1, 'reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child'],
    [2, 'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance'],
    // All three time gates, each taken too early before it is taken correctly.
    [2, 'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition'],
    [3, 'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition'],
    [4, 'activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway'],
    [4, 'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway'],
    [5, 'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway'],
    [5, 'handoff-pediatric-foreign-body-airway-obstruction-active-risk'],
    [6, 'handoff-pediatric-foreign-body-airway-obstruction-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricFbaoAction])[];
  expert: readonly (readonly [number, PediatricFbaoAction])[];
  commonError: readonly (readonly [number, PediatricFbaoAction])[];
  recovery: readonly (readonly [number, PediatricFbaoAction])[];
};

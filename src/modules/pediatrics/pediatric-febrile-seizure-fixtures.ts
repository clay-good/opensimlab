import type { PediatricFebrileSeizureAction } from './pediatric-febrile-seizure';

/**
 * Reference transcripts for the febrile-seizure lesson.
 *
 * This engine case authors no refusable choice, so the error paths are made of
 * order and time. The common-error path is the one reassurance produces: the
 * child is being looked after, he looks well, and the dangerous alternatives
 * are never opened. The recovery path takes the unordered pair the other way
 * round — red flags watched before anybody is looking after him — and walks
 * into both time gates before clearing them.
 */
export const PEDIATRIC_FEBRILE_SEIZURE_FIXTURES = {
  scenarioId: 'pediatric-febrile-seizure', contentVersion: '0.1.0', seed: 2461,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-febrile-seizure-event-recovery-and-fever'],
    [1, 'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary'],
    [2, 'activate-pediatric-febrile-seizure-qualified-care-ownership'],
    [3, 'review-pediatric-febrile-seizure-infection-recurrence-and-alternatives'],
    [4, 'review-pediatric-febrile-seizure-later-response'],
    [5, 'handoff-pediatric-febrile-seizure-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-febrile-seizure-event-recovery-and-fever'],
    [1, 'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary'],
    [2, 'activate-pediatric-febrile-seizure-qualified-care-ownership'],
    // He looks well, so the dangerous causes are treated as closed.
    [3, 'review-pediatric-febrile-seizure-later-response'],
  ],
  recovery: [
    // Recognition before there is a trajectory to recognize it in.
    [0, 'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary'],
    [1, 'reconcile-pediatric-febrile-seizure-event-recovery-and-fever'],
    [2, 'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary'],
    // The unordered pair, taken red-flag review first.
    [3, 'review-pediatric-febrile-seizure-infection-recurrence-and-alternatives'],
    [4, 'review-pediatric-febrile-seizure-later-response'],
    [5, 'activate-pediatric-febrile-seizure-qualified-care-ownership'],
    // And both time gates, taken too early before they are taken correctly.
    [5, 'review-pediatric-febrile-seizure-later-response'],
    [6, 'review-pediatric-febrile-seizure-later-response'],
    [6, 'handoff-pediatric-febrile-seizure-active-risk'],
    [7, 'handoff-pediatric-febrile-seizure-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricFebrileSeizureAction])[];
  expert: readonly (readonly [number, PediatricFebrileSeizureAction])[];
  commonError: readonly (readonly [number, PediatricFebrileSeizureAction])[];
  recovery: readonly (readonly [number, PediatricFebrileSeizureAction])[];
};

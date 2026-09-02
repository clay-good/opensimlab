import type { PediatricInjurySafeguardingAction } from './pediatric-injury-safeguarding';

/**
 * Reference transcripts for the safeguarding-escalation lesson.
 *
 * This engine case authors no refusable choice, so the error paths are made of
 * order and time against a strict line. The common-error path is the one the
 * subject invites: reaching for the later safety state while the medical
 * alternatives and the information boundary have never been reviewed — a
 * learner who has raised a concern and skipped the part that keeps it honest.
 * The recovery path takes that refusal, corrects it, and walks into both time
 * gates before clearing them.
 */
export const PEDIATRIC_INJURY_SAFEGUARDING_FIXTURES = {
  scenarioId: 'pediatric-injury-safeguarding-escalation', contentVersion: '0.1.0', seed: 2758,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-injury-development-history-and-whole-child'],
    [1, 'recognize-pediatric-injury-safeguarding-concern-without-diagnosis'],
    [2, 'activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership'],
    [3, 'review-pediatric-injury-medical-alternatives-and-information-boundary'],
    [4, 'review-pediatric-injury-later-safety-state'],
    [5, 'handoff-pediatric-injury-unresolved-safeguarding-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-injury-development-history-and-whole-child'],
    [1, 'recognize-pediatric-injury-safeguarding-concern-without-diagnosis'],
    [2, 'activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership'],
    // The concern is raised, so the alternatives are treated as settled.
    [3, 'review-pediatric-injury-later-safety-state'],
  ],
  recovery: [
    // Naming the concern before the record it rests on has been read.
    [0, 'recognize-pediatric-injury-safeguarding-concern-without-diagnosis'],
    [1, 'reconcile-pediatric-injury-development-history-and-whole-child'],
    [2, 'recognize-pediatric-injury-safeguarding-concern-without-diagnosis'],
    // And the alternatives review before the ownership it must not precede.
    [3, 'review-pediatric-injury-medical-alternatives-and-information-boundary'],
    [4, 'activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership'],
    [5, 'review-pediatric-injury-medical-alternatives-and-information-boundary'],
    // Then both time gates, taken too early before they are taken correctly.
    [5, 'review-pediatric-injury-later-safety-state'],
    [6, 'review-pediatric-injury-later-safety-state'],
    [6, 'handoff-pediatric-injury-unresolved-safeguarding-risk'],
    [7, 'handoff-pediatric-injury-unresolved-safeguarding-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricInjurySafeguardingAction])[];
  expert: readonly (readonly [number, PediatricInjurySafeguardingAction])[];
  commonError: readonly (readonly [number, PediatricInjurySafeguardingAction])[];
  recovery: readonly (readonly [number, PediatricInjurySafeguardingAction])[];
};

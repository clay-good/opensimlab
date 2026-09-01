import type { AcetaminophenAction } from './acetaminophen-clock-and-nomogram';

/**
 * Reference transcripts for the acetaminophen lesson.
 *
 * The error path is the one the nomogram itself invites: a level exists, so
 * plot it. It is an ordering error rather than a treatment error, because this
 * lesson delivers no treatment — but the step it skips is the one that asks
 * whether this ingestion is the kind of ingestion the nomogram was built for.
 * A point plotted before that question is answered is a number on a graph
 * rather than a finding. The recovery path starts from that refusal and still
 * reaches a correct handoff in the same run.
 */
export const ACETAMINOPHEN_FIXTURES = {
  scenarioId: 'acetaminophen-clock-and-nomogram', contentVersion: '0.1.0', seed: 5388,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-acetaminophen-product-ingestion-window-clock-symptoms-and-whole-patient'],
    [1, 'recognize-toxicology-acetaminophen-acute-timed-pattern-and-nomogram-applicability-boundary'],
    [2, 'activate-toxicology-acetaminophen-poison-center-emergency-monitoring-and-nonjudgmental-safety-ownership'],
    [3, 'review-toxicology-acetaminophen-supplied-timed-level-nomogram-position-liver-and-coingestion-boundary'],
    [4, 'record-toxicology-acetaminophen-bounded-qualified-team-acetylcysteine-intent-and-strict-later-review'],
    [5, 'handoff-toxicology-acetaminophen-serial-level-liver-failure-stopping-safety-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-acetaminophen-product-ingestion-window-clock-symptoms-and-whole-patient'],
    [1, 'review-toxicology-acetaminophen-supplied-timed-level-nomogram-position-liver-and-coingestion-boundary'],
    [2, 'record-toxicology-acetaminophen-bounded-qualified-team-acetylcysteine-intent-and-strict-later-review'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-acetaminophen-product-ingestion-window-clock-symptoms-and-whole-patient'],
    [1, 'review-toxicology-acetaminophen-supplied-timed-level-nomogram-position-liver-and-coingestion-boundary'],
    [2, 'recognize-toxicology-acetaminophen-acute-timed-pattern-and-nomogram-applicability-boundary'],
    [3, 'activate-toxicology-acetaminophen-poison-center-emergency-monitoring-and-nonjudgmental-safety-ownership'],
    [4, 'review-toxicology-acetaminophen-supplied-timed-level-nomogram-position-liver-and-coingestion-boundary'],
    [5, 'record-toxicology-acetaminophen-bounded-qualified-team-acetylcysteine-intent-and-strict-later-review'],
    [6, 'handoff-toxicology-acetaminophen-serial-level-liver-failure-stopping-safety-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AcetaminophenAction])[];
  expert: readonly (readonly [number, AcetaminophenAction])[];
  commonError: readonly (readonly [number, AcetaminophenAction])[];
  recovery: readonly (readonly [number, AcetaminophenAction])[];
};

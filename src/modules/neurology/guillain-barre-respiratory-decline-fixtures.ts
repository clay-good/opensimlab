import type { GbsAction } from './guillain-barre-respiratory-decline';

/**
 * Reference transcripts for the Guillain-Barré lesson.
 *
 * The error path is the one a textbook story invites: diarrhoea a fortnight
 * ago, ascending symmetric weakness, absent reflexes — call it and escalate. It
 * is an ordering error rather than a treatment error, because this lesson
 * delivers no treatment. What it skips is the beat that asks what else does
 * this, and a cord lesion answering to the same description would need
 * something different and immediate. The recovery path starts from that refusal
 * and still reaches a correct handoff in the same run.
 */
export const GBS_FIXTURES = {
  scenarioId: 'guillain-barre-respiratory-decline', contentVersion: '0.1.0', seed: 6392,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient'],
    [1, 'review-neurology-gbs-supportive-evidence-mimics-and-diagnostic-boundary'],
    [2, 'recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff'],
    [3, 'activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership'],
    [4, 'review-neurology-gbs-strict-later-respiratory-bulbar-and-autonomic-trajectory'],
    [5, 'handoff-neurology-gbs-airway-dysautonomia-treatment-recurrence-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient'],
    [1, 'recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff'],
    [2, 'activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership'],
  ],
  recovery: [
    [0, 'reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient'],
    [1, 'recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff'],
    [2, 'review-neurology-gbs-supportive-evidence-mimics-and-diagnostic-boundary'],
    [3, 'recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff'],
    [4, 'activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership'],
    [5, 'review-neurology-gbs-strict-later-respiratory-bulbar-and-autonomic-trajectory'],
    [6, 'handoff-neurology-gbs-airway-dysautonomia-treatment-recurrence-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, GbsAction])[];
  expert: readonly (readonly [number, GbsAction])[];
  commonError: readonly (readonly [number, GbsAction])[];
  recovery: readonly (readonly [number, GbsAction])[];
};

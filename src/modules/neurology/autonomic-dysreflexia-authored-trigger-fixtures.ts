import type { DysreflexiaAction } from './autonomic-dysreflexia-authored-trigger';

/**
 * Reference transcripts for the autonomic-dysreflexia lesson.
 *
 * The error path is the one a findable cause invites: recognize the syndrome
 * and go straight to hunting the trigger. It is an ordering error rather than a
 * treatment error, because the only physical act this lesson exposes is freeing
 * one visible kink. What it skips is sitting him up — the intervention that
 * costs nothing, starts working immediately, and is the first thing to do in
 * every version of this emergency, including the ones where the trigger is
 * never found. The recovery path starts from that refusal and still reaches a
 * correct handoff in the same run.
 */
export const DYSREFLEXIA_FIXTURES = {
  scenarioId: 'autonomic-dysreflexia-authored-trigger', contentVersion: '0.1.0', seed: 6679,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-autonomic-dysreflexia-lesion-baseline-pressure-symptoms-rhythm-and-whole-patient'],
    [1, 'recognize-neurology-autonomic-dysreflexia-pattern-without-closing-alternatives-or-definitive-diagnosis'],
    [2, 'activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership'],
    [3, 'review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role'],
    [4, 'reassess-neurology-autonomic-dysreflexia-strict-pressure-pulse-symptom-and-trigger-transition'],
    [5, 'handoff-neurology-autonomic-dysreflexia-baseline-triggers-recurrence-complications-prevention-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-autonomic-dysreflexia-lesion-baseline-pressure-symptoms-rhythm-and-whole-patient'],
    [1, 'recognize-neurology-autonomic-dysreflexia-pattern-without-closing-alternatives-or-definitive-diagnosis'],
    [2, 'review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role'],
  ],
  recovery: [
    [0, 'reconcile-neurology-autonomic-dysreflexia-lesion-baseline-pressure-symptoms-rhythm-and-whole-patient'],
    [1, 'recognize-neurology-autonomic-dysreflexia-pattern-without-closing-alternatives-or-definitive-diagnosis'],
    [2, 'review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role'],
    [3, 'activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership'],
    [4, 'review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role'],
    [5, 'reassess-neurology-autonomic-dysreflexia-strict-pressure-pulse-symptom-and-trigger-transition'],
    [6, 'handoff-neurology-autonomic-dysreflexia-baseline-triggers-recurrence-complications-prevention-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, DysreflexiaAction])[];
  expert: readonly (readonly [number, DysreflexiaAction])[];
  commonError: readonly (readonly [number, DysreflexiaAction])[];
  recovery: readonly (readonly [number, DysreflexiaAction])[];
};

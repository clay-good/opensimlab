import type { MinorStrokeAction } from './minor-nondisabling-acute-ischemic-stroke';

/**
 * Reference transcripts for the minor-stroke lesson.
 *
 * The error path is the one a small number invites: the NIHSS is 1, so call it
 * minor and move on. It is an ordering error rather than a treatment error,
 * because this lesson delivers no treatment. What it skips is the beat where
 * the imaging, the mimics and the immediate threats are read — and a score of 1
 * is not a substitute for any of them, least of all for the question of whether
 * the deficit is disabling to this particular person. The recovery path starts
 * from that refusal and still reaches a correct handoff in the same run.
 */
export const MINOR_STROKE_FIXTURES = {
  scenarioId: 'minor-nondisabling-acute-ischemic-stroke', contentVersion: '0.1.0', seed: 6104,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient'],
    [1, 'review-neurology-minor-stroke-imaging-mimics-and-immediate-threats'],
    [2, 'recognize-neurology-minor-nondisabling-stroke-boundary-without-score-alone'],
    [3, 'record-neurology-minor-stroke-qualified-antiplatelet-and-surveillance-intent'],
    [4, 'review-neurology-minor-stroke-later-neurologic-trajectory'],
    [5, 'handoff-neurology-minor-stroke-etiology-recurrence-and-secondary-prevention-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient'],
    [1, 'recognize-neurology-minor-nondisabling-stroke-boundary-without-score-alone'],
    [2, 'record-neurology-minor-stroke-qualified-antiplatelet-and-surveillance-intent'],
  ],
  recovery: [
    [0, 'reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient'],
    [1, 'recognize-neurology-minor-nondisabling-stroke-boundary-without-score-alone'],
    [2, 'review-neurology-minor-stroke-imaging-mimics-and-immediate-threats'],
    [3, 'recognize-neurology-minor-nondisabling-stroke-boundary-without-score-alone'],
    [4, 'record-neurology-minor-stroke-qualified-antiplatelet-and-surveillance-intent'],
    [5, 'review-neurology-minor-stroke-later-neurologic-trajectory'],
    [6, 'handoff-neurology-minor-stroke-etiology-recurrence-and-secondary-prevention-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MinorStrokeAction])[];
  expert: readonly (readonly [number, MinorStrokeAction])[];
  commonError: readonly (readonly [number, MinorStrokeAction])[];
  recovery: readonly (readonly [number, MinorStrokeAction])[];
};

import type { HerniationAction } from './acute-transtentorial-herniation-pattern';

/**
 * Reference transcripts for the herniation lesson.
 *
 * The error path is the one uncertainty invites: go and review what the rescue
 * options are, or what a repeat scan would show, before saying out loud that
 * this is happening. It is an ordering error rather than a treatment error,
 * because this lesson delivers no treatment. What it skips is the recognition
 * and the call — and in the twelve minutes this pattern took to assemble, the
 * cost of waiting for one more sign is the only cost that cannot be undone. The
 * recovery path starts from that refusal and still reaches a correct handoff in
 * the same run.
 */
export const HERNIATION_FIXTURES = {
  scenarioId: 'acute-transtentorial-herniation-pattern', contentVersion: '0.1.0', seed: 6556,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-herniation-clock-consciousness-pupils-motor-physiology-and-whole-patient'],
    [1, 'recognize-neurology-converging-transtentorial-herniation-pattern-without-isolated-pupil-or-complete-triad'],
    [2, 'activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership'],
    [3, 'review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary'],
    [4, 'review-neurology-herniation-strict-later-qualified-rescue-and-unresolved-neurologic-trajectory'],
    [5, 'handoff-neurology-herniation-lesion-airway-pressure-seizure-surgery-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-herniation-clock-consciousness-pupils-motor-physiology-and-whole-patient'],
    [1, 'review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary'],
    [2, 'review-neurology-herniation-strict-later-qualified-rescue-and-unresolved-neurologic-trajectory'],
  ],
  recovery: [
    [0, 'reconcile-neurology-herniation-clock-consciousness-pupils-motor-physiology-and-whole-patient'],
    [1, 'review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary'],
    [2, 'recognize-neurology-converging-transtentorial-herniation-pattern-without-isolated-pupil-or-complete-triad'],
    [3, 'activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership'],
    [4, 'review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary'],
    [5, 'review-neurology-herniation-strict-later-qualified-rescue-and-unresolved-neurologic-trajectory'],
    [6, 'handoff-neurology-herniation-lesion-airway-pressure-seizure-surgery-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HerniationAction])[];
  expert: readonly (readonly [number, HerniationAction])[];
  commonError: readonly (readonly [number, HerniationAction])[];
  recovery: readonly (readonly [number, HerniationAction])[];
};

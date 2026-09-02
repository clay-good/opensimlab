import type { AsahAction } from './aneurysmal-subarachnoid-hemorrhage-deterioration';

/**
 * Reference transcripts for the delayed-deterioration lesson.
 *
 * The error path is the one a convincing scan invites: the CTA shows new
 * narrowing and the CTP shows delayed perfusion, so call it delayed cerebral
 * ischemia and move. It is an ordering error rather than a treatment error,
 * because this lesson delivers no treatment. What it skips is the beat that
 * walks the alternatives — rebleeding, hydrocephalus, seizure, a metabolic or
 * systemic cause — which is the work that makes the recognition mean anything,
 * because imaging can support this diagnosis and cannot make it. The recovery
 * path starts from that refusal and still reaches a correct handoff in the same
 * run.
 */
export const ASAH_FIXTURES = {
  scenarioId: 'aneurysmal-subarachnoid-hemorrhage-deterioration', contentVersion: '0.1.0', seed: 6228,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient'],
    [1, 'review-neurology-asah-rebleeding-hydrocephalus-seizure-metabolic-and-perfusion-evidence'],
    [2, 'recognize-neurology-asah-possible-dci-without-imaging-alone'],
    [3, 'activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership'],
    [4, 'review-neurology-asah-strict-later-neurologic-and-perfusion-trajectory'],
    [5, 'handoff-neurology-asah-dci-aneurysm-recurrence-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient'],
    [1, 'recognize-neurology-asah-possible-dci-without-imaging-alone'],
    [2, 'activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership'],
  ],
  recovery: [
    [0, 'reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient'],
    [1, 'recognize-neurology-asah-possible-dci-without-imaging-alone'],
    [2, 'review-neurology-asah-rebleeding-hydrocephalus-seizure-metabolic-and-perfusion-evidence'],
    [3, 'recognize-neurology-asah-possible-dci-without-imaging-alone'],
    [4, 'activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership'],
    [5, 'review-neurology-asah-strict-later-neurologic-and-perfusion-trajectory'],
    [6, 'handoff-neurology-asah-dci-aneurysm-recurrence-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AsahAction])[];
  expert: readonly (readonly [number, AsahAction])[];
  commonError: readonly (readonly [number, AsahAction])[];
  recovery: readonly (readonly [number, AsahAction])[];
};

import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the delayed-deterioration lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type AsahSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyAsahAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no EEG
 * interpreted, no alternative excluded, no angioplasty selected, and in
 * particular no delayed cerebral ischemia diagnosed by the learner — which are
 * constants rather than observations.
 */
export type AsahProgress = Pick<AsahSnapshot,
  'trajectoryAtTick' | 'evidenceAtTick' | 'boundaryAtTick'
  | 'ownershipAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const ASAH_ACTIONS = [
  'reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient',
  'review-neurology-asah-rebleeding-hydrocephalus-seizure-metabolic-and-perfusion-evidence',
  'recognize-neurology-asah-possible-dci-without-imaging-alone',
  'activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership',
  'review-neurology-asah-strict-later-neurologic-and-perfusion-trajectory',
  'handoff-neurology-asah-dci-aneurysm-recurrence-and-active-risk',
] as const;

export type AsahAction = (typeof ASAH_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Two narratives carry the whole lesson and no rhythm event belongs to it,
 * because nothing about the rhythm is the teaching. That is required by name
 * rather than tolerated.
 */
export function supportsAsah(scenario: Scenario): boolean {
  return scenario.metadata.id === 'aneurysmal-subarachnoid-hemorrhage-deterioration'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'aneurysmal-subarachnoid-hemorrhage-deterioration-reassessment').length === 1
    && scenario.timeline.filter((event) => event.target === 'aneurysmal-subarachnoid-hemorrhage-deterioration-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ASAH_ACTIONS.join('|');
}

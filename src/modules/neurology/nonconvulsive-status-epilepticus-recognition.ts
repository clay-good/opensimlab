import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the nonconvulsive-status lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type NcseSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyNcseAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no EEG placed
 * or interpreted, no drug selected, and in particular no clinical-only
 * diagnosis of nonconvulsive status — which are constants rather than
 * observations.
 */
export type NcseProgress = Pick<NcseSnapshot,
  'trajectoryAtTick' | 'suspicionAtTick' | 'ownershipAtTick'
  | 'alternativesAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const NCSE_ACTIONS = [
  'reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient',
  'recognize-neurology-ncse-suspicion-and-urgent-eeg-boundary-without-clinical-diagnosis',
  'activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership',
  'review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives',
  'review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory',
  'handoff-neurology-ncse-cause-treatment-recurrence-and-active-risk',
] as const;

export type NcseAction = (typeof NCSE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Two narratives carry the whole lesson and no rhythm event belongs to it,
 * because nothing about the rhythm is the teaching. That is required by name
 * rather than tolerated.
 */
export function supportsNcse(scenario: Scenario): boolean {
  return scenario.metadata.id === 'nonconvulsive-status-epilepticus-recognition'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'nonconvulsive-status-epilepticus-recognition-reassessment').length === 1
    && scenario.timeline.filter((event) => event.target === 'nonconvulsive-status-epilepticus-recognition-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === NCSE_ACTIONS.join('|');
}

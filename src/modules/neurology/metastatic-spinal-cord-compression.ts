import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the cord-compression lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type MsccSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyMsccAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no patient
 * moved, no imaging ordered or interpreted, no drug or procedure chosen, and in
 * particular no neurologic recovery proven — which are constants rather than
 * observations.
 */
export type MsccProgress = Pick<MsccSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'ownershipAtTick'
  | 'boundaryAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const MSCC_ACTIONS = [
  'reconcile-neurology-mscc-cancer-pain-motor-sensory-bladder-and-whole-patient-clock',
  'recognize-neurology-mscc-oncologic-emergency-before-imaging-confirmation',
  'activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership',
  'review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary',
  'review-neurology-mscc-strict-later-qualified-mri-and-unresolved-function-trajectory',
  'handoff-neurology-mscc-level-stability-function-bladder-definitive-care-and-active-risk',
] as const;

export type MsccAction = (typeof MSCC_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Three narratives carry this lesson, because the emergency boundary and the
 * care boundary each need one of their own. That shape is required by name
 * rather than tolerated.
 */
export function supportsMscc(scenario: Scenario): boolean {
  return scenario.metadata.id === 'metastatic-spinal-cord-compression'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'metastatic-spinal-cord-compression-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'metastatic-spinal-cord-compression-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MSCC_ACTIONS.join('|');
}

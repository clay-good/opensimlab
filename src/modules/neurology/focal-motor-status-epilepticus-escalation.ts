import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the focal-motor-status lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type FocalMotorStatusSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyFocalMotorStatusAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no seizure
 * timed, no EEG acquired, no drug or dose selected, and in particular no
 * movement cessation or electrographic control proven — which are constants
 * rather than observations.
 */
export type FocalMotorStatusProgress = Pick<FocalMotorStatusSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'ownershipAtTick'
  | 'safetyAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const FOCAL_MOTOR_STATUS_ACTIONS = [
  'reconcile-neurology-focal-motor-status-clock-semiology-recovery-and-whole-patient',
  'recognize-neurology-focal-motor-status-despite-reduced-convulsions',
  'activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership',
  'review-neurology-focal-motor-status-airway-glucose-causes-and-injury-boundary',
  'review-neurology-focal-motor-status-strict-later-visible-motor-trajectory',
  'handoff-neurology-focal-motor-status-recovery-cause-and-active-risk',
] as const;

export type FocalMotorStatusAction = (typeof FOCAL_MOTOR_STATUS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Two narratives carry the whole lesson and no rhythm event belongs to it,
 * because nothing about the rhythm is the teaching. That is required by name
 * rather than tolerated.
 */
export function supportsFocalMotorStatus(scenario: Scenario): boolean {
  return scenario.metadata.id === 'focal-motor-status-epilepticus-escalation'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'focal-motor-status-epilepticus-escalation-reassessment').length === 1
    && scenario.timeline.filter((event) => event.target === 'focal-motor-status-epilepticus-escalation-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === FOCAL_MOTOR_STATUS_ACTIONS.join('|');
}

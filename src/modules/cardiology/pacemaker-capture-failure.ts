import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the pacemaker capture-failure lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PacemakerCaptureFailureSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pacemakerCaptureFailureAssessment']>;

/**
 * Six recorded steps against six declared objectives, an unordered triple, and
 * two time gates.
 *
 * After the pattern is recognised, the rescue, the device-system review and the
 * cause review are all open at once and in any order, and the later panel
 * refuses until all three have landed. Putting the rescue inside the unordered
 * group rather than ahead of it is the design decision worth noticing: the
 * lesson refuses to make troubleshooting a prerequisite for keeping the patient
 * perfused, and equally refuses to let a rescue close the review.
 *
 * `initialPulsePresent` and `electricalCaptureFailureAuthored` are both a fixed
 * `true`, and eight restraint flags — including `deviceInterrogatedByLearner`,
 * `deviceProgrammedByLearner` and `leadManipulatedByLearner` — stay `false`.
 */
export type PacemakerCaptureFailureProgress = Pick<PacemakerCaptureFailureSnapshot,
  'recognitionAtTick' | 'rescueAtTick' | 'deviceSystemAtTick'
  | 'causesAtTick' | 'laterPanelAtTick' | 'handoffAtTick'>;

export const PACEMAKER_CAPTURE_FAILURE_ACTIONS = [
  'reconcile-pacemaker-capture-failure-pulse-and-pattern',
  'activate-pacemaker-capture-failure-rescue-pathway',
  'review-pacemaker-capture-failure-device-system',
  'review-pacemaker-capture-failure-causes',
  'review-pacemaker-capture-failure-later-panel',
  'handoff-pacemaker-capture-failure-reassessment',
] as const;

export type PacemakerCaptureFailureAction = (typeof PACEMAKER_CAPTURE_FAILURE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsPacemakerCaptureFailure(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pacemaker-capture-failure'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'pacemaker-capture-failure-reassessment').length === 2
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'pacemaker-capture-failure-reassessment-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PACEMAKER_CAPTURE_FAILURE_ACTIONS.join('|');
}

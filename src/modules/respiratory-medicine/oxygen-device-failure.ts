import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the portable-oxygen-failure lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps — including the wrong turn they most recently
 * took.
 */
export type OxygenDeviceFailureSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['oxygenDeviceFailureAssessment']>;

/**
 * The six recorded steps, plus the last unsupported choice.
 *
 * `lastUnsupportedChoice` is not a step — it is how the engine reports that
 * one of the four ordinary reflexes was just tried and refused, with the
 * patient unchanged.
 */
export type OxygenDeviceFailureProgress = Pick<OxygenDeviceFailureSnapshot,
  'reconciledAtTick' | 'bridgeAtTick' | 'pathAtTick'
  | 'restorationAtTick' | 'responseAtTick' | 'handoffAtTick' | 'lastUnsupportedChoice'>;

export const OXYGEN_DEVICE_FAILURE_ACTIONS = [
  'reconcile-oxygen-device-failure-patient-signal-and-delivery',
  'activate-oxygen-device-failure-immediate-bridge-and-help',
  'review-oxygen-device-failure-source-to-patient-path',
  'record-oxygen-device-failure-restoration-and-backup-intent',
  'review-oxygen-device-failure-delivery-and-patient-response',
  'handoff-oxygen-device-failure-reassessment',
] as const;

/**
 * The four choices this lesson offers and refuses, at two separate moments.
 *
 * Every one of them is an ordinary reflex rather than a blunder: waiting for
 * a blood gas that could only confirm what you already know, carrying on to
 * a scheduled scan, turning up a flowmeter with nothing behind it, and
 * reseating a cannula that has already been reported patent.
 */
export const OXYGEN_DEVICE_FAILURE_UNSUPPORTED_ACTIONS = [
  'wait-for-oxygen-device-failure-blood-gas',
  'continue-oxygen-device-failure-transport',
  'increase-depleted-oxygen-source-control',
  'reseat-patent-oxygen-interface',
] as const;

export type OxygenDeviceFailureAction =
  (typeof OXYGEN_DEVICE_FAILURE_ACTIONS)[number] | (typeof OXYGEN_DEVICE_FAILURE_UNSUPPORTED_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsOxygenDeviceFailure(scenario: Scenario): boolean {
  return scenario.metadata.id === 'oxygen-device-failure'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'oxygen-device-failure').length === 3
    && scenario.timeline.filter((event) => event.target === 'oxygen-device-failure-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === OXYGEN_DEVICE_FAILURE_ACTIONS.join('|');
}

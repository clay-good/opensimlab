import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the spontaneous-breathing-trial lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type SpontaneousBreathingTrialSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['spontaneousBreathingTrialAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The closing step is the one that carries the lesson. This is the only lab in
 * the module whose worked example ends in a failure, and the plan step is where
 * a failed trial stops being a verdict on the patient and becomes a list of
 * things to fix before the next one.
 */
export type SpontaneousBreathingTrialProgress = Pick<SpontaneousBreathingTrialSnapshot,
  'readinessAtTick' | 'startedAtTick' | 'failureAtTick'
  | 'recoveryAtTick' | 'planAtTick'>;

export const SPONTANEOUS_BREATHING_TRIAL_ACTIONS = [
  'review-sbt-readiness',
  'start-bounded-sbt',
  'recognize-sbt-failure',
  'stop-failed-sbt-and-recover',
  'plan-after-failed-sbt',
] as const;

export type SpontaneousBreathingTrialAction = (typeof SPONTANEOUS_BREATHING_TRIAL_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsSpontaneousBreathingTrial(scenario: Scenario): boolean {
  return scenario.metadata.id === 'spontaneous-breathing-trial'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'spontaneous-breathing-trial').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'spontaneous-breathing-trial-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === SPONTANEOUS_BREATHING_TRIAL_ACTIONS.join('|');
}

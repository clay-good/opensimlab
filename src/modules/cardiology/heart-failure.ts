import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the decompensated heart-failure
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type HeartFailureSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['heartFailureAssessment']>;

/**
 * The five recorded steps, in a strict line with no time gate.
 *
 * `residualCongestion` is a fixed `true` and `dischargeReady` a fixed `false`,
 * and that pair is the lesson: a man who feels better, has lost 1.4 kg and put
 * out 2.4 L is still 3.8 kg above his clinic weight with a raised JVP,
 * crackles and 2+ edema. `doseCalculated` and `treatmentDelivered` stay
 * `false`.
 */
export type HeartFailureProgress = Pick<HeartFailureSnapshot,
  'statusAtTick' | 'responseAtTick' | 'toleranceAtTick'
  | 'transitionAtTick' | 'readinessAtTick'>;

export const HEART_FAILURE_ACTIONS = [
  'reconcile-heart-failure-congestion-and-perfusion',
  'review-heart-failure-diuretic-response',
  'review-heart-failure-tolerance-and-precipitant',
  'record-heart-failure-transition-intent',
  'reassess-heart-failure-discharge-readiness',
] as const;

export type HeartFailureAction = (typeof HEART_FAILURE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsHeartFailure(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acute-decompensated-heart-failure'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'acute-decompensated-heart-failure').length === 1
    && scenario.timeline.filter((event) => event.target === 'acute-decompensated-heart-failure-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HEART_FAILURE_ACTIONS.join('|');
}

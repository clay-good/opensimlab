import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the failed-intubation lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type FailedIntubationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsFailedIntubationAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no airway managed or device manipulated, no wake-or-proceed
 * decision made, no surgery or delivery performed — which are constants rather
 * than observations.
 */
export type FailedIntubationProgress = Pick<FailedIntubationSnapshot,
  'supportAtTick' | 'contextAtTick' | 'safetyAtTick'
  | 'decisionAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const FAILED_INTUBATION_ACTIONS = [
  'activate-obstetrics-failed-intubation-oxygenation-anesthesia-obstetric-theatre-newborn-and-support-response',
  'reconcile-obstetrics-failed-intubation-attempts-device-ventilation-aspiration-fetus-and-whole-person',
  'review-obstetrics-failed-intubation-attempt-limit-oxygenation-cico-awareness-and-aspiration-boundaries',
  'review-obstetrics-failed-intubation-individualized-wake-or-proceed-and-parallel-readiness',
  'review-obstetrics-failed-intubation-fixed-three-minute-qualified-course-report',
  'handoff-obstetrics-failed-intubation-airway-aspiration-awareness-birth-newborn-support-and-outcome-risk',
] as const;

export type FailedIntubationAction = (typeof FAILED_INTUBATION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsFailedIntubation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'failed-obstetric-intubation-oxygenation-first'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'failed-obstetric-intubation-oxygenation-first-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'failed-obstetric-intubation-oxygenation-first-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === FAILED_INTUBATION_ACTIONS.join('|');
}

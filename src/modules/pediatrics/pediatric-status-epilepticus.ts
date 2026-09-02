import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the status-epilepticus lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricStatusEpilepticusSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricStatusEpilepticusAssessment']>;

/**
 * The six recorded steps.
 *
 * This engine case authors no refusable choice and shares the unordered-pair
 * shape: second-line ownership and the airway-cause-refractory review may be
 * recorded in either order, and the later report refuses until both are active
 * and simulated time has passed since whichever landed second.
 *
 * The distinction this snapshot is careful about is visible against
 * electrographic. The minute-25 report says no visible convulsion since minute
 * 18, and `electrographicSeizureControlProven` stays `false` — along with
 * `durableSeizureControlProven`, `neurologicRecoveryProven`, `seizureCauseProven`
 * and `recurrenceExcluded`. A still child is not a controlled seizure.
 */
export type PediatricStatusEpilepticusProgress = Pick<PediatricStatusEpilepticusSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'secondLineAtTick'
  | 'safetyAtTick' | 'laterResponseAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_STATUS_EPILEPTICUS_ACTIONS = [
  'reconcile-pediatric-status-epilepticus-clock-care-and-whole-child',
  'recognize-pediatric-convulsive-status-after-first-line-care',
  'activate-pediatric-status-epilepticus-qualified-second-line-ownership',
  'review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary',
  'review-pediatric-status-epilepticus-later-response',
  'handoff-pediatric-status-epilepticus-active-risk',
] as const;

export type PediatricStatusEpilepticusAction =
  (typeof PEDIATRIC_STATUS_EPILEPTICUS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsPediatricStatusEpilepticus(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-status-epilepticus'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-status-epilepticus-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'pediatric-status-epilepticus-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_STATUS_EPILEPTICUS_ACTIONS.join('|');
}

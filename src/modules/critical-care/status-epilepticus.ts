import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the critical-care refractory
 * status-epilepticus lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps. The engine case, the timeline targets and the
 * assessment are all prefixed `critical-care` / `criticalCareStatus` to keep
 * this apart from the neurology module's own status lesson.
 */
export type StatusEpilepticusSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['criticalCareStatusEpilepticusAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The recognition step is the one that carries the lesson. The convulsions
 * stopped twelve minutes ago, and that is exactly what makes this dangerous:
 * a still patient looks treated, and the EEG says the seizures never stopped.
 */
export type StatusEpilepticusProgress = Pick<StatusEpilepticusSnapshot,
  'recognitionAtTick' | 'patternAtTick' | 'pathwayAtTick'
  | 'causesAtTick' | 'reassessmentAtTick'>;

export const STATUS_EPILEPTICUS_ACTIONS = [
  'recognize-refractory-status-epilepticus',
  'review-refractory-status-pattern',
  'activate-refractory-status-pathway',
  'address-refractory-status-causes',
  'reassess-refractory-status-trajectory',
] as const;

export type StatusEpilepticusAction = (typeof STATUS_EPILEPTICUS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario — including the neurology module's status lesson, whose targets and
 * action type are different strings.
 */
export function supportsStatusEpilepticus(scenario: Scenario): boolean {
  return scenario.metadata.id === 'status-epilepticus'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'critical-care-status-epilepticus').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'critical-care-status-epilepticus-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === STATUS_EPILEPTICUS_ACTIONS.join('|');
}

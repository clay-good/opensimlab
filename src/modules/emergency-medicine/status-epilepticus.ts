import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency status-epilepticus
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Neurology carries the non-convulsive and focal
 * motor lessons, critical care the refractory one and pediatrics its own; this
 * is the first five minutes of generalised convulsive status in an adult.
 */
export type StatusEpilepticusSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['statusEpilepticusAssessment']>;

/**
 * Four recorded steps against four declared objectives, in one strict chain.
 *
 * The stabilisation bundle is gated ahead of the benzodiazepine and the
 * reassessment sits one further engine tick behind it, because the convulsions
 * stop on the next physiology update rather than on the click.
 */
export type StatusEpilepticusProgress = Pick<StatusEpilepticusSnapshot,
  'reviewedAtTick' | 'supportedAtTick' | 'lorazepamAtTick' | 'reassessedAtTick'>;

/**
 * The four control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the four overlaps — so
 * the identity guard compares STATUS_EPILEPTICUS_OBJECTIVES instead.
 */
export const STATUS_EPILEPTICUS_ACTIONS = [
  'review-convulsive-status',
  'record-status-stabilization',
  'give-lorazepam-4-mg-iv',
  'reassess-after-lorazepam',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const STATUS_EPILEPTICUS_OBJECTIVES = [
  'recognize-convulsive-status-epilepticus',
  'stabilize-convulsive-status-epilepticus',
  'give-first-line-status-benzodiazepine',
  'reassess-status-after-benzodiazepine',
] as const;

export type StatusEpilepticusAction = (typeof STATUS_EPILEPTICUS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. The engine gates on the seizure event's type alone, so this guard
 * pins its target and the narrative boundary too.
 */
export function supportsStatusEpilepticus(scenario: Scenario): boolean {
  return scenario.metadata.id === 'status-epilepticus'
    && scenario.timeline.filter((event) => event.type === 'status-epilepticus'
      && event.target === 'generalized-convulsive').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'status-epilepticus').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === STATUS_EPILEPTICUS_OBJECTIVES.join('|');
}

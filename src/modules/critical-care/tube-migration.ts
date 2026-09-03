import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the post-repositioning tube-migration
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps. The engine case and assessment are named for
 * the response (`tube-migration`) rather than for the scenario id.
 */
export type TubeMigrationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['endotrachealTubeMigrationAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The support step is the one that carries the lesson, and it is why this
 * chain reads oddly at first: help and oxygen come before the panel that names
 * the cause. A patient at 89% does not wait for a diagnosis, and the engine
 * refuses to let the position review happen until the bridging has been
 * recorded.
 */
export type TubeMigrationProgress = Pick<TubeMigrationSnapshot,
  'recognizedAtTick' | 'supportedAtTick' | 'positionReviewedAtTick'
  | 'correctionAtTick' | 'reassessedAtTick'>;

export const TUBE_MIGRATION_ACTIONS = [
  'recognize-post-repositioning-ventilation-change',
  'bridge-post-repositioning-oxygenation',
  'integrate-tube-depth-and-bilateral-ventilation',
  'record-experienced-tube-correction-intent',
  'reassess-tube-position-and-gas-exchange',
] as const;

export type TubeMigrationAction = (typeof TUBE_MIGRATION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsTubeMigration(scenario: Scenario): boolean {
  return scenario.metadata.id === 'endotracheal-tube-migration-after-repositioning'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'endotracheal-tube-migration-after-repositioning').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'endotracheal-tube-migration-after-repositioning-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === TUBE_MIGRATION_ACTIONS.join('|');
}

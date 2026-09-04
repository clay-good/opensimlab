import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency hemorrhagic-shock
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Trauma primary survey is a separate lesson about
 * looking; this one is about what happens once the bleeding is found.
 */
export type HemorrhagicShockSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['hemorrhagicShockAssessment']>;

/**
 * Seven recorded steps against four declared objectives, in two lanes.
 *
 * Recognition opens both. The control lane stabilizes the pelvis and escalates
 * to definitive bleeding control; the blood lane activates a major-hemorrhage
 * response, bridges with red cells, and reviews coagulation and temperature.
 * Only the final reassessment waits on both.
 */
export type HemorrhagicShockProgress = Pick<HemorrhagicShockSnapshot,
  'mechanismAndPerfusionReviewedAtTick' | 'pelvicStabilizationAtTick'
  | 'definitiveControlEscalatedAtTick' | 'majorHemorrhageActivatedAtTick'
  | 'redCellsAtTick' | 'coagulationAndTemperatureAtTick' | 'reassessedAtTick'>;

/**
 * The seven control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none overlaps — so the identity
 * guard compares HEMORRHAGIC_SHOCK_OBJECTIVES instead.
 */
export const HEMORRHAGIC_SHOCK_ACTIONS = [
  'review-mechanism-and-perfusion',
  'record-pelvic-stabilization',
  'escalate-definitive-bleeding-control',
  'activate-major-hemorrhage',
  'give-two-red-cell-units',
  'review-coagulation-and-temperature',
  'reassess-perfusion',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const HEMORRHAGIC_SHOCK_OBJECTIVES = [
  'recognize-traumatic-hemorrhagic-shock',
  'stabilize-and-expedite-bleeding-control',
  'activate-and-bridge-with-blood',
  'monitor-and-reassess-traumatic-bleeding',
] as const;

export type HemorrhagicShockAction = (typeof HEMORRHAGIC_SHOCK_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario — including the module's own trauma primary survey.
 */
export function supportsHemorrhagicShock(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hemorrhagic-shock'
    && scenario.timeline.filter((event) => event.type === 'hemorrhagic-shock-pattern'
      && event.target === 'blunt-pelvic-trauma').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'hemorrhagic-shock').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HEMORRHAGIC_SHOCK_OBJECTIVES.join('|');
}

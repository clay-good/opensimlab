import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency exertional-heat-stroke
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes.
 */
export type ExertionalHeatStrokeSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['heatStrokeAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain
 * with no time gates anywhere.
 *
 * The step that carries the lesson is the second one. The engine records the
 * whole support bundle explicitly "without delaying active cooling", because
 * the airway, the access and the labs are the things that in practice get put
 * in front of the only treatment whose speed decides the outcome.
 */
export type ExertionalHeatStrokeProgress = Pick<ExertionalHeatStrokeSnapshot,
  'patternReviewedAtTick' | 'supportAtTick' | 'coolingAtTick'
  | 'targetAtTick' | 'surveillanceAtTick'>;

/**
 * The five control ids the engine accepts. Note the action type is
 * `heat-stroke-response`, shorter than the scenario id.
 *
 * They are NOT the declared objective strings — none of the five overlaps — so
 * the identity guard compares EXERTIONAL_HEAT_STROKE_OBJECTIVES instead.
 */
export const EXERTIONAL_HEAT_STROKE_ACTIONS = [
  'review-heat-stroke-pattern',
  'record-heat-stroke-support',
  'record-cold-water-immersion',
  'reassess-heat-stroke-cooling-target',
  'record-heat-stroke-organ-surveillance',
] as const;

/** The five declared objectives, in order, as the scenario states them. */
export const EXERTIONAL_HEAT_STROKE_OBJECTIVES = [
  'recognize-exertional-heat-stroke',
  'stabilize-and-prepare-heat-stroke-cooling',
  'cool-exertional-heat-stroke-rapidly',
  'stop-heat-stroke-cooling-at-target',
  'monitor-heat-stroke-organ-injury',
] as const;

export type ExertionalHeatStrokeAction = (typeof EXERTIONAL_HEAT_STROKE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. Both narratives are pinned by their own targets.
 */
export function supportsExertionalHeatStroke(scenario: Scenario): boolean {
  return scenario.metadata.id === 'exertional-heat-stroke'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'exertional-heat-stroke').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'exertional-heat-stroke-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === EXERTIONAL_HEAT_STROKE_OBJECTIVES.join('|');
}

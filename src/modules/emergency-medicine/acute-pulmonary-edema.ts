import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency acute-pulmonary-edema
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Respiratory medicine has its own, separate
 * pulmonary-edema lesson about reconciling support that is already running;
 * this one is the arrival, where nothing has been started yet.
 */
export type AcutePulmonaryEdemaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['acutePulmonaryEdemaAssessment']>;

/**
 * Five recorded steps against four declared objectives.
 *
 * The middle three are deliberately unordered: NIV, the loop-diuretic intent
 * and the vasodilator intent are three parallel initial treatments, and none is
 * a prerequisite for the others. That is the lesson. The engine gates only the
 * pattern review ahead of all three, and the reassessment behind all three plus
 * one further tick.
 */
export type AcutePulmonaryEdemaProgress = Pick<AcutePulmonaryEdemaSnapshot,
  'patternReviewedAtTick' | 'nivAtTick' | 'diureticIntentAtTick'
  | 'vasodilatorIntentAtTick' | 'reassessedAtTick'>;

/**
 * The five control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the four overlaps — so
 * the identity guard compares ACUTE_PULMONARY_EDEMA_OBJECTIVES instead.
 */
export const ACUTE_PULMONARY_EDEMA_ACTIONS = [
  'review-pattern-mimics-and-precipitants',
  'record-niv-and-titrated-oxygen',
  'record-loop-diuretic-intent',
  'record-vasodilator-intent',
  'reassess-breathing-pressure-and-perfusion',
] as const;

/** The three initial treatments the engine accepts in any order. */
export const ACUTE_PULMONARY_EDEMA_PARALLEL_ACTIONS = [
  'record-niv-and-titrated-oxygen',
  'record-loop-diuretic-intent',
  'record-vasodilator-intent',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const ACUTE_PULMONARY_EDEMA_OBJECTIVES = [
  'recognize-acute-pulmonary-edema-pattern',
  'support-pulmonary-edema-gas-exchange',
  'treat-hypertensive-pulmonary-edema',
  'reassess-pulmonary-edema-response',
] as const;

export type AcutePulmonaryEdemaAction = (typeof ACUTE_PULMONARY_EDEMA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario — including respiratory medicine's own pulmonary-edema lesson, which
 * carries four timeline events against this one's one.
 */
export function supportsAcutePulmonaryEdema(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acute-pulmonary-edema'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'acute-pulmonary-edema').length === 1
    && scenario.timeline.length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ACUTE_PULMONARY_EDEMA_OBJECTIVES.join('|');
}

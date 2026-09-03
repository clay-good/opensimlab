import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency copd-exacerbation
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Respiratory medicine has its own, separate COPD
 * lesson about the transition and reassessment of care already underway; this
 * one is the emergency-department arrival.
 */
export type CopdExacerbationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['copdExacerbationAssessment']>;

/**
 * Six recorded steps against five declared objectives.
 *
 * The middle four are deliberately unordered: controlled oxygen, the air-driven
 * bronchodilator bundle, the short corticosteroid course and the antibiotic
 * indication are four parallel initial treatments, and none is a prerequisite
 * for the others. The engine gates only the severity and blood-gas review ahead
 * of all four, and the reassessment behind all four plus one further tick.
 */
export type CopdExacerbationProgress = Pick<CopdExacerbationSnapshot,
  'severityReviewedAtTick' | 'controlledOxygenAtTick' | 'bronchodilatorBundleAtTick'
  | 'corticosteroidIntentAtTick' | 'antibioticIntentAtTick' | 'reassessedAtTick'>;

/**
 * The six control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the five overlaps — so
 * the identity guard compares COPD_EXACERBATION_OBJECTIVES instead.
 */
export const COPD_EXACERBATION_ACTIONS = [
  'review-severity-and-mimics',
  'record-controlled-oxygen',
  'give-air-driven-bronchodilators',
  'record-five-day-corticosteroid-intent',
  'record-antibiotic-indication',
  'reassess-and-review-ventilatory-support',
] as const;

/** The four initial treatments the engine accepts in any order. */
export const COPD_EXACERBATION_PARALLEL_ACTIONS = [
  'record-controlled-oxygen',
  'give-air-driven-bronchodilators',
  'record-five-day-corticosteroid-intent',
  'record-antibiotic-indication',
] as const;

/** The five declared objectives, in order, as the scenario states them. */
export const COPD_EXACERBATION_OBJECTIVES = [
  'assess-copd-exacerbation-severity',
  'use-controlled-oxygen-in-copd',
  'give-initial-copd-exacerbation-treatment',
  'recognize-copd-antibiotic-indication',
  'reassess-copd-respiratory-failure',
] as const;

export type CopdExacerbationAction = (typeof COPD_EXACERBATION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario — including respiratory medicine's COPD transition lesson. The
 * sustained obstruction event alongside the narrative boundary is part of the
 * identity: this lesson arrives with the obstruction already running.
 */
export function supportsCopdExacerbation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'copd-exacerbation'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'copd-exacerbation').length === 1
    && scenario.timeline.filter((event) => event.type === 'obstruction').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === COPD_EXACERBATION_OBJECTIVES.join('|');
}

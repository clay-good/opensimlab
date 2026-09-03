import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency adult-asthma lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Respiratory medicine and critical care carry
 * their own separate asthma work; this one is the emergency-department arrival.
 */
export type AdultAsthmaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['adultAsthmaAssessment']>;

/**
 * Five recorded steps against four declared objectives.
 *
 * The middle three are deliberately unordered: controlled oxygen, the inhaled
 * bronchodilator bundle and the corticosteroid intent are three parallel
 * initial treatments and none is a prerequisite for the others. The engine
 * gates only the severity review ahead of all three, and the reassessment
 * behind all three plus one further tick.
 */
export type AdultAsthmaProgress = Pick<AdultAsthmaSnapshot,
  'severityReviewedAtTick' | 'controlledOxygenAtTick' | 'bronchodilatorBundleAtTick'
  | 'corticosteroidIntentAtTick' | 'reassessedAtTick'>;

/**
 * The five control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the four overlaps — so
 * the identity guard compares ADULT_ASTHMA_OBJECTIVES instead.
 */
export const ADULT_ASTHMA_ACTIONS = [
  'review-severity-and-mimics',
  'record-controlled-oxygen',
  'give-fixed-inhaled-bronchodilators',
  'record-early-corticosteroid-intent',
  'reassess-after-initial-treatment',
] as const;

/** The three initial treatments the engine accepts in any order. */
export const ADULT_ASTHMA_PARALLEL_ACTIONS = [
  'record-controlled-oxygen',
  'give-fixed-inhaled-bronchodilators',
  'record-early-corticosteroid-intent',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const ADULT_ASTHMA_OBJECTIVES = [
  'recognize-severe-adult-asthma',
  'use-controlled-oxygen-in-adult-asthma',
  'give-initial-adult-asthma-treatment',
  'reassess-adult-asthma-response',
] as const;

export type AdultAsthmaAction = (typeof ADULT_ASTHMA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. The obstruction event alongside the narrative boundary is part of
 * the identity: this lesson arrives with the obstruction already running.
 */
export function supportsAdultAsthma(scenario: Scenario): boolean {
  return scenario.metadata.id === 'adult-asthma'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'adult-asthma').length === 1
    && scenario.timeline.filter((event) => event.type === 'obstruction').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ADULT_ASTHMA_OBJECTIVES.join('|');
}

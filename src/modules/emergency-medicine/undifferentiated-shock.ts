import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency undifferentiated-shock
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes.
 */
export type UndifferentiatedShockSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['undifferentiatedShockAssessment']>;

/**
 * Seven recorded steps against four declared objectives.
 *
 * The perfusion review and the lactate are an unordered pair; everything after
 * them is a strict chain, and the reassessment additionally waits an engine
 * tick past the fluid it is reading.
 */
export type UndifferentiatedShockProgress = Pick<UndifferentiatedShockSnapshot,
  'perfusionReviewedAtTick' | 'lactateReviewedAtTick' | 'focusedEchoReviewedAtTick'
  | 'passiveLegRaiseAtTick' | 'fluidChallengeAtTick' | 'perfusionReassessedAtTick'
  | 'escalationAtTick'>;

/**
 * The seven control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none overlaps — so the identity
 * guard compares UNDIFFERENTIATED_SHOCK_OBJECTIVES instead.
 */
export const UNDIFFERENTIATED_SHOCK_ACTIONS = [
  'review-perfusion', 'review-lactate', 'review-focused-echo',
  'perform-passive-leg-raise', 'give-targeted-fluid-challenge',
  'reassess-perfusion', 'escalate-after-reassessment',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const UNDIFFERENTIATED_SHOCK_OBJECTIVES = [
  'recognize-shock-from-perfusion',
  'assess-shock-phenotype',
  'test-fluid-responsiveness',
  'reassess-and-escalate-shock',
] as const;

export type UndifferentiatedShockAction = (typeof UNDIFFERENTIATED_SHOCK_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike. */
export function supportsUndifferentiatedShock(scenario: Scenario): boolean {
  return scenario.metadata.id === 'undifferentiated-shock'
    && scenario.timeline.filter((event) => event.type === 'shock-pattern'
      && event.target === 'fluid-responsive-low-preload').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'undifferentiated-shock').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === UNDIFFERENTIATED_SHOCK_OBJECTIVES.join('|');
}

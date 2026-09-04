import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency septic-shock lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Critical care has its own septic-shock
 * resuscitation lesson, infectious disease a septic-shock labelling one, and
 * pediatrics its own; this is the emergency-department arrival.
 */
export type SepticShockSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['septicShockAssessment']>;

/**
 * Seven recorded steps against four declared objectives, in a partial order
 * rather than a chain.
 *
 * The review gates everything. After it the engine enforces two short chains
 * and leaves one step free: cultures before the antimicrobial, and the fluid
 * course then a further engine tick then the reassessment then the
 * vasopressor. Source-control escalation is gated only by the review, so it
 * never waits for the fluid or the pressor — which is exactly what the fourth
 * declared objective asks for.
 */
export type SepticShockProgress = Pick<SepticShockSnapshot,
  'infectionAndOrganDysfunctionReviewedAtTick' | 'culturesAndLactateAtTick'
  | 'antimicrobialIntentAtTick' | 'initialCrystalloidAtTick'
  | 'postFluidReassessmentAtTick' | 'norepinephrineIntentAtTick'
  | 'sourceControlEscalationAtTick'>;

/**
 * The seven control ids the engine accepts. Note the action type is
 * `septic-shock-assessment`, not the `-response` suffix.
 *
 * They are NOT the declared objective strings — none of the four overlaps — so
 * the identity guard compares SEPTIC_SHOCK_OBJECTIVES instead.
 */
export const SEPTIC_SHOCK_ACTIONS = [
  'review-infection-and-organ-dysfunction',
  'obtain-cultures-and-lactate',
  'record-immediate-antimicrobial-intent',
  'begin-initial-crystalloid',
  'reassess-after-initial-fluid',
  'start-norepinephrine-intent',
  'escalate-source-control',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const SEPTIC_SHOCK_OBJECTIVES = [
  'recognize-probable-sepsis-with-shock',
  'pair-diagnostics-with-immediate-antimicrobial-intent',
  'give-initial-sepsis-fluid-and-reassess',
  'support-persistent-shock-and-escalate-source-control',
] as const;

export type SepticShockAction = (typeof SEPTIC_SHOCK_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario — including the critical-care resuscitation lesson and the
 * infectious-disease labelling one.
 */
export function supportsSepticShock(scenario: Scenario): boolean {
  return scenario.metadata.id === 'septic-shock'
    && scenario.timeline.filter((event) => event.type === 'sepsis-pattern'
      && event.target === 'probable-urinary-source-with-shock').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'septic-shock').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === SEPTIC_SHOCK_OBJECTIVES.join('|');
}

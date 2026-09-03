import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency
 * unstable-narrow-complex-tachycardia lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. There is a separate regular narrow-complex
 * tachycardia lesson for the stable patient; this one is the same rhythm in
 * someone the rhythm is already killing.
 */
export type UnstableNarrowTachycardiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['unstableNarrowTachycardiaAssessment']>;

/**
 * Four recorded steps against four declared objectives, in one strict chain.
 *
 * The preparation is gated ahead of the cardioversion and the reassessment sits
 * one further engine tick behind the shock, because a rhythm asked about at the
 * instant an intent is recorded reports the clock rather than the patient.
 */
export type UnstableNarrowTachycardiaProgress = Pick<UnstableNarrowTachycardiaSnapshot,
  'reviewedAtTick' | 'preparedAtTick' | 'cardiovertedAtTick' | 'reassessedAtTick'>;

/**
 * The four control ids the engine accepts. Note the action type is
 * `unstable-narrow-tachycardia-response`, shorter than the scenario id.
 *
 * They are NOT the declared objective strings — none of the four overlaps — so
 * the identity guard compares UNSTABLE_NARROW_TACHYCARDIA_OBJECTIVES instead.
 */
export const UNSTABLE_NARROW_TACHYCARDIA_ACTIONS = [
  'review-rhythm-and-instability',
  'prepare-synchronized-cardioversion',
  'record-synchronized-cardioversion-intent',
  'reassess-rhythm-and-perfusion',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const UNSTABLE_NARROW_TACHYCARDIA_OBJECTIVES = [
  'recognize-unstable-narrow-tachycardia',
  'prepare-unstable-tachycardia-response',
  'cardiovert-unstable-narrow-tachycardia',
  'reassess-after-tachycardia-cardioversion',
] as const;

export type UnstableNarrowTachycardiaAction = (typeof UNSTABLE_NARROW_TACHYCARDIA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario — including the stable regular narrow-complex tachycardia lesson.
 * The arrival rhythm change is part of the identity.
 */
export function supportsUnstableNarrowTachycardia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'unstable-narrow-complex-tachycardia'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'unstable-narrow-complex-tachycardia').length === 1
    && scenario.timeline.filter((event) => event.type === 'rhythm-change').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === UNSTABLE_NARROW_TACHYCARDIA_OBJECTIVES.join('|');
}

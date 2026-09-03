import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency unstable-bradycardia
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Cardiology has its own symptomatic sinus
 * bradycardia lesson, which is about reviewing a prescription; this one is the
 * bradycardia that has already taken the blood pressure with it.
 */
export type UnstableBradycardiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['unstableBradycardiaAssessment']>;

/**
 * Four recorded steps against four declared objectives, in one strict chain.
 *
 * The support bundle is gated ahead of the atropine and the reassessment sits
 * one further engine tick behind the drug, because a rhythm asked about at the
 * instant an intent is recorded reports the clock rather than the patient.
 */
export type UnstableBradycardiaProgress = Pick<UnstableBradycardiaSnapshot,
  'reviewedAtTick' | 'supportedAtTick' | 'atropineAtTick' | 'reassessedAtTick'>;

/**
 * The four control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the four overlaps — so
 * the identity guard compares UNSTABLE_BRADYCARDIA_OBJECTIVES instead.
 */
export const UNSTABLE_BRADYCARDIA_ACTIONS = [
  'review-bradycardia-and-compromise',
  'record-bradycardia-support',
  'record-atropine-intent',
  'reassess-bradycardia-response',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const UNSTABLE_BRADYCARDIA_OBJECTIVES = [
  'recognize-unstable-bradycardia',
  'support-unstable-bradycardia',
  'give-atropine-for-unstable-bradycardia',
  'reassess-unstable-bradycardia',
] as const;

export type UnstableBradycardiaAction = (typeof UNSTABLE_BRADYCARDIA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. The arrival rhythm change alongside the narrative boundary is part
 * of the identity: this lesson arrives with the bradycardia already running.
 */
export function supportsUnstableBradycardia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'unstable-bradycardia'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'unstable-bradycardia').length === 1
    && scenario.timeline.filter((event) => event.type === 'rhythm-change').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === UNSTABLE_BRADYCARDIA_OBJECTIVES.join('|');
}

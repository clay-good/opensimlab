import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the ICU handoff lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps. The engine case and assessment are named for
 * the response (`icu-hidden-deterioration-handoff`) rather than for the
 * scenario id.
 */
export type IcuHandoffSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['icuHiddenDeteriorationHandoffAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The cross-check step is the one that carries the lesson. "Stable septic shock
 * on low-dose support" is a sentence, and ninety minutes of dated numbers say
 * the opposite; the engine will not let the handoff be accepted or escalated
 * until the claim has been checked against the patient.
 */
export type IcuHandoffProgress = Pick<IcuHandoffSnapshot,
  'readinessAtTick' | 'contentAtTick' | 'crossCheckAtTick'
  | 'escalationAtTick' | 'acceptanceAtTick'>;

export const ICU_HANDOFF_ACTIONS = [
  'establish-icu-handoff-readiness',
  'receive-icu-handoff-content',
  'cross-check-hidden-deterioration',
  'escalate-icu-handoff-deterioration',
  'synthesize-accept-and-reassess-icu-handoff',
] as const;

export type IcuHandoffAction = (typeof ICU_HANDOFF_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario — including the neonatology module's delivery-room handoff.
 */
export function supportsIcuHandoff(scenario: Scenario): boolean {
  return scenario.metadata.id === 'icu-handoff-with-hidden-deterioration'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'icu-handoff-with-hidden-deterioration').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'icu-handoff-with-hidden-deterioration-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ICU_HANDOFF_ACTIONS.join('|');
}

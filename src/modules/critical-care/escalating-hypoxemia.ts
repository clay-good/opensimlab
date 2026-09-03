import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the escalating-hypoxemia lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type EscalatingHypoxemiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['escalatingHypoxemiaAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The order encodes a specific discipline. Validate the signal, support the
 * patient, then trace the oxygen path from the wall inwards before looking at
 * the lungs. The sequence exists because the equipment causes are the ones that
 * kill quickly and are fixed instantly, and a team that starts at the
 * parenchyma tends never to go back and check the circuit.
 */
export type EscalatingHypoxemiaProgress = Pick<EscalatingHypoxemiaSnapshot,
  'signalAtTick' | 'supportAtTick' | 'deliveryPathAtTick'
  | 'bedsidePatternAtTick' | 'escalationAtTick'>;

export const ESCALATING_HYPOXEMIA_ACTIONS = [
  'validate-hypoxemia-signal',
  'support-hypoxemia-and-call-help',
  'trace-hypoxemia-delivery-path',
  'integrate-hypoxemia-bedside-pattern',
  'escalate-and-reassess-hypoxemia',
] as const;

export type EscalatingHypoxemiaAction = (typeof ESCALATING_HYPOXEMIA_ACTIONS)[number];

/**
 * The five declared objectives, which are NOT the same strings as the actions.
 * The third differs — the objective is `trace-oxygen-delivery-path` and the
 * engine accepts `trace-hypoxemia-delivery-path` — so the identity guard has to
 * compare objectives explicitly rather than reusing the action list.
 */
export const ESCALATING_HYPOXEMIA_OBJECTIVES = [
  'validate-hypoxemia-signal',
  'support-hypoxemia-and-call-help',
  'trace-oxygen-delivery-path',
  'integrate-hypoxemia-bedside-pattern',
  'escalate-and-reassess-hypoxemia',
] as const;

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsEscalatingHypoxemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'escalating-hypoxemia'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'escalating-hypoxemia').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'escalating-hypoxemia-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ESCALATING_HYPOXEMIA_OBJECTIVES.join('|');
}

import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the ventilator circuit-disconnection
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type CircuitDisconnectionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['ventilatorCircuitDisconnectionAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * and the position of the bridge is the entire lesson.
 *
 * It sits second, before the inspection. A learner who traces the circuit first
 * is doing the right diagnostic work in the wrong order on a patient with no
 * delivered ventilation and a falling saturation. The engine refuses the
 * inspection until an alternative means of oxygenating him is recorded, so the
 * troubleshooting happens while he is being kept alive rather than instead of
 * it.
 */
export type CircuitDisconnectionProgress = Pick<CircuitDisconnectionSnapshot,
  'recognizedAtTick' | 'bridgedAtTick' | 'inspectedAtTick'
  | 'restoredAtTick' | 'reassessedAtTick'>;

export const CIRCUIT_DISCONNECTION_ACTIONS = [
  'recognize-ventilator-circuit-disconnection',
  'bridge-ventilator-circuit-disconnection',
  'inspect-ventilator-circuit-disconnection',
  'restore-ventilator-circuit-support',
  'reassess-ventilator-circuit-response',
] as const;

export type CircuitDisconnectionAction = (typeof CIRCUIT_DISCONNECTION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsCircuitDisconnection(scenario: Scenario): boolean {
  return scenario.metadata.id === 'ventilator-circuit-disconnection'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'ventilator-circuit-disconnection').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'ventilator-circuit-disconnection-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CIRCUIT_DISCONNECTION_ACTIONS.join('|');
}

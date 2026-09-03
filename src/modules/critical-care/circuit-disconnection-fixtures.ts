import type { CircuitDisconnectionAction } from './circuit-disconnection';

/**
 * Reference transcripts for the ventilator circuit-disconnection lesson.
 *
 * The common-error path is the one an obvious fix invites: the loss of
 * delivered ventilation is recognised and the learner goes straight to tracing
 * the circuit, leaving a patient with a falling saturation unventilated while
 * they hunt for the join. The recovery path skips each intervening step in
 * turn, is refused for both, and still completes from the same positions.
 */
export const CIRCUIT_DISCONNECTION_FIXTURES = {
  scenarioId: 'ventilator-circuit-disconnection', contentVersion: '0.1.0', seed: 1264,
  noAction: [],
  expert: [
    [0, 'recognize-ventilator-circuit-disconnection'],
    [1, 'bridge-ventilator-circuit-disconnection'],
    [2, 'inspect-ventilator-circuit-disconnection'],
    [3, 'restore-ventilator-circuit-support'],
    [4, 'reassess-ventilator-circuit-response'],
  ],
  commonError: [
    [0, 'recognize-ventilator-circuit-disconnection'],
    // Straight to the circuit, with nobody oxygenating him.
    [1, 'inspect-ventilator-circuit-disconnection'],
    [2, 'restore-ventilator-circuit-support'],
  ],
  recovery: [
    // The bridge before the loss has been recognised.
    [0, 'bridge-ventilator-circuit-disconnection'],
    [1, 'recognize-ventilator-circuit-disconnection'],
    [2, 'bridge-ventilator-circuit-disconnection'],
    // Restoration before the source-to-patient trace.
    [3, 'restore-ventilator-circuit-support'],
    [4, 'inspect-ventilator-circuit-disconnection'],
    [5, 'restore-ventilator-circuit-support'],
    [6, 'reassess-ventilator-circuit-response'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CircuitDisconnectionAction])[];
  expert: readonly (readonly [number, CircuitDisconnectionAction])[];
  commonError: readonly (readonly [number, CircuitDisconnectionAction])[];
  recovery: readonly (readonly [number, CircuitDisconnectionAction])[];
};

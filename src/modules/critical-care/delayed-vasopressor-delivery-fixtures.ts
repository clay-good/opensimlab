import type { DelayedVasopressorDeliveryAction } from './delayed-vasopressor-delivery';

/**
 * Reference transcripts for the delayed-vasopressor-delivery lesson.
 *
 * The common-error path is the one a running pump invites: the discordance is
 * noticed and the learner jumps straight to naming the cause, without the trace
 * that produced the 0.6 mL of drug-free downstream volume the classification
 * rests on. The recovery path skips each intervening step in turn, is refused
 * for both, and still completes from the same positions.
 */
export const DELAYED_VASOPRESSOR_DELIVERY_FIXTURES = {
  scenarioId: 'delayed-vasopressor-delivery', contentVersion: '0.1.0', seed: 5218,
  noAction: [],
  expert: [
    [0, 'review-vasopressor-command-delivery-discordance'],
    [1, 'trace-vasopressor-source-to-patient-path'],
    [2, 'classify-vasopressor-dead-space-startup-delay'],
    [3, 'activate-vasopressor-startup-safety-plan'],
    [4, 'reassess-vasopressor-delivery-and-perfusion'],
  ],
  commonError: [
    [0, 'review-vasopressor-command-delivery-discordance'],
    // Straight to the answer, without the trace it is supposed to rest on.
    [1, 'classify-vasopressor-dead-space-startup-delay'],
    [2, 'activate-vasopressor-startup-safety-plan'],
  ],
  recovery: [
    // The trace before the discordance has been reconciled.
    [0, 'trace-vasopressor-source-to-patient-path'],
    [1, 'review-vasopressor-command-delivery-discordance'],
    [2, 'trace-vasopressor-source-to-patient-path'],
    // The safety plan before the pattern it is meant to answer.
    [3, 'activate-vasopressor-startup-safety-plan'],
    [4, 'classify-vasopressor-dead-space-startup-delay'],
    [5, 'activate-vasopressor-startup-safety-plan'],
    [6, 'reassess-vasopressor-delivery-and-perfusion'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, DelayedVasopressorDeliveryAction])[];
  expert: readonly (readonly [number, DelayedVasopressorDeliveryAction])[];
  commonError: readonly (readonly [number, DelayedVasopressorDeliveryAction])[];
  recovery: readonly (readonly [number, DelayedVasopressorDeliveryAction])[];
};

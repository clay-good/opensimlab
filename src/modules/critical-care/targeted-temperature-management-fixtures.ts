import type { TargetedTemperatureManagementAction } from './targeted-temperature-management';

/**
 * Reference transcripts for the post-arrest temperature-control lesson.
 *
 * The common-error path is the one a remembered number invites: eligibility is
 * recognised and the learner activates a protocol immediately, skipping the
 * review that holds the neurologic, seizure, perfusion and cause context
 * together and refuses to let any single sign carry a prognosis. The recovery
 * path skips each intervening step in turn, is refused for both, and still
 * completes from the same positions.
 */
export const TARGETED_TEMPERATURE_MANAGEMENT_FIXTURES = {
  scenarioId: 'targeted-temperature-management', contentVersion: '0.1.0', seed: 9375,
  noAction: [],
  expert: [
    [0, 'recognize-post-arrest-temperature-control'],
    [1, 'review-post-arrest-temperature-context'],
    [2, 'activate-post-arrest-temperature-protocol'],
    [3, 'record-temperature-control-guardrails'],
    [4, 'reassess-post-arrest-temperature-trajectory'],
  ],
  commonError: [
    [0, 'recognize-post-arrest-temperature-control'],
    // Straight to the protocol, on the strength of a number already in mind.
    [1, 'activate-post-arrest-temperature-protocol'],
    [2, 'record-temperature-control-guardrails'],
  ],
  recovery: [
    // The context before eligibility has been recognised.
    [0, 'review-post-arrest-temperature-context'],
    [1, 'recognize-post-arrest-temperature-control'],
    [2, 'review-post-arrest-temperature-context'],
    // The guardrails before there is a protocol for them to guard.
    [3, 'record-temperature-control-guardrails'],
    [4, 'activate-post-arrest-temperature-protocol'],
    [5, 'record-temperature-control-guardrails'],
    [6, 'reassess-post-arrest-temperature-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, TargetedTemperatureManagementAction])[];
  expert: readonly (readonly [number, TargetedTemperatureManagementAction])[];
  commonError: readonly (readonly [number, TargetedTemperatureManagementAction])[];
  recovery: readonly (readonly [number, TargetedTemperatureManagementAction])[];
};

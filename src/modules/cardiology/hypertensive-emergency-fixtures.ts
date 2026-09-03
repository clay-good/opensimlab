import type { HypertensiveEmergencyAction } from './hypertensive-emergency';

/**
 * Reference transcripts for the hypertensive-emergency lesson.
 *
 * The common-error path is the one the number invites: the measurement is
 * verified and the learner goes straight for the treatment, skipping the organ
 * injury that is the only thing making this an emergency. The recovery path
 * takes the closing pair in the other order — which the engine accepts without
 * comment — and walks into both time gates before clearing them.
 */
export const HYPERTENSIVE_EMERGENCY_FIXTURES = {
  scenarioId: 'hypertensive-emergency', contentVersion: '0.1.0', seed: 2465,
  noAction: [],
  expert: [
    [0, 'reconcile-hypertensive-emergency-measurement-and-trajectory'],
    [1, 'review-hypertensive-emergency-organ-injury'],
    [2, 'record-hypertensive-emergency-controlled-reduction-intent'],
    [3, 'review-hypertensive-emergency-phenotype-and-causes'],
    [4, 'review-hypertensive-emergency-later-panel'],
    [5, 'handoff-hypertensive-emergency-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-hypertensive-emergency-measurement-and-trajectory'],
    // Treating the number without finding the injury.
    [1, 'record-hypertensive-emergency-controlled-reduction-intent'],
    [2, 'review-hypertensive-emergency-phenotype-and-causes'],
  ],
  recovery: [
    // Reviewing the injury before the measurement has been verified.
    [0, 'review-hypertensive-emergency-organ-injury'],
    [1, 'reconcile-hypertensive-emergency-measurement-and-trajectory'],
    [2, 'review-hypertensive-emergency-organ-injury'],
    // The closing pair in the other order.
    [3, 'review-hypertensive-emergency-phenotype-and-causes'],
    [4, 'record-hypertensive-emergency-controlled-reduction-intent'],
    // Both time gates, each taken too early before it is taken correctly.
    [4, 'review-hypertensive-emergency-later-panel'],
    [5, 'review-hypertensive-emergency-later-panel'],
    [5, 'handoff-hypertensive-emergency-reassessment'],
    [6, 'handoff-hypertensive-emergency-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HypertensiveEmergencyAction])[];
  expert: readonly (readonly [number, HypertensiveEmergencyAction])[];
  commonError: readonly (readonly [number, HypertensiveEmergencyAction])[];
  recovery: readonly (readonly [number, HypertensiveEmergencyAction])[];
};

import type { LargePleuralEffusionAction } from './large-unilateral-pleural-effusion-reassessment';

/**
 * Reference transcripts for the large-effusion lesson.
 *
 * The error path is the one a striking radiograph invites: skip the aspiration
 * intent and go straight to reviewing a drainage response that has not
 * happened. It is an ordering error rather than a treatment error, because
 * this lesson performs no procedure. What it skips is the record of what the
 * pleural team is being asked to do and on what terms — symptom-led stop
 * triggers, and no target volume.
 */
export const LARGE_PLEURAL_EFFUSION_FIXTURES = {
  scenarioId: 'large-unilateral-pleural-effusion-reassessment', contentVersion: '0.1.0', seed: 7398,
  noAction: [],
  expert: [
    [0, 'reconcile-large-unilateral-pleural-effusion-trajectory'],
    [1, 'record-large-unilateral-pleural-effusion-pleural-team-and-drainage-intent'],
    [2, 'review-large-unilateral-pleural-effusion-drainage-response'],
    [3, 'review-large-unilateral-pleural-effusion-fluid-pattern-and-causes'],
    [4, 'coordinate-large-unilateral-pleural-effusion-definitive-evaluation'],
    [5, 'handoff-large-unilateral-pleural-effusion-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-large-unilateral-pleural-effusion-trajectory'],
    [1, 'review-large-unilateral-pleural-effusion-drainage-response'],
    [2, 'review-large-unilateral-pleural-effusion-fluid-pattern-and-causes'],
  ],
  recovery: [
    [0, 'reconcile-large-unilateral-pleural-effusion-trajectory'],
    [1, 'review-large-unilateral-pleural-effusion-drainage-response'],
    [2, 'record-large-unilateral-pleural-effusion-pleural-team-and-drainage-intent'],
    [3, 'review-large-unilateral-pleural-effusion-drainage-response'],
    [4, 'review-large-unilateral-pleural-effusion-fluid-pattern-and-causes'],
    [5, 'coordinate-large-unilateral-pleural-effusion-definitive-evaluation'],
    [6, 'handoff-large-unilateral-pleural-effusion-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, LargePleuralEffusionAction])[];
  expert: readonly (readonly [number, LargePleuralEffusionAction])[];
  commonError: readonly (readonly [number, LargePleuralEffusionAction])[];
  recovery: readonly (readonly [number, LargePleuralEffusionAction])[];
};

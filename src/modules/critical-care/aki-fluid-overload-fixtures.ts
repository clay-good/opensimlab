import type { AkiFluidOverloadAction } from './aki-fluid-overload';

/**
 * Reference transcripts for the AKI-with-fluid-overload lesson.
 *
 * The common-error path is the one nine kilograms invites: the trajectory is
 * recognised and the learner goes to the kidney-support conversation, skipping
 * both the cause review — obstruction, abdominal pressure, perfusion — and the
 * free step of stopping the intake that is still running. The recovery path
 * skips each intervening step in turn, is refused for both, and still completes
 * from the same positions.
 */
export const AKI_FLUID_OVERLOAD_FIXTURES = {
  scenarioId: 'acute-kidney-injury-with-fluid-overload', contentVersion: '0.1.0', seed: 2748,
  noAction: [],
  expert: [
    [0, 'recognize-aki-fluid-overload'],
    [1, 'review-aki-fluid-overload-context'],
    [2, 'limit-fluid-and-review-diuretic-response'],
    [3, 'activate-individualized-kidney-support-pathway'],
    [4, 'reassess-aki-fluid-overload-trajectory'],
  ],
  commonError: [
    [0, 'recognize-aki-fluid-overload'],
    // Straight to the dialysis conversation, past the free step and the causes.
    [1, 'activate-individualized-kidney-support-pathway'],
    [2, 'reassess-aki-fluid-overload-trajectory'],
  ],
  recovery: [
    // The context before the trajectory has been recognised.
    [0, 'review-aki-fluid-overload-context'],
    [1, 'recognize-aki-fluid-overload'],
    [2, 'review-aki-fluid-overload-context'],
    // Kidney support before the intake has been stopped.
    [3, 'activate-individualized-kidney-support-pathway'],
    [4, 'limit-fluid-and-review-diuretic-response'],
    [5, 'activate-individualized-kidney-support-pathway'],
    [6, 'reassess-aki-fluid-overload-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AkiFluidOverloadAction])[];
  expert: readonly (readonly [number, AkiFluidOverloadAction])[];
  commonError: readonly (readonly [number, AkiFluidOverloadAction])[];
  recovery: readonly (readonly [number, AkiFluidOverloadAction])[];
};

import type { MassivePeAction } from './massive-pe';

/**
 * Reference transcripts for the massive pulmonary-embolism lesson.
 *
 * The common-error path is the one a dying patient with an obvious answer
 * invites: the failure state is recognised and the learner jumps to the bridge,
 * skipping the review that keeps the bleeding risk visible and the support that
 * protects the ventricle in the meantime. The recovery path skips each
 * intervening step in turn, is refused for both, and still completes from the
 * same positions.
 */
export const MASSIVE_PE_FIXTURES = {
  scenarioId: 'massive-pulmonary-embolism', contentVersion: '0.1.0', seed: 8933,
  noAction: [],
  expert: [
    [0, 'recognize-refractory-pe-shock'],
    [1, 'review-refractory-pe-pattern'],
    [2, 'record-refractory-pe-support'],
    [3, 'activate-pe-ecmo-bridge'],
    [4, 'reassess-pe-ecmo-trajectory'],
  ],
  commonError: [
    [0, 'recognize-refractory-pe-shock'],
    // Straight to the bridge, with neither the review nor the support.
    [1, 'activate-pe-ecmo-bridge'],
    [2, 'reassess-pe-ecmo-trajectory'],
  ],
  recovery: [
    // The review before the failure state has been named.
    [0, 'review-refractory-pe-pattern'],
    [1, 'recognize-refractory-pe-shock'],
    [2, 'review-refractory-pe-pattern'],
    // The bridge before the support that holds him until it is running.
    [3, 'activate-pe-ecmo-bridge'],
    [4, 'record-refractory-pe-support'],
    [5, 'activate-pe-ecmo-bridge'],
    [6, 'reassess-pe-ecmo-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MassivePeAction])[];
  expert: readonly (readonly [number, MassivePeAction])[];
  commonError: readonly (readonly [number, MassivePeAction])[];
  recovery: readonly (readonly [number, MassivePeAction])[];
};

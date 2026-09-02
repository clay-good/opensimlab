import type { StableWideTachycardiaAction } from './stable-wide-tachycardia';

/**
 * Reference transcripts for the stable wide-complex tachycardia lesson.
 *
 * The common-error path is the one both tachycardia lessons share: the
 * medication path is recorded and then escalation is reached for without
 * anybody looking at whether the drug worked. The recovery path additionally
 * reaches for the drug before the room is ready, and walks into both time
 * gates.
 */
export const STABLE_WIDE_TACHYCARDIA_FIXTURES = {
  scenarioId: 'wide-complex-tachycardia', contentVersion: '0.1.0', seed: 9047,
  noAction: [],
  expert: [
    [0, 'reconcile-stable-wide-complex-tachycardia'],
    [1, 'review-wide-complex-context'],
    [2, 'prepare-wide-complex-pathway'],
    [3, 'record-wide-complex-procainamide-pathway'],
    [4, 'review-wide-complex-medication-nonresponse'],
    [5, 'record-wide-complex-cardioversion-intent'],
    [6, 'reassess-wide-complex-trajectory'],
  ],
  commonError: [
    [0, 'reconcile-stable-wide-complex-tachycardia'],
    [1, 'review-wide-complex-context'],
    [2, 'prepare-wide-complex-pathway'],
    [3, 'record-wide-complex-procainamide-pathway'],
    // Escalating without looking at the drug.
    [4, 'record-wide-complex-cardioversion-intent'],
  ],
  recovery: [
    [0, 'reconcile-stable-wide-complex-tachycardia'],
    [1, 'review-wide-complex-context'],
    // The drug before the room is ready.
    [2, 'record-wide-complex-procainamide-pathway'],
    [3, 'prepare-wide-complex-pathway'],
    [4, 'record-wide-complex-procainamide-pathway'],
    // Both time gates, each taken too early before it is taken correctly.
    [4, 'review-wide-complex-medication-nonresponse'],
    [5, 'review-wide-complex-medication-nonresponse'],
    [6, 'record-wide-complex-cardioversion-intent'],
    [6, 'reassess-wide-complex-trajectory'],
    [7, 'reassess-wide-complex-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, StableWideTachycardiaAction])[];
  expert: readonly (readonly [number, StableWideTachycardiaAction])[];
  commonError: readonly (readonly [number, StableWideTachycardiaAction])[];
  recovery: readonly (readonly [number, StableWideTachycardiaAction])[];
};

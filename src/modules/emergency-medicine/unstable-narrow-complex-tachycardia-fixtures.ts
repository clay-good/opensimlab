import type { UnstableNarrowTachycardiaAction } from './unstable-narrow-complex-tachycardia';

/**
 * Reference transcripts for the emergency unstable narrow-complex tachycardia
 * lesson.
 *
 * The common-error path is the one that reaches for the shock without anyone
 * having put the pads on: the rhythm and the instability are reviewed and the
 * cardioversion intent is recorded with no help called, no monitoring, no
 * access and no pads. It is refused. The recovery path skips the review, is
 * refused, then reaches for the reassessment on the same tick as the shock and
 * is refused again, and still completes from the same positions.
 */
export const UNSTABLE_NARROW_TACHYCARDIA_FIXTURES = {
  scenarioId: 'unstable-narrow-complex-tachycardia', contentVersion: '0.1.0', seed: 1889,
  noAction: [],
  expert: [
    [0, 'review-rhythm-and-instability'],
    [1, 'prepare-synchronized-cardioversion'],
    [2, 'record-synchronized-cardioversion-intent'],
    [3, 'reassess-rhythm-and-perfusion'],
  ],
  commonError: [
    [0, 'review-rhythm-and-instability'],
    // The shock, with nobody prepared to deliver it.
    [1, 'record-synchronized-cardioversion-intent'],
  ],
  recovery: [
    // Preparation before anyone said why this patient needs it.
    [0, 'prepare-synchronized-cardioversion'],
    [1, 'review-rhythm-and-instability'],
    [2, 'prepare-synchronized-cardioversion'],
    [3, 'record-synchronized-cardioversion-intent'],
    // The reassessment on the same tick as the shock.
    [3, 'reassess-rhythm-and-perfusion'],
    [4, 'reassess-rhythm-and-perfusion'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, UnstableNarrowTachycardiaAction])[];
  expert: readonly (readonly [number, UnstableNarrowTachycardiaAction])[];
  commonError: readonly (readonly [number, UnstableNarrowTachycardiaAction])[];
  recovery: readonly (readonly [number, UnstableNarrowTachycardiaAction])[];
};

import type { AfRvrAction } from './af-rvr';

/**
 * Reference transcripts for the AF-with-rapid-response lesson.
 *
 * This engine case authors no refusable choice and no time gate. The
 * common-error path is the one the number invites: reconcile the rhythm and
 * then reach straight for rate-control intent, without ever asking how long
 * this has been going on. The recovery path takes that refusal and one before
 * it.
 */
export const AF_RVR_FIXTURES = {
  scenarioId: 'atrial-fibrillation-with-rapid-response', contentVersion: '0.1.0', seed: 7462,
  noAction: [],
  expert: [
    [0, 'reconcile-af-rvr-rhythm-and-stability'],
    [1, 'review-af-rvr-context-and-triggers'],
    [2, 'record-af-rvr-rate-control-intent'],
    [3, 'record-af-rvr-stroke-prevention-intent'],
    [4, 'reassess-af-rvr-trajectory-and-follow-up'],
  ],
  commonError: [
    [0, 'reconcile-af-rvr-rhythm-and-stability'],
    // Treating 142 before asking how long it has been 142.
    [1, 'record-af-rvr-rate-control-intent'],
    [2, 'record-af-rvr-stroke-prevention-intent'],
  ],
  recovery: [
    // Reviewing the context before the rhythm and stability are read.
    [0, 'review-af-rvr-context-and-triggers'],
    [1, 'reconcile-af-rvr-rhythm-and-stability'],
    [2, 'review-af-rvr-context-and-triggers'],
    // Then reaching past rate control to the stroke lane, corrected.
    [3, 'record-af-rvr-stroke-prevention-intent'],
    [4, 'record-af-rvr-rate-control-intent'],
    [5, 'record-af-rvr-stroke-prevention-intent'],
    [6, 'reassess-af-rvr-trajectory-and-follow-up'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AfRvrAction])[];
  expert: readonly (readonly [number, AfRvrAction])[];
  commonError: readonly (readonly [number, AfRvrAction])[];
  recovery: readonly (readonly [number, AfRvrAction])[];
};

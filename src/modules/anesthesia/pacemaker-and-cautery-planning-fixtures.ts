import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the pacemaker-and-cautery planning lesson.
 *
 * Four bounded steps: review the device record, review the procedure and its
 * interference pattern, choose a coordinated plan, and document backup and
 * restoration. The plan step accepts three answers and only one of them is
 * supported by the fixed facts.
 *
 * The error path is not a skipped step. It does both reviews properly and then
 * reaches for the magnet — the shortcut the objective is written against, since
 * magnet response is device specific and this record documents it rather than
 * guaranteeing it. What that costs is TWO objectives, because the documentation
 * that follows a shortcut plan is not credited even though the learner did it.
 *
 * The recovery path is an ordering refusal rather than a corrected plan, and
 * that is the finding rather than an omission: a recorded plan cannot be
 * replaced within an attempt, so the magnet is not recoverable from. What this
 * path shows instead is the refusal that costs nothing once heeded — reaching
 * for the plan first, being told to review, and then doing so.
 */

const STEP = (tick: number, action: string): LearnerAction =>
  ({ tick, type: 'cied-planning-assessment', payload: { action } });

export const PACEMAKER_AND_CAUTERY_PLANNING_FIXTURES = {
  scenarioId: 'pacemaker-and-cautery-planning', contentVersion: '0.1.0',
  seed: 7712, ticks: 3000,

  /** No record is read and no plan is made. */
  noAction: [] as readonly LearnerAction[],

  /** Both reviews, the coordinated plan, then backup and restoration. */
  expert: [
    STEP(300, 'review-device-record'),
    STEP(600, 'review-procedure-emi'),
    STEP(900, 'coordinate-asynchronous-pacing'),
    STEP(1200, 'document-backup-and-restoration'),
  ] as readonly LearnerAction[],

  /** The homework done, and then the shortcut anyway. */
  commonError: [
    STEP(300, 'review-device-record'),
    STEP(600, 'review-procedure-emi'),
    STEP(900, 'apply-unverified-magnet'),
    STEP(1200, 'document-backup-and-restoration'),
  ] as readonly LearnerAction[],

  /** Planning before reading, refused, and then done in the order that works. */
  recovery: [
    STEP(300, 'coordinate-asynchronous-pacing'),
    STEP(600, 'review-device-record'),
    STEP(900, 'review-procedure-emi'),
    STEP(1200, 'coordinate-asynchronous-pacing'),
    STEP(1500, 'document-backup-and-restoration'),
  ] as readonly LearnerAction[],
} as const;

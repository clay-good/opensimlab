import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the postoperative-handoff lesson.
 *
 * Six bounded steps in an enforced order: confirm the receiver is ready, share
 * the patient and course, share the current state, name the risks and who owns
 * them, hear the read-back, and accept the transfer.
 *
 * The counterfactual is one step, and the engine makes it consequential rather
 * than merely marked down. The error path does everything except the read-back
 * and then reaches for acceptance — and the acceptance is REFUSED. Responsibility
 * does not move. The recovery path is that array plus the two actions that
 * follow from taking the refusal seriously: the read-back, and then the
 * acceptance that is now allowed.
 *
 * Three of the four objectives are met on the error path, because the content
 * really was shared. What was not done is the only part that transfers anything.
 */

const STEP = (tick: number, action: string): LearnerAction =>
  ({ tick, type: 'postoperative-handoff-assessment', payload: { action } });

/** Everything a good handoff contains, minus the half that makes it a handoff. */
const toldThemEverything: readonly LearnerAction[] = [
  STEP(300, 'confirm-receiver-readiness'),
  STEP(600, 'share-patient-and-course'),
  STEP(900, 'share-current-state'),
  STEP(1200, 'share-risks-actions-ownership'),
  STEP(1500, 'accept-transfer'),
];

export const POSTOPERATIVE_HANDOFF_FIXTURES = {
  scenarioId: 'postoperative-handoff', contentVersion: '0.1.0',
  seed: 6633, ticks: 3000,

  /** Nothing is said at all. Nobody accepts anything. */
  noAction: [] as readonly LearnerAction[],

  /** All six steps, with the read-back before the acceptance. */
  expert: [
    STEP(300, 'confirm-receiver-readiness'),
    STEP(600, 'share-patient-and-course'),
    STEP(900, 'share-current-state'),
    STEP(1200, 'share-risks-actions-ownership'),
    STEP(1500, 'receiver-readback'),
    STEP(1800, 'accept-transfer'),
  ] as readonly LearnerAction[],

  /** Everything said, nothing heard back, and the acceptance refused. */
  commonError: toldThemEverything,

  /** The identical handoff, and the refusal taken seriously. */
  recovery: [
    ...toldThemEverything,
    STEP(1800, 'receiver-readback'),
    STEP(2100, 'accept-transfer'),
  ] as readonly LearnerAction[],
} as const;

import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the perioperative-hyperglycemia lesson.
 *
 * The glucose course begins at tick 100 with a fixed point-of-care value of 238
 * mg/dL. Three bounded responses run in a strict order the engine enforces:
 * confirm the value, record institutional insulin-protocol intent, and -- no
 * sooner than 18,000 ticks, thirty simulated minutes, after that intent --
 * repeat the point-of-care check.
 *
 * The error path is impatience rather than ignorance. It confirms and records
 * correctly and then repeats the glucose at fifteen minutes. The engine declines
 * it with repeat-glucose-too-early and the learner does not ask again, so the
 * objective is lost to a check made too soon rather than to one never made.
 *
 * The recovery path is that transcript with a second attempt after the interval
 * has actually elapsed, and it meets all three.
 */

const GLYCEMIC = (tick: number, response: string): LearnerAction =>
  ({ tick, type: 'glycemic-response', payload: { response } });

/** Confirmed, recorded, and then asked fifteen minutes too soon. */
const repeatedTooEarly: readonly LearnerAction[] = [
  GLYCEMIC(600, 'confirm-point-of-care-glucose'),
  GLYCEMIC(700, 'record-insulin-protocol-intent'),
  GLYCEMIC(9000, 'repeat-point-of-care-glucose'),
];

export const PERIOPERATIVE_HYPERGLYCEMIA_FIXTURES = {
  scenarioId: 'perioperative-hyperglycemia', contentVersion: '0.1.1',
  seed: 7405, ticks: 19_200,

  /** The elevated value is never confirmed. */
  noAction: [] as readonly LearnerAction[],

  /** Confirm, record, and repeat once the interval has elapsed. */
  expert: [
    GLYCEMIC(600, 'confirm-point-of-care-glucose'),
    GLYCEMIC(700, 'record-insulin-protocol-intent'),
    GLYCEMIC(18_800, 'repeat-point-of-care-glucose'),
  ] as readonly LearnerAction[],

  /** The repeat asked for at fifteen minutes, refused, and not asked again. */
  commonError: repeatedTooEarly,

  /** The same transcript, asked again after the interval has passed. */
  recovery: [
    ...repeatedTooEarly, GLYCEMIC(18_800, 'repeat-point-of-care-glucose'),
  ] as readonly LearnerAction[],
} as const;

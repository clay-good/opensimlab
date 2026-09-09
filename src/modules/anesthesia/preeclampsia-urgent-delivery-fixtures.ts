import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the preeclampsia-urgent-delivery lesson.
 *
 * Three bounded actions -- repeat the pressure, labetalol 20 mg IV, magnesium
 * sulfate 4 g IV -- and one confirmation gate: neither drug is accepted until a
 * repeat pressure has been taken.
 *
 * The error path is not a skipped step or a wrong drug. It confirms the
 * pressure, gives magnesium, waits, and reassesses: everything it does is
 * correct, and the pressure thirty simulated minutes later is 165/120 mmHg,
 * unchanged to the digit. Magnesium is seizure prophylaxis and this model says
 * so by moving nothing. The objective it earns is credited in full while the
 * emergency it was reached for is untreated.
 *
 * The recovery path is that transcript plus the labetalol that was missing and
 * a second reassessment. Unlike the recorded plan in the CIED lesson, nothing
 * here is spent by being done in the wrong order.
 */

const STEP = (tick: number, action: string): LearnerAction =>
  ({ tick, type: 'preeclampsia-response', payload: { action } });

/** Confirm, then reach for the wrong one of the two drugs, then look. */
const prophylaxisAlone: readonly LearnerAction[] = [
  STEP(300, 'repeat-blood-pressure'),
  STEP(600, 'magnesium-sulfate-4g-iv'),
  STEP(2400, 'repeat-blood-pressure'),
];

export const PREECLAMPSIA_URGENT_DELIVERY_FIXTURES = {
  scenarioId: 'preeclampsia-urgent-delivery', contentVersion: '0.1.0',
  seed: 4471, ticks: 6000,

  /** The pressure is never confirmed and nothing is given. */
  noAction: [] as readonly LearnerAction[],

  /** Confirm, treat the pressure, start prophylaxis, then reassess. */
  expert: [
    STEP(300, 'repeat-blood-pressure'),
    STEP(600, 'labetalol-20mg-iv'),
    STEP(900, 'magnesium-sulfate-4g-iv'),
    STEP(2400, 'repeat-blood-pressure'),
  ] as readonly LearnerAction[],

  /** Prophylaxis mistaken for treatment, and a pressure that has not moved. */
  commonError: prophylaxisAlone,

  /** The same transcript, and then the drug that lowers the pressure. */
  recovery: [
    ...prophylaxisAlone,
    STEP(2700, 'labetalol-20mg-iv'),
    STEP(4200, 'repeat-blood-pressure'),
  ] as readonly LearnerAction[],
} as const;

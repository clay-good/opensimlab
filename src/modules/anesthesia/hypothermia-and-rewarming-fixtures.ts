import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the hypothermia lesson.
 *
 * The fixed cooling course begins at tick 100 and takes the core temperature
 * from 36.7 down towards 35.5°C. Three bounded responses are available --
 * confirm the core temperature, start forced-air surface warming, record warmed
 * bulk fluids -- and the engine refuses either warming action until the
 * temperature has been confirmed.
 *
 * The error path confirms properly and then warms the FLUIDS and nothing else.
 * It earns that objective outright, and the temperature it produces is identical
 * to the untreated run at every tick: a nadir of 35.51°C, never recovering. In
 * this model warmed fluids are a recorded intent with no thermal effect at all.
 *
 * The recovery path adds surface warming at tick 2,400 and meets all four. Its
 * nadir is 35.83°C against the expert path's 36.36 -- the score cannot tell
 * those two runs apart and the patient can.
 */

const THERMAL = (tick: number, response: string): LearnerAction =>
  ({ tick, type: 'thermal-response', payload: { response } });

/** Confirmed, and then the one warming action that warms nobody. */
const fluidsWarmedOnly: readonly LearnerAction[] = [
  THERMAL(600, 'confirm-core-temperature'),
  THERMAL(800, 'record-warmed-bulk-fluids'),
];

export const HYPOTHERMIA_AND_REWARMING_FIXTURES = {
  scenarioId: 'hypothermia-and-rewarming', contentVersion: '0.1.0',
  seed: 2946, ticks: 9000,

  /** The cooling trend is never read and nothing is warmed. */
  noAction: [] as readonly LearnerAction[],

  /** Confirm, then surface warming, then the fluids. */
  expert: [
    THERMAL(600, 'confirm-core-temperature'),
    THERMAL(700, 'start-forced-air-warming'),
    THERMAL(800, 'record-warmed-bulk-fluids'),
  ] as readonly LearnerAction[],

  /** The fluids warmed and the patient not. */
  commonError: fluidsWarmedOnly,

  /** The same opening, and the surface warming that actually does it. */
  recovery: [
    ...fluidsWarmedOnly, THERMAL(2400, 'start-forced-air-warming'),
  ] as readonly LearnerAction[],
} as const;

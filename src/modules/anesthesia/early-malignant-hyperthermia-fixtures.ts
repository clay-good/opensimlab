import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the early-MH lesson.
 *
 * Every path except the idle one opens with the same ordinary thing: sevoflurane
 * at 2% on a 2 L/min circle, which is a competent volatile maintenance and is
 * also the trigger. The crisis in this lesson is latent rather than scheduled —
 * it fires on genuine end-tidal exposure — so the no-action transcript never
 * develops rigidity and exercises none of the four objectives. That is the
 * correct reading rather than a gap: there is no malignant hyperthermia in a
 * patient who was never given a trigger.
 *
 * Measured from the first modelled rigidity at tick 2,400:
 *
 *   expert    rescue at 2 s, dantrolene at 22 s    peak CO2 39, peak rigidity 0.37
 *   recovery  rescue at 72 s, dantrolene at 112 s  peak CO2 53, peak rigidity 0.42
 *   error     never                                peak CO2 109, peak rigidity 0.91
 *
 * One honest oddity in the expert path is worth knowing before reading its
 * debrief. reassess-mh-response is met there on a trace where end-tidal carbon
 * dioxide goes from 39 to 39: treating within two seconds means there was never
 * anything to reverse. The recovery path is the one that actually demonstrates
 * the physiology, falling from 53 to 49 over its reassessment window. Fast
 * enough to prevent and fast enough to show are not the same thing, and a test
 * pins both numbers.
 */

/** Competent volatile maintenance, and the trigger. Both, at the same time. */
const VOLATILE_MAINTENANCE: LearnerAction = {
  tick: 60, type: 'ventilator',
  payload: {
    fio2: 1, delivering: true, mode: 'volume-control', tidalVolumeMl: 500,
    respiratoryRateBpm: 12, freshGasFlowLPerMin: 2, sevofluranePercent: 2,
  },
};

/**
 * Vaporizer to zero, 100% oxygen, 15 L/min, and minute ventilation at 14.4 L
 * against a 6 L baseline. The objective asks for all four together and reads
 * each of them, so they go in one accepted action.
 */
const RESCUE = (tick: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: {
    sevofluranePercent: 0, fio2: 1, freshGasFlowLPerMin: 15,
    tidalVolumeMl: 600, respiratoryRateBpm: 24, delivering: true, mode: 'volume-control',
  },
});

const DANTROLENE = (tick: number): LearnerAction =>
  ({ tick, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 } });

export const EARLY_MH_FIXTURES = {
  scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia',
  contentVersion: '0.1.0', seed: 3308, ticks: 7200,

  /** No volatile, so no trigger, so no crisis and nothing exercised. */
  noAction: [] as readonly LearnerAction[],

  /** The trigger, then the whole response inside every window it declares. */
  expert: [
    VOLATILE_MAINTENANCE,
    RESCUE(2500),
    DANTROLENE(2700),
  ] as readonly LearnerAction[],

  /** The trigger, and a pattern read as an ordinary light plane instead. */
  commonError: [VOLATILE_MAINTENANCE] as readonly LearnerAction[],

  /** The same trigger, recognised late, and then treated completely. */
  recovery: [
    VOLATILE_MAINTENANCE,
    RESCUE(3200),
    DANTROLENE(3600),
  ] as readonly LearnerAction[],
} as const;

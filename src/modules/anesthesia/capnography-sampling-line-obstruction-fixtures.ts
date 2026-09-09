import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the capnography-sampling-line lesson.
 *
 * The sampling line blocks at tick 1,200 and the capnogram goes flat. Nothing
 * else has changed: the patient breathes at 14 a minute with a saturation of 98%
 * throughout, and holds both for the rest of the case whatever anyone does.
 *
 * That makes the middle objective unusual -- it is satisfied by restraint, and
 * violated by treatment. The error path answers the flat trace with a
 * laryngoscope. The instrumentation costs the objective outright AND costs the
 * patient: the spontaneous respiratory rate falls to zero and the lowest
 * saturation to 96%, so the apnoea the learner feared is the one they caused.
 *
 * The recovery path is the same reflex in its milder form -- taking over the
 * ventilator rather than the airway. The rubric grades that partly met rather
 * than not met, and the patient keeps a rate and a saturation.
 */

const CROSS_CHECK = (tick: number): LearnerAction =>
  ({ tick, type: 'capnography-line', payload: { action: 'cross-check-ventilation' } });
const RECONNECT = (tick: number): LearnerAction =>
  ({ tick, type: 'capnography-line', payload: { action: 'reconnect' } });

export const CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION_FIXTURES = {
  scenarioId: 'capnography-sampling-line-obstruction', contentVersion: '0.1.0',
  seed: 6602, ticks: 3600,

  /** Nobody touches anything. The patient is fine; two objectives are not. */
  noAction: [] as readonly LearnerAction[],

  /** Cross-check at 10 seconds, restore the sample path at 30. */
  expert: [CROSS_CHECK(1300), RECONNECT(1500)] as readonly LearnerAction[],

  /** The flat trace answered with a laryngoscope. */
  commonError: [
    { tick: 1300, type: 'laryngoscopy', payload: { technique: 'video' } },
    CROSS_CHECK(1500), RECONNECT(1700),
  ] as readonly LearnerAction[],

  /** The same reflex, reaching for the ventilator instead of the airway. */
  recovery: [
    { tick: 1300, type: 'ventilator',
      payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
    CROSS_CHECK(1500), RECONNECT(1700),
  ] as readonly LearnerAction[],
} as const;

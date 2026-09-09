import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the opioid-induced ventilatory-impairment lesson.
 *
 * The scripted impairment begins at tick 100 and every timed objective measures
 * delay from there: help within 30 seconds, active breath delivery at 95% oxygen
 * or more within 45.
 *
 * The error path is the one the briefing warns about in its own words, and it is
 * worse than doing nothing in the only way that matters. It turns the oxygen up
 * to 100% WITHOUT starting breath delivery, and then watches. Saturation reads
 * 100% for the rest of the run while the respiratory rate stays at 4 a minute
 * and the end-tidal carbon dioxide climbs to 50 mmHg. Compared against the
 * no-action path at the same tick -- 96%, the same rate, the same carbon dioxide
 * -- the run that treated nothing has the WORSE number on the monitor. The
 * intervention did not help the patient and did hide the deterioration.
 *
 * The recovery path is that identical opening followed by a real rescue. It
 * arrives late rather than never, which the rubric grades as partial credit on
 * both timed objectives rather than as a failure: recognition here is a
 * gradient, and the transcripts show all three points on it.
 */

const HELP = (tick: number): LearnerAction =>
  ({ tick, type: 'call-for-help', payload: { context: 'airway' } });
const RESPONSE = (tick: number, response: string): LearnerAction =>
  ({ tick, type: 'opioid-ventilatory-response', payload: { response } });
/** Breath delivery at 100% oxygen: the support the second objective reads. */
const SUPPORT = (tick: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 },
});
/** Oxygen without breath delivery: the thing that is not support. */
const OXYGEN_ALONE: LearnerAction =
  ({ tick: 300, type: 'ventilator', payload: { fio2: 1, delivering: false } });
/** Back to spontaneous, which is the only way the last objective can be read. */
const WEAN = (tick: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { delivering: false } });

export const OPIOID_INDUCED_VENTILATORY_IMPAIRMENT_FIXTURES = {
  scenarioId: 'opioid-induced-ventilatory-impairment', contentVersion: '0.1.0',
  seed: 8123, ticks: 3000,

  /** The pattern is never recognised and nothing is done. */
  noAction: [] as readonly LearnerAction[],

  /** Help at 10 seconds, support at 20, hold, reversal intent, then wean. */
  expert: [
    HELP(200), SUPPORT(300),
    RESPONSE(400, 'hold-further-opioid'),
    RESPONSE(500, 'record-naloxone-titration'),
    WEAN(1500),
  ] as readonly LearnerAction[],

  /** The oxygen turned up, and the saturation watched. */
  commonError: [OXYGEN_ALONE] as readonly LearnerAction[],

  /** The same opening, and a rescue that arrives late rather than never. */
  recovery: [
    OXYGEN_ALONE,
    HELP(900), SUPPORT(1000),
    RESPONSE(1100, 'hold-further-opioid'),
    RESPONSE(1200, 'record-naloxone-titration'),
    WEAN(2100),
  ] as readonly LearnerAction[],
} as const;

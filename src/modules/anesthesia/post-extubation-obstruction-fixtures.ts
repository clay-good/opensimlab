import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the post-extubation-obstruction lesson.
 *
 * The scripted pattern begins at tick 100. Help is wanted within 30 seconds, and
 * the combined maneuver -- jaw thrust with CPAP, held, WITH active breath
 * delivery at 95% oxygen or more -- within 45.
 *
 * The error path is the one the monitor rewards. It turns the oxygen to 100%
 * with active delivery and does nothing else: no help, no maneuver. Its
 * saturation reads 100% for the rest of the run, better than the 97% a run that
 * does nothing holds, while the modelled airway stays half closed, the tidal
 * volume stays at 250 mL, and the end-tidal carbon dioxide climbs to 55.
 *
 * The recovery path is that transcript with the help request and the maneuver
 * added late. Both timed objectives drop to partly met and the airway opens.
 */

const HELP = (tick: number): LearnerAction =>
  ({ tick, type: 'call-for-help', payload: { context: 'airway' } });
const OXYGEN = (tick: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 },
});
const MANEUVER = (tick: number): LearnerAction =>
  ({ tick, type: 'airway-maneuver', payload: { maneuver: 'jaw-thrust-cpap' } });

/** The oxygen turned up, and the airway left shut. */
const oxygenAlone: readonly LearnerAction[] = [OXYGEN(300)];

export const POST_EXTUBATION_OBSTRUCTION_FIXTURES = {
  scenarioId: 'post-extubation-obstruction', contentVersion: '0.1.0',
  seed: 4820, ticks: 3000,

  /** The pattern is never recognised and nothing is done. */
  noAction: [] as readonly LearnerAction[],

  /** Help at 10 seconds, delivery at 20, the held maneuver at 25. */
  expert: [HELP(200), OXYGEN(300), MANEUVER(350)] as readonly LearnerAction[],

  /** A saturation of 100% over an airway that is still half closed. */
  commonError: oxygenAlone,

  /** The same opening, with the missing half of the bundle added late. */
  recovery: [...oxygenAlone, HELP(700), MANEUVER(850)] as readonly LearnerAction[],
} as const;

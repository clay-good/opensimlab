import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the high-spinal lesson.
 *
 * The scripted event begins at tick 600. Help is wanted within 30 seconds,
 * breath delivery at 95% oxygen within 60, and a 250-500 mL crystalloid bolus
 * with a listed ephedrine dose within 60. The fourth objective is not a moment
 * but a constraint: the saturation must never fall below 92%.
 *
 * The error path is not neglect. It calls for help promptly, gives 500 mL of
 * crystalloid and 12 mg of ephedrine inside the window, and earns the
 * circulation objective outright -- and never starts breath delivery. Its
 * saturation reaches 0%. The treatment it performed correctly is scored met and
 * buys nothing; the one it omitted is the entire difference between the paths.
 *
 * The recovery path is that transcript with breath delivery added at tick 1,200,
 * exactly 60 seconds after the event and the last moment the second objective
 * accepts. All four are met and the lowest saturation is 93%.
 */

const HELP = (tick: number): LearnerAction =>
  ({ tick, type: 'call-for-help', payload: { context: 'high-spinal' } });
const BREATHE = (tick: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 },
});
const CRYSTALLOID = (tick: number): LearnerAction =>
  ({ tick, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 500 } });
const EPHEDRINE = (tick: number): LearnerAction =>
  ({ tick, type: 'ephedrine', payload: { doseMg: 12, route: 'iv' } });

/** Help and the whole circulation response, correctly dosed, and no breathing. */
const circulationOnly: readonly LearnerAction[] = [
  HELP(700), CRYSTALLOID(900), EPHEDRINE(1000),
];

export const HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP_FIXTURES = {
  scenarioId: 'high-spinal-after-epidural-top-up', contentVersion: '0.1.0',
  seed: 6041, ticks: 4000,

  /** Nothing is recognised and nothing is done. */
  noAction: [] as readonly LearnerAction[],

  /** Help at 10 seconds, breathing at 20, then the circulation response. */
  expert: [
    HELP(700), BREATHE(800), CRYSTALLOID(900), EPHEDRINE(1000),
  ] as readonly LearnerAction[],

  /** The circulation treated correctly and the breathing not at all. */
  commonError: circulationOnly,

  /** The same transcript, with breath delivery at the last accepted moment. */
  recovery: [...circulationOnly, BREATHE(1200)] as readonly LearnerAction[],
} as const;

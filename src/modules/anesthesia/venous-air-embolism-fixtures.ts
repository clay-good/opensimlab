import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the venous-air-embolism lesson.
 *
 * The scripted event begins at tick 600. Help and the bounded source-control
 * intent are wanted within 30 seconds, breath delivery at 100% oxygen within 60,
 * and the fourth objective reads the capnogram back to at least 28 mmHg after
 * source control has been accepted.
 *
 * The error path is the reflex: recognise the abrupt change, call for help
 * promptly, turn the oxygen to 100% with active delivery -- and never stop the
 * air entering. It earns the oxygenation objective and leaves the end-tidal
 * carbon dioxide at 17 mmHg and the mean arterial pressure at 53, which is where
 * a run that does nothing at all also ends up.
 *
 * The recovery path is that transcript with the source control added at tick
 * 1,400, well outside its own 30-second window. The objective it missed stays
 * missed, and the patient comes back anyway: 36 mmHg and 88.
 */

const HELP = (tick: number): LearnerAction =>
  ({ tick, type: 'call-for-help', payload: { context: 'venous-air-embolism' } });
const STOP_ENTRY = (tick: number): LearnerAction =>
  ({ tick, type: 'control-venous-air-entry', payload: { method: 'stop-entry' } });
const OXYGEN = (tick: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 },
});

/** Recognised, escalated, oxygenated -- and the air still going in. */
const everythingButTheSource: readonly LearnerAction[] = [HELP(700), OXYGEN(800)];

export const VENOUS_AIR_EMBOLISM_FIXTURES = {
  scenarioId: 'venous-air-embolism-during-line-removal', contentVersion: '0.1.0',
  seed: 7158, ticks: 4000,

  /** The abrupt change is never acted on. */
  noAction: [] as readonly LearnerAction[],

  /** Help at 10 seconds, source control at 15, oxygen at 20. */
  expert: [HELP(700), STOP_ENTRY(750), OXYGEN(800)] as readonly LearnerAction[],

  /** The oxygen turned up while the source stays open. */
  commonError: everythingButTheSource,

  /** The same transcript, with the source closed late rather than never. */
  recovery: [...everythingButTheSource, STOP_ENTRY(1400)] as readonly LearnerAction[],
} as const;

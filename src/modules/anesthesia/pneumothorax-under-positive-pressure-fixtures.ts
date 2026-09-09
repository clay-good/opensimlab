import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the pneumothorax-under-positive-pressure lesson.
 *
 * The scripted pleural event begins at tick 600 and the four timed objectives
 * measure delay from there: assessment and escalation within 30 seconds,
 * high-concentration oxygen and decompression within 60.
 *
 * The error path is the reflex this lesson exists to interrupt. It responds to a
 * falling saturation by turning the oxygen to 100% and the rate up to 20, and
 * does nothing else -- no assessment, no help, no decompression. It earns the
 * oxygenation objective and nothing else, and the pressure sits at 33 mmHg for
 * the rest of the run. More minute ventilation is not a treatment for a tension
 * pneumothorax; it is the thing that made one.
 *
 * The recovery path is that identical opening followed by the assessment, the
 * escalation and the decompression, all arriving late enough to land in the
 * partial band on the first two objectives and inside the window on the fourth.
 *
 * NOTE: no path here meets the fifth objective, and none can. The post-
 * decompression trajectory tops out at 64.71 mmHg against a declared endpoint of
 * 65. See pneumothorax-under-positive-pressure-completion.ts.
 */

const ASSESS = (tick: number): LearnerAction =>
  ({ tick, type: 'pneumothorax-response', payload: { action: 'assess-bilateral-ventilation' } });
const DECOMPRESS = (tick: number): LearnerAction =>
  ({ tick, type: 'pneumothorax-response', payload: { action: 'decompress-left-chest' } });
const HELP = (tick: number): LearnerAction =>
  ({ tick, type: 'call-for-help', payload: { context: 'tension-pneumothorax' } });
const OXYGEN = (tick: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 },
});
/** The reflex: more oxygen and more breaths, into a chest that cannot empty. */
const VENTILATE_HARDER: LearnerAction = ({
  tick: 700, type: 'ventilator',
  payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 20 },
});

export const PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_FIXTURES = {
  scenarioId: 'pneumothorax-under-positive-pressure', contentVersion: '0.1.0',
  seed: 5504, ticks: 4000,

  /** The pattern is never read and the chest is never decompressed. */
  noAction: [] as readonly LearnerAction[],

  /** Assess at 10 seconds, escalate at 15, oxygen at 20, decompress at 30. */
  expert: [
    ASSESS(700), HELP(750), OXYGEN(800), DECOMPRESS(900),
  ] as readonly LearnerAction[],

  /** More minute ventilation, and nothing that empties the chest. */
  commonError: [VENTILATE_HARDER] as readonly LearnerAction[],

  /** The same reflex, and then the right sequence arriving late. */
  recovery: [
    VENTILATE_HARDER, ASSESS(1000), HELP(1050), DECOMPRESS(1150),
  ] as readonly LearnerAction[],
} as const;

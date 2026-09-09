import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the arterial-transducer lesson.
 *
 * Both artifacts arrive at tick 600. The displayed mean arterial pressure drops
 * to 63 mmHg and the trace becomes over-damped. The patient's actual mean
 * arterial pressure is 78 mmHg, and stays 78 on every path in this file --
 * including the one where a litre of fluid is given for it.
 *
 * The error path treats the number. It gives 1,000 mL of balanced crystalloid to
 * a pressure that was never low, and only then cycles the cuff and levels the
 * transducer. The first objective drops to partly met -- not because the cuff
 * was late or wrong, but because a patient-changing action came first -- and the
 * cuff then reports the 78 mmHg that was true before the fluid was given.
 *
 * The recovery path keeps that litre and does the rest of the sequence properly,
 * including the waveform assessment the error path never makes.
 */

const LINE = (tick: number, action: string): LearnerAction =>
  ({ tick, type: 'arterial-line', payload: { action } });
const CRYSTALLOID = (tick: number): LearnerAction =>
  ({ tick, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 } });

/** A litre given to a displayed 63 that was really 78. */
const treatedTheDisplay: readonly LearnerAction[] = [CRYSTALLOID(700)];

export const ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT_FIXTURES = {
  scenarioId: 'arterial-pressure-transducer-artifact', contentVersion: '0.1.0',
  seed: 9310, ticks: 3600,

  /** The display is believed and nothing is checked. */
  noAction: [] as readonly LearnerAction[],

  /** Cuff at 10 seconds, level at 20, assess at 30, restore at 50. */
  expert: [
    LINE(700, 'cycle-cuff'), LINE(800, 'level-zero'),
    LINE(900, 'assess-waveform'), LINE(1100, 'restore-dynamic-response'),
  ] as readonly LearnerAction[],

  /** Fluid first, then the checks that would have made it unnecessary. */
  commonError: [
    ...treatedTheDisplay, LINE(1000, 'cycle-cuff'), LINE(1100, 'level-zero'),
  ] as readonly LearnerAction[],

  /** The same litre, and then the whole sequence including the waveform. */
  recovery: [
    ...treatedTheDisplay, LINE(1000, 'cycle-cuff'), LINE(1100, 'level-zero'),
    LINE(1200, 'assess-waveform'), LINE(1300, 'restore-dynamic-response'),
  ] as readonly LearnerAction[],
} as const;

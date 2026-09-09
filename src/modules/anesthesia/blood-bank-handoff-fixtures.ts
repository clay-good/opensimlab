import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the blood-bank-handoff lesson.
 *
 * Hemorrhage begins at tick 600. The bounded release is wanted within 60
 * seconds, red cells accepted after it, and the third objective reads the
 * hemoglobin, the calculated oxygen delivery and a final pressure of at least
 * 65 mmHg.
 *
 * The error path treats the number on the monitor. It gives two litres of
 * balanced crystalloid and never calls the blood bank, and it very nearly works:
 * the mean arterial pressure reaches 67 mmHg against the untreated run's 60 and
 * the transfused run's 68. What it costs is the hemoglobin, which falls from
 * 10.2 to 9.1 g/dL -- the pressure is bought by diluting the thing that carries
 * the oxygen.
 *
 * The recovery path keeps the first litre and then does it properly. It meets
 * the last two objectives, and the dilution is still there at the end: 10.9
 * g/dL against the expert path's 11.4, from the same two units.
 */

const CRYSTALLOID = (tick: number): LearnerAction =>
  ({ tick, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 } });
const RELEASE = (tick: number): LearnerAction =>
  ({ tick, type: 'blood-bank-request', payload: {} });
const RED_CELLS = (tick: number): LearnerAction =>
  ({ tick, type: 'blood-product', payload: { productId: 'packed-red-blood-cells', units: 2 } });

export const BLOOD_BANK_HANDOFF_FIXTURES = {
  scenarioId: 'blood-bank-handoff', contentVersion: '0.1.0',
  seed: 3874, ticks: 3600,

  /** The hemorrhage is never answered at all. */
  noAction: [] as readonly LearnerAction[],

  /** Release at 10 seconds, two units after it. */
  expert: [RELEASE(700), RED_CELLS(900)] as readonly LearnerAction[],

  /** Two litres of crystalloid and no call to the blood bank. */
  commonError: [CRYSTALLOID(700), CRYSTALLOID(1200)] as readonly LearnerAction[],

  /** The first litre, and then the handoff done properly. */
  recovery: [CRYSTALLOID(700), RELEASE(1400), RED_CELLS(1600)] as readonly LearnerAction[],
} as const;

import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the dilutional-coagulopathy lesson.
 *
 * The error and recovery paths open identically, and the opening is the point.
 * Both reach for plasma at tick 700 on the strength of the oozing and the volume
 * already lost — the instinct the lesson exists to argue against — and the
 * engine REFUSES it, because plasma is not available until a coagulation panel
 * has been reported. That refusal is not a scoring penalty; it is the mechanism.
 * What it costs is the seventy seconds that follow, and the first objective
 * gives sixty.
 *
 * So identify-dilutional-coagulopathy is partly met on both paths and stays
 * that way. They then differ in exactly one action: whether the panel is
 * repeated after the plasma. That single difference is the third objective.
 *
 * The expert path asks first and never has anything refused.
 */

const BLOOD_BANK = (tick: number): LearnerAction =>
  ({ tick, type: 'blood-bank-request', payload: {} });
const PANEL = (tick: number): LearnerAction =>
  ({ tick, type: 'coagulation-labs', payload: {} });
const PLASMA = (tick: number): LearnerAction =>
  ({ tick, type: 'blood-product', payload: { productId: 'fresh-frozen-plasma', units: 4 } });

/**
 * The instinct, refused, and the delay it buys. Shared so the two paths that
 * open with it cannot drift apart.
 */
const reachedForPlasmaFirst: readonly LearnerAction[] = [
  BLOOD_BANK(300),
  // Refused: the engine will not release plasma before a panel is reported.
  PLASMA(700),
  // Seventy seconds after the oozing cue, which the objective scores as late.
  PANEL(1300),
  PLASMA(1600),
];

export const DILUTIONAL_COAGULOPATHY_FIXTURES = {
  scenarioId: 'dilutional-coagulopathy', contentVersion: '0.1.0', seed: 4471, ticks: 3600,

  /** Nothing is done at all. The oozing is still reported at tick 600. */
  noAction: [] as readonly LearnerAction[],

  /** Ask, then treat, then ask again. Nothing is refused on this path. */
  expert: [
    BLOOD_BANK(300),
    PANEL(900),
    PLASMA(1200),
    PANEL(1700),
  ] as readonly LearnerAction[],

  /** The instinct, the refusal, the delay — and no repeat panel. */
  commonError: reachedForPlasmaFirst,

  /** The identical opening, and the one action that differs. */
  recovery: [...reachedForPlasmaFirst, PANEL(2000)] as readonly LearnerAction[],
} as const;

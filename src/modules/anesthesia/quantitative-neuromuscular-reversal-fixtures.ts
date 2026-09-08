import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the quantitative-reversal lesson.
 *
 * The counterfactual is the limb, and the trap is that the number does not say
 * which one you are on. Measured at this seed, after 0.6 mg/kg the post-tetanic
 * count reads 1 from tick 900 to about 1,400 while the block is still deepening,
 * falls to 0 through the middle of the case, and reads 1 again from tick 3,600
 * onward while it wears off. The two are indistinguishable on the monitor.
 *
 * So the error path reverses at tick 1,000 on a post-tetanic count of 1 — the
 * count the objective asks for, read on the wrong limb — and the engine refuses
 * it. The recovery path is that array plus exactly one more action: the same
 * dose again at tick 3,700, when the same count means the opposite thing. It
 * then scores identically to the expert path.
 *
 * What distinguishes the limbs is not on the screen at all. It is that the
 * rocuronium effect site has come back down past the plasma, which is the same
 * crossover the rapid-sequence lesson's worked example gates on.
 */

const ROCURONIUM: LearnerAction =
  { tick: 600, type: 'bolus', payload: { drugId: 'rocuronium', amount: 0.6, unit: 'mg/kg' } };
const SUGAMMADEX = (tick: number): LearnerAction => ({
  tick, type: 'neuromuscular-reversal',
  payload: { agent: 'sugammadex', route: 'iv', doseMgPerKg: 4 },
});

/** The count read on the way in, and the refusal it earns. */
const reversedOnTheWrongLimb: readonly LearnerAction[] = [ROCURONIUM, SUGAMMADEX(1000)];

export const QUANTITATIVE_REVERSAL_FIXTURES = {
  scenarioId: 'quantitative-neuromuscular-reversal', contentVersion: '0.1.0',
  seed: 4930, ticks: 7200,

  /** Nothing is done at all, so the declared practice course never starts. */
  noAction: [] as readonly LearnerAction[],

  /** A baseline ratio, the declared dose, and reversal on the receding limb. */
  expert: [ROCURONIUM, SUGAMMADEX(3700)] as readonly LearnerAction[],

  /** The same count, read two and a half minutes too early. */
  commonError: reversedOnTheWrongLimb,

  /** The identical attempt, and the one action that follows the refusal. */
  recovery: [...reversedOnTheWrongLimb, SUGAMMADEX(3700)] as readonly LearnerAction[],
} as const;

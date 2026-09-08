import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsQuantitativeNeuromuscularReversal } from '../quantitative-neuromuscular-reversal';

/**
 * What this worked example reads.
 *
 * The fourteenth observed-state demonstration in the anaesthesia module, and the
 * second to gate a reversal on the crossover of the two rocuronium curves rather
 * than on the post-tetanic count. That is not a stylistic choice: measured at
 * this scenario's seed, the count reads 1 while the block is still deepening and
 * 1 again while it wears off, so a beat gated on the count fires on the wrong
 * limb and the engine refuses it.
 *
 * During onset the plasma runs ahead of the effect site; during offset the
 * effect site is the higher of the two. The crossover IS the receding limb.
 */
export interface QuantitativeReversalProgress {
  readonly trainOfFourCount: number;
  readonly trainOfFourRatio: number;
  readonly postTetanicCount: number;
  readonly rocuroniumPlasma: number;
  /** Above the plasma only while the block is receding. That is the whole gate. */
  readonly rocuroniumEffectSite: number;
  readonly reversed: boolean;
  readonly depthIndex: number;
}

export const QUANTITATIVE_REVERSAL_DEMONSTRATION_VERSION = '0.1.0';

export function supportsQuantitativeReversalDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsQuantitativeNeuromuscularReversal(scenario);
}

export interface QuantitativeReversalDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the number that means two opposite things.
 *
 * Read from the latest stage backwards, as the thirteen before it are. The
 * ordering facts are the accepted rocuronium in the plasma and the accepted
 * reversal, both of which latch; nothing here is sequenced on the count or the
 * ratio, because both of those return to their starting values.
 *
 * It gives no real drug, paralyses nobody, and predicts no outcome for anyone.
 */
export function quantitativeReversalDemonstrationStep(
  patient?: QuantitativeReversalProgress,
): QuantitativeReversalDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  // No separate confirmation beat. Measured, the quantitative ratio reaches 0.9
  // on the tick after an accepted reversal, so such a beat is unreachable — the
  // same one this module cut from its rapid-sequence example. What it had to say,
  // that accepted is not the same claim as recovered, is in the closing instead.
  if (patient.reversed) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `Train-of-four ratio ${patient.trainOfFourRatio.toFixed(2)}, which is the number the last objective asks for and not the same claim as the reversal having been accepted — the clinical signs a generation was taught to trust do not distinguish 0.7 from 0.9, which is the entire reason this monitor is on the screen. Look back at what the post-tetanic count did in this run. It read 1 about five minutes ago, while the block was still deepening, and it reads 1 now while it wears off — the same number, meaning opposite things, and a reversal given on the first of those is refused. Nothing on the screen distinguishes them. What does is that the rocuronium effect site has come back down past the plasma, which is the hysteresis this module keeps returning to: the concentration that matters is not the one you gave, and it lags in both directions. This ends the example, not the evaluation.` };
  }
  if (patient.rocuroniumPlasma > 0) {
    if (patient.trainOfFourCount === 0 && patient.postTetanicCount >= 1
      && patient.rocuroniumEffectSite > patient.rocuroniumPlasma) {
      return { id: 'reverse', focus: 'actions', progress: 0.8,
        dispatch: { type: 'neuromuscular-reversal', payload: { agent: 'sugammadex', route: 'iv', doseMgPerKg: 4 } },
        narration: `No twitches and a post-tetanic count of ${patient.postTetanicCount}, and this time the effect site has come back down past the plasma. Sugammadex, 4 mg/kg — the branch for deep block with a post-tetanic count. Two mg/kg is the dose when there are twitches, and the model refuses the wrong pairing rather than pretending, so the choice between them is made on the monitor rather than on the clock.` };
    }
    if (patient.postTetanicCount >= 1) {
      return { id: 'not-yet', focus: 'monitor', progress: 0.55,
        narration: `Post-tetanic count ${patient.postTetanicCount}, and this is exactly the reading that will be right in a few minutes and is wrong now. The block is still deepening: the effect site is climbing towards a plasma that is already falling, and they have not crossed. A reversal given on this count alone is refused, and it is worth watching the refusal rather than trusting that the number means what it will mean later.` };
    }
    return { id: 'deep', focus: 'monitor', progress: 0.4,
      narration: 'No twitches and no post-tetanic count: the block is as deep as it gets in this model, and there is nothing to do about that except let it recede. Nothing here is timed. The surgeon closing sooner than expected is the reason this case is uncomfortable, and it does not change what the monitor has to show before a reversal is possible.' };
  }
  return { id: 'baseline', focus: 'actions', progress: 0.15,
    dispatch: { type: 'bolus', payload: { drugId: 'rocuronium', amount: 0.6, unit: 'mg/kg' } },
    narration: `Train-of-four ratio ${patient.trainOfFourRatio.toFixed(2)} before anything is given, and recording that is the first objective rather than a formality: without a baseline the numbers later have nothing to be compared against, and the monitor cannot tell a patient who has recovered from one who was never blocked. Rocuronium, 0.6 mg/kg — the only dose this lesson stocks, because everything it assesses is about the monitor rather than the syringe.` };
}

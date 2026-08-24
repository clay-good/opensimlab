/** Neuromuscular blockade derived from rocuronium effect-site concentration. */

import { clamp } from '@platform/kernel/numeric';
import { ROCURONIUM_TEACHING_PD } from '../pharmacology/models/rocuronium-clinical-course-teaching';

export interface NeuromuscularState {
  /** Depression of the first twitch, 0 (none) to 1 (complete). */
  readonly blockadeFraction: number;
  /** Quantitative fourth-to-first twitch ratio, 0 to 1. */
  readonly trainOfFourRatio: number;
  /** Number of visible twitches, 0 to 4. */
  readonly trainOfFourCount: number;
  /** Residual respiratory-muscle function, 0 to 1. */
  readonly respiratoryMuscleFraction: number;
  /** Bounded post-tetanic count teaching proxy, used only while TOF count is zero. */
  readonly postTetanicCount: number;
}

/**
 * A compact, monotone teaching mapping rather than a published population PD.
 *
 * Twitch count follows recovery of T1. Quantitative fade recovers later than
 * the fourth visible twitch, which is why a count of four is not equivalent to
 * a safe TOF ratio of 0.9.
 */
export function neuromuscularState(rocuroniumCeMgPerL: number): NeuromuscularState {
  // NaN means no usable concentration. Infinity is treated as the upper bound,
  // not as zero block, so hostile input cannot invert the drug's effect.
  const ce = Number.isNaN(rocuroniumCeMgPerL)
    ? 0 : clamp(rocuroniumCeMgPerL, 0, 1e6);
  const { ce50MgPerL, gamma } = ROCURONIUM_TEACHING_PD;
  const powered = ce ** gamma;
  const blockadeFraction = powered / (ce50MgPerL ** gamma + powered);
  const firstTwitchFraction = 1 - blockadeFraction;

  const trainOfFourCount = firstTwitchFraction < 0.05 ? 0
    : firstTwitchFraction < 0.10 ? 1
      : firstTwitchFraction < 0.15 ? 2
        : firstTwitchFraction < 0.25 ? 3 : 4;
  const trainOfFourRatio = trainOfFourCount < 4
    ? 0
    : clamp(((firstTwitchFraction - 0.25) / 0.75) ** 1.5, 0, 1);

  return {
    blockadeFraction,
    trainOfFourRatio,
    trainOfFourCount,
    // Respiratory muscles are more resistant than the adductor-pollicis
    // measurement site. This small offset avoids claiming identical sensitivity
    // while still making profound block abolish spontaneous ventilation.
    respiratoryMuscleFraction: clamp(1 - blockadeFraction / 0.95, 0, 1),
    postTetanicCount: trainOfFourCount > 0 ? 0
      : firstTwitchFraction < 0.005 ? 0
        : firstTwitchFraction < 0.02 ? 1
          : firstTwitchFraction < 0.035 ? 2 : 3,
  };
}

/** What touch or sight would report; deliberately less sensitive than the numeric ratio. */
export function qualitativeTwitchAssessment(trainOfFourCount: number, trainOfFourRatio: number) {
  if (trainOfFourCount < 4) return `${trainOfFourCount.toFixed(0)} visible twitches`;
  return trainOfFourRatio >= 0.4 ? 'no detectable fade' : 'fade detectable';
}

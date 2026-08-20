/**
 * Pulse oximetry plethysmogram synthesis
 * (engine/waveform-synthesis → Plethysmogram Follows Perfusion).
 *
 * Generated from stroke volume, vascular tone, and the same cardiac cycle that
 * drives the electrocardiogram and the arterial trace, so all three stay phase
 * coherent. Amplitude follows perfusion, so a vasoconstricted or low-output
 * patient produces a small, unreliable trace rather than a confident number.
 */

import { clamp } from '@platform/kernel/numeric';

/**
 * Delay from the R peak to the plethysmographic upstroke at a finger probe:
 * the arterial delay plus the longer peripheral transit. Declared so the
 * cross-correlation test has a value to assert against.
 */
export const PLETH_DELAY_SECONDS = 0.22;

/** Below this perfusion index the interface must declare low signal quality. */
export const LOW_SIGNAL_PERFUSION_INDEX = 0.35;

export interface PlethDrive {
  /** 0..1; scales the pulsatile amplitude. */
  perfusionIndex: number;
  heartRateBpm: number;
  respiratoryRateBpm: number;
  mechanicalPulse: boolean;
  /** True when the probe is displaced: the trace loses pulsatility entirely. */
  probeDisplaced: boolean;
}

/**
 * A normalized gamma-shaped pulse: zero at t = 0, peaking at exactly 1 at `peak`,
 * decaying thereafter. `order` controls how sharply it rises.
 */
function gamma(t: number, peak: number, order: number): number {
  if (!(t > 0)) return 0;
  const ratio = t / peak;
  // Beyond this the term is below 1e-6 of its peak, and evaluating it would
  // multiply an overflowing power by an underflowing exponential, giving NaN.
  if (ratio > 30) return 0;
  return Math.pow(ratio, order) * Math.exp(order * (1 - ratio));
}

export class PlethGenerator {
  private sinceUpstroke = Infinity;
  private elapsed = 0;
  private scheduled: number[] = [];
  private readonly sampleRateHz: number;

  constructor(sampleRateHz: number) {
    this.sampleRateHz = sampleRateHz;
  }

  schedulePulse(rWaveSeconds: number): void {
    this.scheduled.push(rWaveSeconds + PLETH_DELAY_SECONDS);
  }

  /** True when the trace is too small for the saturation reading to be trusted. */
  static isLowSignal(perfusionIndex: number): boolean {
    return perfusionIndex < LOW_SIGNAL_PERFUSION_INDEX;
  }

  advance(durationSeconds: number, drive: PlethDrive, out: Float32Array): number {
    const dt = 1 / this.sampleRateHz;
    const count = Math.round(durationSeconds * this.sampleRateHz);
    const respHz = Math.max(drive.respiratoryRateBpm, 1) / 60;
    const amplitude = clamp(drive.perfusionIndex, 0, 1);

    for (let i = 0; i < count; i += 1) {
      this.elapsed += dt;
      while (this.scheduled.length > 0 && (this.scheduled[0] ?? Infinity) <= this.elapsed) {
        this.scheduled.shift();
        if (drive.mechanicalPulse && !drive.probeDisplaced) this.sinceUpstroke = 0;
      }

      let value = 0;
      if (Number.isFinite(this.sinceUpstroke) && this.sinceUpstroke >= 0) {
        const tau = this.sinceUpstroke;
        // A rapid anacrotic upstroke followed by a dicrotic shoulder. Both terms
        // are gamma-shaped so the pulse starts from zero at its onset: a pulse
        // that stepped up discontinuously would be neither physiological nor
        // measurable by a foot-detection test.
        value = amplitude * (gamma(tau, 0.13, 2.5) + 0.30 * gamma(tau, 0.30, 7));
      }
      this.sinceUpstroke += dt;
      // Slow respiratory baseline modulation, present in every real plethysmogram.
      value += 0.03 * amplitude * Math.sin(2 * Math.PI * respHz * this.elapsed);
      out[i] = drive.probeDisplaced ? 0.02 * Math.sin(2 * Math.PI * 0.4 * this.elapsed) : value;
    }
    return count;
  }
}

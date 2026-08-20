/**
 * Capnogram synthesis with real phase structure
 * (engine/waveform-synthesis → Capnogram With Real Phase Structure).
 *
 * The four named phases are rendered explicitly:
 *   Phase I   inspiratory baseline
 *   Phase II  expiratory upstroke
 *   Phase III alveolar plateau
 *   Phase 0   inspiratory downstroke
 *
 * The alpha angle between phase II and phase III is the modulated parameter, not
 * an emergent accident: the generator takes alpha and derives the phase II and
 * phase III slopes from it, so a test can set an angle, render, measure it back,
 * and assert the round trip.
 *
 * The angle is only defined against a stated axis scaling, because an angle on a
 * plot depends on the aspect ratio. AXIS_MMHG_PER_SECOND declares it.
 */

import { clamp } from '@platform/kernel/numeric';

/** Declared plot aspect for the alpha angle: one second of time equals this many mmHg. */
export const AXIS_MMHG_PER_SECOND = 25;

/** Normal alpha angle in a healthy adult, degrees. */
export const NORMAL_ALPHA_DEGREES = 103;
/** Alpha angle at complete obstruction, degrees. The shark fin. */
export const SEVERE_OBSTRUCTION_ALPHA_DEGREES = 148;

/** Named capnogram patterns the library provides. */
export type CapnoPattern =
  | 'normal'
  | 'shark-fin'
  | 'curare-cleft'
  | 'rebreathing'
  | 'cardiogenic-oscillations'
  | 'esophageal-intubation'
  | 'disconnection';

export const CAPNO_PATTERNS: readonly CapnoPattern[] = [
  'normal',
  'shark-fin',
  'curare-cleft',
  'rebreathing',
  'cardiogenic-oscillations',
  'esophageal-intubation',
  'disconnection',
];

export interface AlphaSlopes {
  /** Phase II slope, mmHg per second. */
  readonly upstroke: number;
  /** Phase III slope, mmHg per second. */
  readonly plateau: number;
}

/**
 * Split an alpha angle into the two segment slopes that produce it.
 * The interior angle at the junction is alpha = 180 - (theta_II - theta_III),
 * where theta is each segment's inclination against the declared axis scaling.
 * The excess above 90 degrees is apportioned 60% to flattening the upstroke and
 * 40% to steepening the plateau, which is how obstruction actually deforms the trace.
 */
export function slopesForAlpha(alphaDegrees: number): AlphaSlopes {
  const alpha = clamp(alphaDegrees, 91, 175);
  const excess = alpha - 90;
  const thetaUpstroke = ((90 - 0.6 * excess) * Math.PI) / 180;
  const thetaPlateau = ((0.4 * excess) * Math.PI) / 180;
  return {
    upstroke: AXIS_MMHG_PER_SECOND * Math.tan(clamp(thetaUpstroke, 0.02, 1.55)),
    plateau: AXIS_MMHG_PER_SECOND * Math.tan(clamp(thetaPlateau, 0, 1.2)),
  };
}

/** Recover the alpha angle from two measured slopes, the inverse of `slopesForAlpha`. */
export function alphaFromSlopes(slopes: AlphaSlopes): number {
  const thetaUpstroke = Math.atan(slopes.upstroke / AXIS_MMHG_PER_SECOND);
  const thetaPlateau = Math.atan(slopes.plateau / AXIS_MMHG_PER_SECOND);
  return 180 - ((thetaUpstroke - thetaPlateau) * 180) / Math.PI;
}

/** Alpha angle for a given obstruction severity, 0 to 1. */
export function alphaForObstruction(severity: number): number {
  const s = clamp(severity, 0, 1);
  return NORMAL_ALPHA_DEGREES + s * (SEVERE_OBSTRUCTION_ALPHA_DEGREES - NORMAL_ALPHA_DEGREES);
}

export interface CapnoDrive {
  etco2MmHg: number;
  respiratoryRateBpm: number;
  /** 0 to 1 obstruction severity, which sets the alpha angle. */
  bronchospasmSeverity: number;
  /** False during apnea, disconnection, or a fully obstructed airway. */
  ventilating: boolean;
  /** 0 to 1: depth of the curare cleft from returning neuromuscular function. */
  curareCleftDepth: number;
  /** Inspired carbon dioxide from rebreathing, mmHg; raises the phase I baseline. */
  inspiredCo2MmHg: number;
  /** Heart rate, for cardiogenic oscillations in the late plateau. */
  heartRateBpm: number;
  /** When true, render the rapidly decaying trace of an esophageal intubation. */
  esophageal: boolean;
}

/** Inspiratory-to-expiratory ratio; expiration occupies this fraction of the cycle. */
const EXPIRATORY_FRACTION = 0.66;
/** Duration of the phase 0 inspiratory downstroke, as a fraction of the inspiratory time. */
const DOWNSTROKE_FRACTION = 0.2;

export class CapnoGenerator {
  private phaseSeconds = 0;
  private elapsed = 0;
  private breathIndex = 0;
  private esophagealDecay = 1;
  private readonly sampleRateHz: number;

  constructor(sampleRateHz: number) {
    this.sampleRateHz = sampleRateHz;
  }

  /** The alpha angle currently in force, so the interface and tests can read it. */
  alphaDegrees(drive: CapnoDrive): number {
    return alphaForObstruction(drive.bronchospasmSeverity);
  }

  advance(durationSeconds: number, drive: CapnoDrive, out: Float32Array): number {
    const dt = 1 / this.sampleRateHz;
    const count = Math.round(durationSeconds * this.sampleRateHz);
    const cycle = 60 / Math.max(drive.respiratoryRateBpm, 1);
    const expiratoryTime = cycle * EXPIRATORY_FRACTION;
    const inspiratoryTime = cycle - expiratoryTime;
    const slopes = slopesForAlpha(this.alphaDegrees(drive));
    const baseline = Math.max(drive.inspiredCo2MmHg, 0);

    for (let i = 0; i < count; i += 1) {
      this.elapsed += dt;
      if (!drive.ventilating) {
        // Disconnection or apnea: the waveform is lost entirely, which is the signal.
        out[i] = 0;
        this.phaseSeconds = 0;
        continue;
      }
      this.phaseSeconds += dt;
      if (this.phaseSeconds >= cycle) {
        this.phaseSeconds -= cycle;
        this.breathIndex += 1;
        if (drive.esophageal) this.esophagealDecay *= 0.55;
      }

      // The end-tidal value is the value reached at the END of phase III, so the
      // plateau is drawn backwards from it and the shape can change while the
      // end-tidal number stays inside its alarm limits.
      const peak = drive.esophageal ? drive.etco2MmHg * 0.35 * this.esophagealDecay : drive.etco2MmHg;
      const plateauStart = Math.max(peak - slopes.plateau * (expiratoryTime * 0.62), baseline);
      const upstrokeTime = clamp((plateauStart - baseline) / Math.max(slopes.upstroke, 1e-6), 0.01, expiratoryTime * 0.9);

      let value: number;
      const t = this.phaseSeconds;
      if (t < expiratoryTime) {
        if (t < upstrokeTime) {
          // Phase II: the expiratory upstroke, a straight segment of the derived slope.
          value = baseline + slopes.upstroke * t;
        } else {
          // Phase III: the alveolar plateau, rising at the derived slope to the end-tidal value.
          const intoPlateau = t - upstrokeTime;
          const plateauSpan = Math.max(expiratoryTime - upstrokeTime, 1e-6);
          value = plateauStart + (peak - plateauStart) * (intoPlateau / plateauSpan);
          const plateauFraction = intoPlateau / plateauSpan;
          // Curare cleft: returning neuromuscular function notches the plateau.
          if (drive.curareCleftDepth > 0) {
            const centered = plateauFraction - 0.55;
            value -= peak * 0.35 * drive.curareCleftDepth * Math.exp(-(centered * centered) / (2 * 0.06 * 0.06));
          }
          // Cardiogenic oscillations: small ripples at the heart rate late in the plateau,
          // visible only when the plateau is otherwise flat.
          if (plateauFraction > 0.6 && drive.bronchospasmSeverity < 0.2) {
            const hz = Math.max(drive.heartRateBpm, 20) / 60;
            value += 0.5 * Math.sin(2 * Math.PI * hz * this.elapsed);
          }
        }
      } else {
        // Phase 0: the inspiratory downstroke, then phase I: the inspiratory baseline.
        const intoInspiration = t - expiratoryTime;
        const downstroke = inspiratoryTime * DOWNSTROKE_FRACTION;
        value = intoInspiration < downstroke
          ? peak - (peak - baseline) * (intoInspiration / Math.max(downstroke, 1e-6))
          : baseline;
      }
      out[i] = Math.max(value, 0);
    }
    return count;
  }
}

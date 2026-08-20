/**
 * Arterial pressure waveform synthesis
 * (engine/waveform-synthesis → Arterial Pressure Waveform).
 *
 * The shape is not drawn; it is produced by a two-element Windkessel driven by a
 * stroke-volume ejection pulse, so systemic vascular resistance genuinely changes
 * the upstroke-to-runoff relationship rather than merely relabeling a picture:
 *
 *   dP/dt = Q(t)/C - P/(R*C)
 *
 * with Q(t) a half-sine ejection flow whose integral is the stroke volume, R the
 * systemic vascular resistance and C the arterial compliance. Valve closure adds
 * a damped reflection, which is the dicrotic notch.
 *
 * The Windkessel gives the SHAPE. The systolic and diastolic values come from the
 * state vector, and the shape is affinely mapped onto them so the displayed
 * numbers always agree with the physiology layer while the morphology still
 * carries the vascular information a learner can read. The bounds of that mapping
 * are computed by running the same equations to periodic steady state rather than
 * by tracking a running envelope, because a running envelope clips the peak into
 * a flat top.
 */

import { clamp } from '@platform/kernel/numeric';

/** Reference systemic vascular resistance in dyn*s*cm^-5, used to normalize shape terms. */
export const REFERENCE_SVR = 1200;

/**
 * Arterial compliance in mL/mmHg, a lumped adult value. With a resting resistance
 * near 0.9 mmHg/(mL/s) this gives a diastolic decay time constant of about 1.5 s,
 * which is the value the arterial runoff is described by.
 */
const COMPLIANCE_ML_PER_MMHG = 1.7;

/**
 * Divisor converting dyn*s*cm^-5 to mmHg per (mL/s).
 * SVR = 80 * MAP / CO(L/min), and the Windkessel wants mmHg per (mL/s), so
 * R = SVR / (80 * 1000/60) = SVR / 1333.33.
 */
export const SVR_TO_MMHG_PER_ML_PER_S = (80 * 1000) / 60;

/**
 * Electromechanical delay from the R peak to the arterial upstroke at a radial
 * site: the pre-ejection period plus pulse transit time. Declared so the
 * cross-correlation test has a value to assert against.
 */
export const ARTERIAL_DELAY_SECONDS = 0.14;

export interface ArterialDrive {
  systolicMmHg: number;
  diastolicMmHg: number;
  svrDynSCm5: number;
  strokeVolumeMl: number;
  heartRateBpm: number;
  respiratoryRateBpm: number;
  hypovolemiaFraction: number;
  positivePressure: boolean;
  /** 0 = crisp trace, 1 = fully damped catheter. A rendering state, never a pressure change. */
  dampingFraction: number;
  /** False during pulseless electrical activity, ventricular fibrillation, or asystole. */
  mechanicalPulse: boolean;
}

/** Ejection duration in seconds, shortening with rate and lengthening with high afterload. */
export function ejectionTimeSeconds(heartRateBpm: number, svrDynSCm5: number): number {
  const rr = 60 / Math.max(heartRateBpm, 20);
  const svrRatio = clamp(svrDynSCm5 / REFERENCE_SVR, 0.4, 2.2);
  // Base ejection time follows the square root of RR, as systolic time intervals do.
  const base = 0.30 * Math.sqrt(rr);
  // Vasodilation shortens ejection and moves the dicrotic notch earlier and lower.
  return clamp(base * (0.86 + 0.14 * svrRatio), 0.12, 0.42);
}

/** Ejection flow in mL/s at `phase` seconds after the upstroke. */
function ejectionFlow(phase: number, strokeVolumeMl: number, ejectionSeconds: number): number {
  if (phase < 0 || phase >= ejectionSeconds) return 0;
  const peak = (Math.PI * strokeVolumeMl) / (2 * ejectionSeconds);
  return peak * Math.sin((Math.PI * phase) / ejectionSeconds);
}

/**
 * The dicrotic notch: a damped reflection released at aortic valve closure.
 * Its depth grows with vascular resistance, so a vasodilated trace loses it.
 */
function notch(phase: number, ejectionSeconds: number, svrDynSCm5: number): number {
  const since = phase - ejectionSeconds;
  if (since < 0 || since >= 0.18) return 0;
  const svrRatio = clamp(svrDynSCm5 / REFERENCE_SVR, 0.3, 2.0);
  return -6 * svrRatio * Math.exp(-since / 0.045) * Math.cos(2 * Math.PI * 9 * since);
}

/** The min and max of the Windkessel shape in periodic steady state. */
export interface ShapeEnvelope {
  readonly min: number;
  readonly max: number;
}

/**
 * Run the same equations to periodic steady state and report the resulting
 * envelope. Six beats at 500 Hz is well past convergence for a time constant
 * near 1.5 s, and costs a few hundred floating point operations per parameter
 * change, so the result is cached.
 */
export function steadyStateEnvelope(
  strokeVolumeMl: number,
  heartRateBpm: number,
  svrDynSCm5: number,
): ShapeEnvelope {
  const rr = 60 / Math.max(heartRateBpm, 20);
  const ejection = ejectionTimeSeconds(heartRateBpm, svrDynSCm5);
  const resistance = Math.max(svrDynSCm5, 200) / SVR_TO_MMHG_PER_ML_PER_S;
  const dt = 1 / 500;
  let pressure = 80;
  let min = Infinity;
  let max = -Infinity;
  const beats = 6;
  for (let beat = 0; beat < beats; beat += 1) {
    for (let phase = 0; phase < rr; phase += dt) {
      const flow = ejectionFlow(phase, strokeVolumeMl, ejection);
      pressure += dt * (flow / COMPLIANCE_ML_PER_MMHG - pressure / (resistance * COMPLIANCE_ML_PER_MMHG));
      if (beat === beats - 1) {
        const shape = pressure + notch(phase, ejection, svrDynSCm5);
        if (shape < min) min = shape;
        if (shape > max) max = shape;
      }
    }
  }
  // Guard against a degenerate span, which would divide by zero downstream.
  if (!Number.isFinite(min) || !Number.isFinite(max) || max - min < 1e-6) {
    return { min: pressure - 1, max: pressure + 1 };
  }
  return { min, max };
}

export class ArterialGenerator {
  private windkessel = 78;
  private sinceUpstroke = Infinity;
  private elapsed = 0;
  private damped = 0;
  private readonly sampleRateHz: number;
  /** Pulse onsets that have been scheduled but not yet reached. */
  private scheduled: number[] = [];
  private cacheKey = '';
  private cachedEnvelope: ShapeEnvelope = { min: 66, max: 108 };

  constructor(sampleRateHz: number) {
    this.sampleRateHz = sampleRateHz;
  }

  /** Schedule an arterial upstroke for an R peak at `rWaveSeconds`. */
  schedulePulse(rWaveSeconds: number): void {
    this.scheduled.push(rWaveSeconds + ARTERIAL_DELAY_SECONDS);
  }

  private envelope(drive: ArterialDrive): ShapeEnvelope {
    const key = `${drive.strokeVolumeMl.toFixed(1)}|${drive.heartRateBpm.toFixed(1)}|${drive.svrDynSCm5.toFixed(0)}`;
    if (key !== this.cacheKey) {
      this.cacheKey = key;
      // The minimum is taken at a slightly slower rate than nominal, because
      // respiratory sinus arrhythmia lengthens some beats and a beat longer than
      // nominal runs off below the nominal minimum. Without this the mapping
      // would clamp and render a flat diastolic segment.
      const nominal = steadyStateEnvelope(drive.strokeVolumeMl, drive.heartRateBpm, drive.svrDynSCm5);
      const slow = steadyStateEnvelope(drive.strokeVolumeMl, drive.heartRateBpm * 0.85, drive.svrDynSCm5);
      this.cachedEnvelope = { min: Math.min(nominal.min, slow.min), max: nominal.max };
    }
    return this.cachedEnvelope;
  }

  advance(durationSeconds: number, drive: ArterialDrive, out: Float32Array): number {
    const dt = 1 / this.sampleRateHz;
    const count = Math.round(durationSeconds * this.sampleRateHz);
    const ejection = ejectionTimeSeconds(drive.heartRateBpm, drive.svrDynSCm5);
    const resistance = Math.max(drive.svrDynSCm5, 200) / SVR_TO_MMHG_PER_ML_PER_S;
    const respHz = Math.max(drive.respiratoryRateBpm, 1) / 60;
    const { min, max } = this.envelope(drive);
    const span = Math.max(max - min, 1e-6);
    const mean = (drive.systolicMmHg + 2 * drive.diastolicMmHg) / 3;

    for (let i = 0; i < count; i += 1) {
      this.elapsed += dt;
      while (this.scheduled.length > 0 && (this.scheduled[0] ?? Infinity) <= this.elapsed) {
        this.scheduled.shift();
        if (drive.mechanicalPulse) this.sinceUpstroke = 0;
      }

      const flow = ejectionFlow(this.sinceUpstroke, drive.strokeVolumeMl, ejection);
      this.windkessel += dt * (flow / COMPLIANCE_ML_PER_MMHG - this.windkessel / (resistance * COMPLIANCE_ML_PER_MMHG));
      const shape = this.windkessel + notch(this.sinceUpstroke, ejection, drive.svrDynSCm5);
      this.sinceUpstroke += dt;

      const normalized = clamp((shape - min) / span, 0, 1);

      // Systolic pressure variation with the ventilator, scaled by the volume
      // deficit, so pulse pressure variation is computable from the rendered trace.
      const swing = drive.positivePressure
        ? 1 + 0.28 * drive.hypovolemiaFraction * Math.sin(2 * Math.PI * respHz * this.elapsed)
        : 1;

      let value = drive.mechanicalPulse
        ? drive.diastolicMmHg + normalized * (drive.systolicMmHg - drive.diastolicMmHg) * swing
        : mean;

      // Damping is a rendering state: it removes the notch and the high-frequency
      // content and narrows the displayed pressure toward the mean. The state
      // vector is untouched.
      if (drive.dampingFraction > 0) {
        const target = mean + (value - mean) * (1 - 0.75 * drive.dampingFraction);
        const tau = 0.02 + 0.22 * drive.dampingFraction;
        this.damped += (target - this.damped) * (1 - Math.exp(-dt / tau));
        value = this.damped;
      } else {
        this.damped = value;
      }

      out[i] = value;
    }
    return count;
  }
}

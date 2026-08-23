/**
 * Electrocardiogram synthesis by the dynamical model of
 * McSharry, Clifford, Tarassenko and Smith, "A dynamical model for generating
 * synthetic electrocardiogram signals", IEEE Trans Biomed Eng 2003;50:289-94
 * (PMID 12669985).
 *
 * PROVENANCE. This file was written from the equations and the parameter table
 * printed in that paper. No code was read from, copied from, or adapted from the
 * PhysioNet ECGSYN reference implementation or any other GPL-licensed source, so
 * this project's permissive license stays clean.
 * See `docs/licensing/waveform-provenance.md`.
 *
 * The model. A trajectory moves around a unit limit cycle in the (x, y) plane and
 * is displaced in z by five Gaussian terms placed at the P, Q, R, S and T events:
 *
 *   dx/dt = alpha*x - omega*y
 *   dy/dt = alpha*y + omega*x
 *   dz/dt = -SUM_i a_i * dtheta_i * exp(-dtheta_i^2 / (2*b_i^2)) - (z - z0)
 *
 * with alpha = 1 - sqrt(x^2 + y^2), theta = atan2(y, x),
 * dtheta_i = wrap(theta - theta_i), and omega = 2*pi / RR.
 * z0 is a slow respiratory baseline wander.
 *
 * A rhythm is therefore a parameter set rather than a hand-drawn picture, which
 * is the property engine/waveform-synthesis requires.
 */

import { rk4, wrapAngle } from '@platform/kernel/numeric';
import type { Rng } from '@platform/kernel/rng';
import type { RhythmId } from './types';

/** One Gaussian event on the limit cycle. */
export interface EcgEvent {
  /** Event name, for tests and for the text description of morphology. */
  readonly name: 'P' | 'Q' | 'R' | 'S' | 'T';
  /** Angular position on the limit cycle, in radians, at the reference rate of 60 bpm. */
  readonly theta: number;
  /** Amplitude coefficient, in the paper's arbitrary units. */
  readonly a: number;
  /** Angular width, in radians, at the reference rate of 60 bpm. */
  readonly b: number;
  /**
   * How this event's TIME offset from the R peak scales with the RR interval:
   * offset proportional to RR^rateExponent.
   *
   * This exponent is Open Sim Lab's own encoding of a published relationship,
   * not a value from the McSharry table. The paper notes that the whole complex
   * must not simply scale with rate. We encode the two rules a clinician expects:
   *   - Q, R and S event offsets and widths are rate independent -> exponent 0
   *   - QT scales with the square root of RR (Bazett)  -> exponent 0.5
   * Because time offset = theta * RR / (2*pi), an event whose time offset must
   * scale as RR^e needs theta scaled by RR^(e-1); the same factor applies to its
   * angular width so its rendered duration scales the same way.
   */
  readonly rateExponent: number;
}

/**
 * Table 1 of McSharry et al. 2003: the parameters of the five Gaussian terms.
 * theta is given in the paper in radians as fractions of pi.
 */
export const MCSHARRY_TABLE_1: readonly EcgEvent[] = Object.freeze([
  { name: 'P', theta: -Math.PI / 3, a: 1.2, b: 0.25, rateExponent: 0.5 },
  { name: 'Q', theta: -Math.PI / 12, a: -5.0, b: 0.1, rateExponent: 0 },
  { name: 'R', theta: 0, a: 30.0, b: 0.1, rateExponent: 0 },
  { name: 'S', theta: Math.PI / 12, a: -7.5, b: 0.1, rateExponent: 0 },
  { name: 'T', theta: (Math.PI * 1) / 2, a: 0.75, b: 0.4, rateExponent: 0.5 },
]);

/**
 * Reference angular velocity, one revolution per second, i.e. 60 beats per minute.
 * The paper's figures are drawn at that rate.
 */
const OMEGA_REFERENCE = 2 * Math.PI;

/**
 * Amplitude normalization, PER EVENT.
 *
 * Integrating the z equation shows a Gaussian term of amplitude `a` and width `b`
 * contributes a deflection of `a·b²/omega`. Two things vary with heart rate: omega
 * itself, and `b`, which `scaleEventsForRate` rescales so each event keeps its
 * duration in seconds. Correcting only for omega therefore leaves the b² factor
 * uncorrected, and since the QRS events scale as b ∝ 1/RR, their rendered
 * amplitude grew with the SQUARE of heart rate — an R wave of 1.1 mV at 60 bpm
 * became 5 mV at 130 and 9.8 mV at 180. R-wave voltage is not rate-dependent, and
 * a QRS that quadruples when a patient goes tachycardic teaches a wrong mental
 * model of what the trace is showing.
 *
 * The gain is therefore `(omega/omega_ref)·(b_ref/b_scaled)²`, applied per event,
 * which holds every deflection at its published amplitude at every rate.
 *
 * This normalization is Open Sim Lab's, not the paper's, and is recorded in
 * `docs/licensing/waveform-provenance.md`.
 */
const NORMALIZE_AMPLITUDE_TO_RATE = true;

/**
 * Scale from the paper's z units to millivolts. At the reference rate the R term
 * contributes a*b^2/omega_ref = 30 * 0.01 / (2*pi) z units, so this factor places
 * the R peak of lead II at approximately 1.2 mV.
 */
export const MV_PER_Z_UNIT = 25.0;

/** Respiratory baseline wander, paper section II: amplitude 0.15 mV at the respiratory frequency. */
const BASELINE_WANDER_MV = 0.15;

/** Reference RR interval, in seconds, at which the table's theta and b values apply. */
const REFERENCE_RR_S = 1.0;

/** A complete beat morphology: the five events plus whether the beat ejects blood. */
export interface BeatMorphology {
  readonly events: readonly EcgEvent[];
  /** False for a rhythm whose electrical activity produces no mechanical pulse. */
  readonly mechanicalPulse: boolean;
  /**
   * When set, the atria depolarize independently of the ventricles at this rate,
   * so the P waves march through the complexes rather than preceding them. This
   * is the defining feature of complete heart block, and it is rendered as an
   * independent Gaussian train in time rather than as a limit-cycle event.
   */
  readonly atrialRateBpm?: number;
  /** When true, a narrow pacing artifact precedes each ventricular complex. */
  readonly pacingSpike?: boolean;
}

/** Rescale the table for a given RR interval, per each event's rate exponent. */
export function scaleEventsForRate(events: readonly EcgEvent[], rrSeconds: number): EcgEvent[] {
  const rr = Math.max(rrSeconds, 0.15);
  return events.map((event) => {
    const factor = Math.pow(rr / REFERENCE_RR_S, event.rateExponent - 1);
    return { ...event, theta: event.theta * factor, b: event.b * factor };
  });
}

/**
 * The per-event gain that holds a deflection at its published amplitude.
 *
 * `scaled` must be the event as returned by `scaleEventsForRate`, and `reference`
 * the same event from the unscaled table.
 */
export function amplitudeGain(reference: EcgEvent, scaled: EcgEvent, omega: number): number {
  const widthRatio = reference.b / scaled.b;
  return (omega / OMEGA_REFERENCE) * widthRatio * widthRatio;
}

/** Time in seconds from the R peak to an event, at a given RR interval. */
export function eventTimeOffsetSeconds(event: EcgEvent, rrSeconds: number): number {
  const scaled = scaleEventsForRate([event], rrSeconds)[0];
  if (!scaled) return 0;
  return (scaled.theta / (2 * Math.PI)) * rrSeconds;
}

/**
 * QT interval in seconds at a given RR, measured from the start of Q to the end of T,
 * taking the Gaussian edges at two standard deviations.
 */
export function qtIntervalSeconds(morphology: BeatMorphology, rrSeconds: number): number {
  const scaled = scaleEventsForRate(morphology.events, rrSeconds);
  const q = scaled.find((e) => e.name === 'Q');
  const t = scaled.find((e) => e.name === 'T');
  if (!q || !t) return 0;
  const toSeconds = (theta: number) => (theta / (2 * Math.PI)) * rrSeconds;
  return toSeconds(t.theta + 2 * t.b) - toSeconds(q.theta - 2 * q.b);
}

/** Options for a generator instance. */
export interface EcgGeneratorOptions {
  readonly sampleRateHz: number;
  readonly rng: Rng;
}

/** What the generator needs to know about the patient each tick. */
export interface EcgDrive {
  readonly heartRateBpm: number;
  readonly rhythmId: RhythmId;
  readonly respiratoryRateBpm: number;
  /** 0..1. Attenuates respiratory sinus arrhythmia, because anesthesia blunts it. */
  readonly anesthesiaDepthFraction: number;
}

/** A detected R peak, published so the mechanical waveforms can lock to it. */
export interface RWaveEvent {
  /** Simulated seconds at which the R peak occurred. */
  readonly atSeconds: number;
  /** The RR interval of the beat that just started, in seconds. */
  readonly rrSeconds: number;
  /** Whether this beat produces a mechanical pulse. */
  readonly mechanicalPulse: boolean;
}

/**
 * Baseline respiratory sinus arrhythmia amplitude in an awake adult, as a
 * fraction of the mean RR interval. Beat-to-beat interval must vary with a
 * respiratory component or the trace reads as fake
 * (engine/waveform-synthesis → Heart rate variability is present and physiological).
 */
const RSA_AWAKE_FRACTION = 0.06;
/** Mayer-wave (roughly 0.1 Hz) component, the second mode of the published bimodal tachogram. */
const MAYER_FRACTION = 0.02;
const MAYER_HZ = 0.1;
/** Unstructured beat-to-beat jitter, seeded. */
const JITTER_FRACTION = 0.01;

/**
 * The electrocardiogram generator.
 *
 * It integrates the three coupled equations at the signal's sample rate with
 * fourth-order Runge-Kutta, and publishes the R peaks it produces so the
 * arterial and plethysmographic generators stay phase coherent with it.
 */
export class EcgGenerator {
  private x = 1;
  private y = 0;
  private z = 0;
  private elapsed = 0;
  /** Angle at the previous sample, used to detect the wrap that starts a new beat. */
  private previousTheta = 0;
  private currentRr = 1;
  private morphology: BeatMorphology;
  private currentEvents: EcgEvent[];
  private beatPhaseSeconds = 0;
  private readonly rng: Rng;
  private readonly sampleRateHz: number;
  private pendingRWaves: RWaveEvent[] = [];
  private rhythmId: RhythmId = 'sinus';
  private fibrillationPhase = 0;
  private atrialPhaseSeconds = 0;
  private spikeSamplesRemaining = 0;

  constructor(options: EcgGeneratorOptions, morphology: BeatMorphology) {
    this.sampleRateHz = options.sampleRateHz;
    this.rng = options.rng;
    this.morphology = morphology;
    this.currentEvents = scaleEventsForRate(morphology.events, this.currentRr);
    // Start the trajectory just after the T wave so the first rendered beat is complete.
    this.previousTheta = -Math.PI;
    this.x = Math.cos(-Math.PI);
    this.y = Math.sin(-Math.PI);
  }

  /** Replace the beat morphology. Applied from the next beat boundary, never mid-complex. */
  setMorphology(morphology: BeatMorphology, rhythmId: RhythmId): void {
    this.morphology = morphology;
    this.rhythmId = rhythmId;
  }

  /** The R peaks produced since the last call, then cleared. */
  drainRWaves(): RWaveEvent[] {
    const drained = this.pendingRWaves;
    this.pendingRWaves = [];
    return drained;
  }

  /** The RR interval currently in force, in seconds. */
  get rrSeconds(): number {
    return this.currentRr;
  }

  /**
   * The RR interval for the next beat, including respiratory sinus arrhythmia,
   * a Mayer-wave component, and seeded jitter. Atrial fibrillation replaces the
   * structured modulation with a wide irregular draw so the intervals show no
   * repeating pattern.
   */
  private nextRrSeconds(drive: EcgDrive): number {
    const meanRr = 60 / Math.max(drive.heartRateBpm, 10);
    if (this.rhythmId === 'atrial-fibrillation') {
      // Irregularly irregular: a lognormal-ish spread around the mean with no periodic term.
      const spread = Math.exp(this.rng.normal() * 0.18);
      return Math.min(Math.max(meanRr * spread, meanRr * 0.5), meanRr * 1.9);
    }
    if (this.rhythmId === 'ventricular-tachycardia' || this.rhythmId === 'svt') {
      return meanRr * (1 + this.rng.normal() * 0.005);
    }
    const respHz = Math.max(drive.respiratoryRateBpm, 1) / 60;
    // General anesthesia blunts respiratory sinus arrhythmia; at full depth almost none remains.
    const rsaGain = RSA_AWAKE_FRACTION * (1 - 0.85 * drive.anesthesiaDepthFraction);
    const rsa = rsaGain * Math.sin(2 * Math.PI * respHz * this.elapsed);
    const mayer = MAYER_FRACTION * (1 - 0.6 * drive.anesthesiaDepthFraction)
      * Math.sin(2 * Math.PI * MAYER_HZ * this.elapsed);
    const jitter = JITTER_FRACTION * this.rng.normal() * (1 - 0.5 * drive.anesthesiaDepthFraction);
    return Math.max(meanRr * (1 + rsa + mayer + jitter), 0.2);
  }

  private derivative(events: readonly EcgEvent[], omega: number, z0: number) {
    // The gain is per event, because each event's width scales differently with
    // rate. Precomputed once per step rather than inside the integrator.
    const gains = events.map((event) => (
      NORMALIZE_AMPLITUDE_TO_RATE
        ? amplitudeGain(this.referenceFor(event), event, omega)
        : 1
    ));
    return (_t: number, state: readonly number[]): number[] => {
      const x = state[0] ?? 0;
      const y = state[1] ?? 0;
      const z = state[2] ?? 0;
      const alpha = 1 - Math.sqrt(x * x + y * y);
      const theta = Math.atan2(y, x);
      let dz = -(z - z0);
      for (let i = 0; i < events.length; i += 1) {
        const event = events[i] as EcgEvent;
        const dTheta = wrapAngle(theta - event.theta);
        dz -= (gains[i] as number) * event.a * dTheta
          * Math.exp(-(dTheta * dTheta) / (2 * event.b * event.b));
      }
      return [alpha * x - omega * y, alpha * y + omega * x, dz];
    };
  }

  /** The unscaled table entry an event came from, matched by name. */
  private referenceFor(event: EcgEvent): EcgEvent {
    return this.morphology.events.find((candidate) => candidate.name === event.name) ?? event;
  }

  /**
   * Advance by `durationSeconds` and write the samples into `out`.
   * Returns the number of samples written.
   */
  advance(durationSeconds: number, drive: EcgDrive, out: Float32Array): number {
    const dt = 1 / this.sampleRateHz;
    const count = Math.round(durationSeconds * this.sampleRateHz);
    const respHz = Math.max(drive.respiratoryRateBpm, 1) / 60;

    for (let i = 0; i < count; i += 1) {
      // Asystole and fibrillation are not limit-cycle beats; they are handled directly.
      if (this.rhythmId === 'asystole') {
        out[i] = this.rng.normal() * 0.01;
        this.elapsed += dt;
        continue;
      }
      if (this.rhythmId === 'ventricular-fibrillation') {
        // A coarse, disorganized 4-7 Hz oscillation with a wandering amplitude and phase.
        this.fibrillationPhase += 2 * Math.PI * (4.5 + 1.2 * Math.sin(this.elapsed * 0.7)) * dt;
        const amplitude = 0.35 + 0.15 * Math.sin(this.elapsed * 1.9);
        out[i] = amplitude * Math.sin(this.fibrillationPhase) + this.rng.normal() * 0.03;
        this.elapsed += dt;
        continue;
      }

      const omega = (2 * Math.PI) / this.currentRr;
      const z0 = BASELINE_WANDER_MV * Math.sin(2 * Math.PI * respHz * this.elapsed) / MV_PER_Z_UNIT;
      const next = rk4([this.x, this.y, this.z], this.elapsed, dt, this.derivative(this.currentEvents, omega, z0));
      this.x = next[0] ?? this.x;
      this.y = next[1] ?? this.y;
      this.z = next[2] ?? this.z;
      this.elapsed += dt;
      this.beatPhaseSeconds += dt;

      const theta = Math.atan2(this.y, this.x);
      // The R peak sits at theta = 0; the trajectory crosses it going positive.
      // The R peak sits at theta = 0. It is also the beat boundary: an RR interval
      // is defined R to R, so choosing the next interval here means the interval a
      // test measures between two R peaks is exactly the interval the model chose,
      // with no smoothing across two beats.
      if (this.previousTheta < 0 && theta >= 0 && this.beatPhaseSeconds > this.currentRr * 0.3) {
        this.pendingRWaves.push({
          atSeconds: this.elapsed,
          rrSeconds: this.currentRr,
          mechanicalPulse: this.morphology.mechanicalPulse,
        });
        // A rhythm or rate change takes effect here, at a beat boundary, so the
        // transition never produces a discontinuity in the middle of a complex.
        this.currentRr = this.nextRrSeconds(drive);
        this.currentEvents = scaleEventsForRate(this.morphology.events, this.currentRr);
        this.beatPhaseSeconds = 0;
      }
      let value = this.z * MV_PER_Z_UNIT;

      // Dissociated atrial activity: a Gaussian P train on its own clock.
      const atrialRate = this.morphology.atrialRateBpm;
      if (atrialRate !== undefined) {
        const atrialPeriod = 60 / atrialRate;
        this.atrialPhaseSeconds = (this.atrialPhaseSeconds + dt) % atrialPeriod;
        const centered = this.atrialPhaseSeconds - atrialPeriod / 2;
        const width = 0.04;
        value += 0.14 * Math.exp(-(centered * centered) / (2 * width * width));
      }

      // Pacing artifact: a narrow biphasic spike just ahead of the complex.
      if (this.morphology.pacingSpike === true) {
        if (this.previousTheta < -0.3 && theta >= -0.3) {
          this.spikeSamplesRemaining = Math.max(1, Math.round(0.004 * this.sampleRateHz));
        }
        if (this.spikeSamplesRemaining > 0) {
          value += 0.9;
          this.spikeSamplesRemaining -= 1;
        }
      }

      out[i] = value;
      this.previousTheta = theta;
    }
    return count;
  }
}

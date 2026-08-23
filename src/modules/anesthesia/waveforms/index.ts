/**
 * The waveform engine: one object that owns all four generators and keeps them
 * phase coherent, because the arterial and plethysmographic pulses are driven by
 * the R peaks the electrocardiogram actually produced rather than by a shared
 * nominal rate (engine/waveform-synthesis → The three traces agree beat for beat).
 *
 * Generation runs in the solver worker at the simulation tick rate and emits
 * sample blocks. The canvas only draws from those blocks and never synthesizes
 * physiology (→ Rendering Is Decoupled From Generation).
 */

import { createRng, type Rng } from '@platform/kernel/rng';
import { ArterialGenerator } from './arterial';
import { CapnoGenerator, alphaForObstruction } from './capnogram';
import { EcgGenerator } from './ecg';
import { PlethGenerator } from './pleth';
import { getRhythm } from './rhythms';
import { SAMPLE_RATE_HZ, type ArtifactId, type RhythmId, type SampleBlock, type WaveformDrive } from './types';

export * from './types';
export * from './rhythms';
export { alphaFromSlopes, alphaForObstruction, slopesForAlpha, AXIS_MMHG_PER_SECOND, CAPNO_PATTERNS } from './capnogram';
export { ARTERIAL_DELAY_SECONDS, ejectionTimeSeconds, REFERENCE_SVR } from './arterial';
export { PLETH_DELAY_SECONDS, LOW_SIGNAL_PERFUSION_INDEX, PlethGenerator } from './pleth';
export { MCSHARRY_TABLE_1, qtIntervalSeconds, scaleEventsForRate, EcgGenerator } from './ecg';

/** One tick's worth of samples for every signal. */
export interface WaveformFrame {
  readonly ecg: SampleBlock;
  readonly arterial: SampleBlock;
  readonly capno: SampleBlock;
  readonly pleth: SampleBlock;
  /** Simulated seconds of every R peak in this frame, for the pulse tone and the rate. */
  readonly rWaveSeconds: readonly number[];
  /** The alpha angle in force this frame, in degrees. */
  readonly capnoAlphaDegrees: number;
}

export interface WaveformEngineOptions {
  readonly seed: number;
  /** Simulation tick in seconds. The engine emits one frame per tick. */
  readonly tickSeconds: number;
}

export class WaveformEngine {
  private readonly ecg: EcgGenerator;
  private readonly arterial: ArterialGenerator;
  private readonly capno: CapnoGenerator;
  private readonly pleth: PlethGenerator;
  private readonly rng: Rng;
  private readonly tickSeconds: number;
  private elapsed = 0;
  private rhythmId: RhythmId = 'sinus';
  private artifacts = new Set<ArtifactId>();

  private readonly buffers: Record<'ecg' | 'arterial' | 'capno' | 'pleth', Float32Array>;

  constructor(options: WaveformEngineOptions) {
    this.tickSeconds = options.tickSeconds;
    this.rng = createRng(options.seed, 'waveforms');
    this.ecg = new EcgGenerator(
      { sampleRateHz: SAMPLE_RATE_HZ.ecg, rng: this.rng.fork('ecg') },
      getRhythm('sinus').morphology,
    );
    this.arterial = new ArterialGenerator(SAMPLE_RATE_HZ.arterial);
    this.capno = new CapnoGenerator(SAMPLE_RATE_HZ.capno);
    this.pleth = new PlethGenerator(SAMPLE_RATE_HZ.pleth);
    const size = (rate: number) => new Float32Array(Math.round(rate * this.tickSeconds));
    this.buffers = {
      ecg: size(SAMPLE_RATE_HZ.ecg),
      arterial: size(SAMPLE_RATE_HZ.arterial),
      capno: size(SAMPLE_RATE_HZ.capno),
      pleth: size(SAMPLE_RATE_HZ.pleth),
    };
  }

  /** Change rhythm. The generator applies it at the next beat boundary. */
  setRhythm(rhythmId: RhythmId): void {
    if (rhythmId === this.rhythmId) return;
    this.rhythmId = rhythmId;
    this.ecg.setMorphology(getRhythm(rhythmId).morphology, rhythmId);
  }

  setArtifact(artifact: ArtifactId, active: boolean): void {
    if (active) this.artifacts.add(artifact);
    else this.artifacts.delete(artifact);
  }

  hasArtifact(artifact: ArtifactId): boolean {
    return this.artifacts.has(artifact);
  }

  /** Whether the current rhythm produces a mechanical pulse. */
  get mechanicalPulse(): boolean {
    return getRhythm(this.rhythmId).morphology.mechanicalPulse;
  }

  /** Advance every generator by one tick and return the frame. */
  tick(drive: WaveformDrive): WaveformFrame {
    const startSeconds = this.elapsed;
    const mechanicalPulse = getRhythm(drive.rhythmId).morphology.mechanicalPulse;
    this.setRhythm(drive.rhythmId);

    this.ecg.advance(this.tickSeconds, {
      heartRateBpm: drive.heartRateBpm,
      rhythmId: drive.rhythmId,
      respiratoryRateBpm: drive.respiratoryRateBpm,
      anesthesiaDepthFraction: drive.anesthesiaDepthFraction,
    }, this.buffers.ecg);

    const rWaves = this.ecg.drainRWaves();
    for (const beat of rWaves) {
      this.arterial.schedulePulse(beat.atSeconds);
      this.pleth.schedulePulse(beat.atSeconds);
    }

    this.arterial.advance(this.tickSeconds, {
      systolicMmHg: drive.systolicMmHg,
      diastolicMmHg: drive.diastolicMmHg,
      svrDynSCm5: drive.svrDynSCm5,
      strokeVolumeMl: drive.strokeVolumeMl,
      heartRateBpm: drive.heartRateBpm,
      respiratoryRateBpm: drive.respiratoryRateBpm,
      hypovolemiaFraction: drive.hypovolemiaFraction,
      positivePressure: drive.positivePressure,
      dampingFraction: this.artifacts.has('arterial-damping') ? 1 : 0,
      mechanicalPulse,
    }, this.buffers.arterial);

    this.capno.advance(this.tickSeconds, {
      etco2MmHg: drive.etco2MmHg,
      respiratoryRateBpm: drive.respiratoryRateBpm,
      bronchospasmSeverity: drive.bronchospasmSeverity,
      ventilating: drive.ventilating && !this.artifacts.has('circuit-disconnection'),
      curareCleftDepth: drive.curareCleftDepth,
      inspiredCo2MmHg: 0,
      heartRateBpm: drive.heartRateBpm,
      esophageal: this.artifacts.has('esophageal-intubation'),
    }, this.buffers.capno);

    this.pleth.advance(this.tickSeconds, {
      perfusionIndex: drive.perfusionIndex,
      heartRateBpm: drive.heartRateBpm,
      respiratoryRateBpm: drive.respiratoryRateBpm,
      mechanicalPulse,
      probeDisplaced: this.artifacts.has('probe-displacement'),
    }, this.buffers.pleth);

    // Electrocautery corrupts the electrocardiogram only. Every other trace stays
    // clean and consistent with the true state, which is the discrimination lesson.
    if (this.artifacts.has('electrocautery')) {
      for (let i = 0; i < this.buffers.ecg.length; i += 1) {
        this.buffers.ecg[i] = (this.buffers.ecg[i] ?? 0) + this.rng.normal() * 0.45;
      }
    }

    this.elapsed += this.tickSeconds;

    const block = (signal: 'ecg' | 'arterial' | 'capno' | 'pleth'): SampleBlock => ({
      signal,
      sampleRateHz: SAMPLE_RATE_HZ[signal],
      startSeconds,
      // Copy so a consumer holding a frame is not overwritten by the next tick.
      samples: this.buffers[signal].slice(),
    });

    return {
      ecg: block('ecg'),
      arterial: block('arterial'),
      capno: block('capno'),
      pleth: block('pleth'),
      rWaveSeconds: rWaves.filter((b) => b.mechanicalPulse || true).map((b) => b.atSeconds),
      capnoAlphaDegrees: alphaForObstruction(drive.bronchospasmSeverity),
    };
  }
}

/** A resting adult drive, used by the landing page hero and by tests. */
export function restingDrive(overrides: Partial<WaveformDrive> = {}): WaveformDrive {
  return {
    heartRateBpm: 72,
    rhythmId: 'sinus',
    systolicMmHg: 118,
    diastolicMmHg: 74,
    svrDynSCm5: 1200,
    strokeVolumeMl: 70,
    perfusionIndex: 0.8,
    spo2Percent: 98,
    etco2MmHg: 38,
    respiratoryRateBpm: 12,
    bronchospasmSeverity: 0,
    ventilating: true,
    anesthesiaDepthFraction: 0,
    hypovolemiaFraction: 0,
    positivePressure: false,
    curareCleftDepth: 0,
    ...overrides,
  };
}

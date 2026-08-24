/** Shared types for the waveform layer (engine/waveform-synthesis). */

/** The signals this module renders. `--neuro` carries depth and blockade, which are not swept traces. */
export type SignalId = 'ecg' | 'arterial' | 'capno' | 'pleth';

/**
 * Sample rate per signal, declared rather than assumed.
 * engine/waveform-synthesis → Sample rate is sufficient for the morphology:
 * the electrocardiogram is sampled at no less than 250 Hz so QRS morphology is
 * preserved; the slower signals may use lower rates.
 *
 * Every rate here MUST divide the 100 ms simulation tick into a whole number of
 * samples. A rate that does not — 125 Hz gives 12.5 samples per tick — makes each
 * generator advance its own clock by a slightly different amount every tick, and
 * the traces silently drift out of phase with each other over minutes.
 * `tests/unit/waveform-mechanics.test.ts` asserts this.
 */
export const SAMPLE_RATE_HZ: Record<SignalId, number> = {
  ecg: 250,
  arterial: 120,
  capno: 50,
  pleth: 100,
};

/** The simulation tick, in seconds. Every sample rate above must divide it exactly. */
export const TICK_SECONDS = 0.1;

/** Y-axis extent per signal, in that signal's own clinical units. */
export const SIGNAL_RANGE: Record<SignalId, { min: number; max: number; unit: string }> = {
  ecg: { min: -1.2, max: 2.2, unit: 'mV' },
  arterial: { min: 0, max: 200, unit: 'mmHg' },
  capno: { min: -2, max: 60, unit: 'mmHg' },
  pleth: { min: -0.1, max: 1.2, unit: 'arbitrary' },
};

/** A block of samples for one signal covering one simulation tick. */
export interface SampleBlock {
  readonly signal: SignalId;
  readonly sampleRateHz: number;
  /** Simulated seconds at the first sample. */
  readonly startSeconds: number;
  readonly samples: Float32Array;
}

/** Everything the waveform layer needs from the patient state to draw a tick. */
export interface WaveformDrive {
  heartRateBpm: number;
  rhythmId: RhythmId;
  systolicMmHg: number;
  diastolicMmHg: number;
  /** dyn·s·cm⁻⁵; shapes the arterial upstroke and dicrotic notch position. */
  svrDynSCm5: number;
  strokeVolumeMl: number;
  /** 0..1 peripheral perfusion index; scales plethysmographic amplitude. */
  perfusionIndex: number;
  spo2Percent: number;
  etco2MmHg: number;
  respiratoryRateBpm: number;
  /** 0..1; 0 is unobstructed, 1 is severe obstruction (shark fin). */
  bronchospasmSeverity: number;
  /** True while the airway is disconnected or the patient is apneic. */
  ventilating: boolean;
  /** 0..1 depth of anesthesia effect used to attenuate respiratory sinus arrhythmia. */
  anesthesiaDepthFraction: number;
  /** 0..1 hypovolemia used to scale systolic pressure variation with the ventilator. */
  hypovolemiaFraction: number;
  /** True while positive-pressure ventilation is delivering breaths. */
  positivePressure: boolean;
  /** 0..1 residual neuromuscular activity, produces the curare cleft. */
  curareCleftDepth: number;
}

/** Every named rhythm in the library (engine/waveform-synthesis → Rhythm Library). */
export type RhythmId =
  | 'sinus'
  | 'sinus-bradycardia'
  | 'sinus-tachycardia'
  | 'atrial-fibrillation'
  | 'svt'
  | 'first-degree-block'
  | 'complete-heart-block'
  | 'ventricular-tachycardia'
  | 'ventricular-fibrillation'
  | 'asystole'
  | 'pea'
  | 'paced';

/** A sensor artifact corrupts what is displayed without touching the state vector. */
export type ArtifactId =
  | 'arterial-damping'
  | 'electrocautery'
  | 'probe-displacement'
  | 'circuit-disconnection'
  | 'esophageal-intubation'
  | 'sampling-line-obstruction';

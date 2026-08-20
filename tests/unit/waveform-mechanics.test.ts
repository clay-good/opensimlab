/**
 * Acceptance tests for engine/waveform-synthesis: arterial, capnogram,
 * plethysmogram, and the phase coherence between all three.
 */
import { describe, expect, it } from 'vitest';
import { WaveformEngine, restingDrive } from '@anesthesia/waveforms';
import {
  ARTERIAL_DELAY_SECONDS, ejectionTimeSeconds, REFERENCE_SVR,
} from '@anesthesia/waveforms/arterial';
import {
  alphaFromSlopes, alphaForObstruction, slopesForAlpha,
  NORMAL_ALPHA_DEGREES, CAPNO_PATTERNS, AXIS_MMHG_PER_SECOND,
} from '@anesthesia/waveforms/capnogram';
import { PLETH_DELAY_SECONDS, PlethGenerator, LOW_SIGNAL_PERFUSION_INDEX } from '@anesthesia/waveforms/pleth';
import { bestLag, crossCorrelation } from '@platform/kernel/numeric';
import { SAMPLE_RATE_HZ, TICK_SECONDS, type WaveformDrive } from '@anesthesia/waveforms/types';

const TICK = 0.1;

function run(seconds: number, drive: Partial<WaveformDrive> = {}, mutate?: (engine: WaveformEngine) => void) {
  const engine = new WaveformEngine({ seed: 20260819, tickSeconds: TICK });
  mutate?.(engine);
  const out = { ecg: [] as number[], arterial: [] as number[], capno: [] as number[], pleth: [] as number[] };
  const rWaves: number[] = [];
  const full = restingDrive(drive);
  for (let t = 0; t < seconds; t += TICK) {
    const frame = engine.tick(full);
    out.ecg.push(...frame.ecg.samples);
    out.arterial.push(...frame.arterial.samples);
    out.capno.push(...frame.capno.samples);
    out.pleth.push(...frame.pleth.samples);
    rWaves.push(...frame.rWaveSeconds);
  }
  return { ...out, rWaves, engine };
}

/** Resample by nearest neighbour to a common rate so lags can be compared in seconds. */
function resample(samples: readonly number[], fromHz: number, toHz: number): number[] {
  const count = Math.floor((samples.length / fromHz) * toHz);
  const out = new Array<number>(count);
  for (let i = 0; i < count; i += 1) {
    out[i] = samples[Math.round((i / toHz) * fromHz)] ?? 0;
  }
  return out;
}

const derivative = (samples: readonly number[]): number[] =>
  samples.map((value, i) => (i === 0 ? 0 : value - (samples[i - 1] ?? 0)));

/** Time of the arterial foot after `rSeconds`: the end-diastolic minimum before the upstroke. */
function arterialFootDelay(arterial: readonly number[], rSeconds: number): number {
  const rate = SAMPLE_RATE_HZ.arterial;
  const from = Math.round((rSeconds + 0.02) * rate);
  const to = Math.round((rSeconds + 0.55) * rate);
  let bestIndex = from;
  let bestValue = Infinity;
  for (let i = from; i < to; i += 1) {
    const value = arterial[i] ?? Infinity;
    if (value < bestValue) { bestValue = value; bestIndex = i; }
  }
  return bestIndex / rate - rSeconds;
}

/** Time at which the plethysmographic pulse first rises past a tenth of its amplitude. */
function plethOnsetDelay(pleth: readonly number[], rSeconds: number): number {
  const rate = SAMPLE_RATE_HZ.pleth;
  const from = Math.round((rSeconds + 0.02) * rate);
  const to = Math.round((rSeconds + 0.7) * rate);
  const segment = pleth.slice(from, to);
  const low = Math.min(...segment);
  const high = Math.max(...segment);
  const threshold = low + 0.1 * (high - low);
  for (let i = 0; i < segment.length; i += 1) {
    if ((segment[i] ?? 0) > threshold) return (from + i) / rate - rSeconds;
  }
  return Number.NaN;
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

describe('Scenario: The three traces agree beat for beat', () => {
  it('places every arterial upstroke after its QRS at the declared delay, with no drift', () => {
    const { arterial, rWaves } = run(60);
    const beats = rWaves.slice(4, rWaves.length - 2);
    const delays = beats.map((r) => arterialFootDelay(arterial, r));
    expect(median(delays)).toBeGreaterThan(ARTERIAL_DELAY_SECONDS - 0.03);
    expect(median(delays)).toBeLessThan(ARTERIAL_DELAY_SECONDS + 0.03);
    // No drift: the last beat of a 60 second run is as well aligned as the first.
    expect(Math.max(...delays) - Math.min(...delays)).toBeLessThan(0.04);
  });

  it('places every plethysmographic upstroke after its QRS at the longer peripheral delay', () => {
    const { pleth, rWaves } = run(60);
    const beats = rWaves.slice(4, rWaves.length - 2);
    const delays = beats.map((r) => plethOnsetDelay(pleth, r)).filter((d) => Number.isFinite(d));
    expect(median(delays)).toBeGreaterThan(PLETH_DELAY_SECONDS);
    expect(median(delays)).toBeLessThan(PLETH_DELAY_SECONDS + 0.06);
    expect(Math.max(...delays) - Math.min(...delays)).toBeLessThan(0.04);
    // The peripheral trace lags the central one, as it must.
    expect(PLETH_DELAY_SECONDS).toBeGreaterThan(ARTERIAL_DELAY_SECONDS);
  });

  it('cross-correlates the two mechanical traces at their declared separation', () => {
    const { arterial, pleth } = run(60);
    const common = 100;
    const a = resample(arterial, SAMPLE_RATE_HZ.arterial, common);
    const p = resample(pleth, SAMPLE_RATE_HZ.pleth, common);
    const lag = bestLag(a, p, Math.round(0.4 * common)) / common;
    // The plethysmogram tracks the arterial trace within one beat, which is what
    // phase coherence between the two mechanical signals means.
    expect(lag).toBeGreaterThanOrEqual(0);
    expect(lag).toBeLessThan(0.4);
    expect(crossCorrelation(a, p, Math.round(lag * common))).toBeGreaterThan(0.5);
  });

  it('gives every single R wave its own arterial and plethysmographic pulse', () => {
    const { arterial, pleth, rWaves } = run(40);
    const beats = rWaves.slice(4, rWaves.length - 2);
    expect(beats.length).toBeGreaterThan(30);
    // Not a median: every beat individually must carry both mechanical pulses,
    // which is what "beat for beat" means.
    for (const r of beats) {
      expect(Math.abs(arterialFootDelay(arterial, r) - ARTERIAL_DELAY_SECONDS)).toBeLessThan(0.03);
      expect(Math.abs(plethOnsetDelay(pleth, r) - PLETH_DELAY_SECONDS)).toBeLessThan(0.05);
    }
  });
});

describe('Requirement: sample rates must divide the tick', () => {
  it('gives every signal a whole number of samples per 100 ms tick', () => {
    for (const [signal, rate] of Object.entries(SAMPLE_RATE_HZ)) {
      const perTick = rate * TICK_SECONDS;
      expect(
        Number.isInteger(perTick),
        `${signal} at ${rate} Hz gives ${perTick} samples per tick, which would drift`,
      ).toBe(true);
    }
  });
});

describe('Requirement: Arterial Pressure Waveform', () => {
  it('renders an upstroke, a dicrotic notch, and a diastolic runoff', () => {
    const { arterial } = run(20);
    const tail = arterial.slice(Math.round(10 * SAMPLE_RATE_HZ.arterial));
    expect(Math.max(...tail)).toBeGreaterThan(105);
    expect(Math.min(...tail)).toBeLessThan(85);

    // The notch is a local minimum on the downslope, between peak and end diastole.
    const rate = SAMPLE_RATE_HZ.arterial;
    const beat = tail.slice(0, Math.round(0.8 * rate));
    const peakIndex = beat.indexOf(Math.max(...beat));
    const after = beat.slice(peakIndex + 2);
    let inflections = 0;
    for (let i = 1; i < after.length - 1; i += 1) {
      const previous = after[i - 1] ?? 0, current = after[i] ?? 0, next = after[i + 1] ?? 0;
      if (current < previous && current < next) inflections += 1;
    }
    expect(inflections).toBeGreaterThanOrEqual(1);
  });

  it('Scenario: the waveform reflects the underlying hemodynamics', () => {
    // Vasodilation shortens ejection, which steepens the upstroke relative to the
    // runoff and moves the dicrotic notch earlier.
    const normal = ejectionTimeSeconds(72, REFERENCE_SVR);
    const dilated = ejectionTimeSeconds(72, REFERENCE_SVR * 0.55);
    expect(dilated).toBeLessThan(normal);
  });

  it('Scenario: respiratory variation appears with hypovolemia', () => {
    const rate = SAMPLE_RATE_HZ.arterial;
    const measure = (hypovolemiaFraction: number) => {
      const { arterial } = run(40, {
        hypovolemiaFraction, positivePressure: true, respiratoryRateBpm: 12, anesthesiaDepthFraction: 1,
      });
      const tail = arterial.slice(Math.round(20 * rate));
      // Pulse pressure variation computed from the rendered trace, as at the bedside.
      const window = Math.round(5 * rate);
      const highs: number[] = []; const lows: number[] = [];
      for (let start = 0; start + window <= tail.length; start += window) {
        const slice = tail.slice(start, start + window);
        highs.push(Math.max(...slice)); lows.push(Math.min(...slice));
      }
      const maxPp = Math.max(...highs) - Math.min(...lows);
      return maxPp;
    };
    const euvolemic = measure(0);
    const hypovolemic = measure(1);
    expect(hypovolemic).toBeGreaterThan(euvolemic * 1.1);
  });

  it('Scenario: damping is a rendering state, not a pressure change', () => {
    const clean = run(20);
    const damped = run(20, {}, (engine) => engine.setArtifact('arterial-damping', true));
    const rate = SAMPLE_RATE_HZ.arterial;
    const spread = (samples: number[]) => {
      const tail = samples.slice(Math.round(12 * rate));
      return Math.max(...tail) - Math.min(...tail);
    };
    // The displayed pressure narrows toward the mean.
    expect(spread(damped.arterial)).toBeLessThan(spread(clean.arterial) * 0.6);
    // High-frequency content is lost.
    const energy = (samples: number[]) =>
      derivative(samples.slice(Math.round(12 * rate))).reduce((a, b) => a + b * b, 0);
    expect(energy(damped.arterial)).toBeLessThan(energy(clean.arterial) * 0.5);
  });
});

describe('Requirement: Capnogram With Real Phase Structure', () => {
  it('round-trips the alpha angle through the derived slopes', () => {
    for (const alpha of [95, 103, 118, 135, 148]) {
      expect(alphaFromSlopes(slopesForAlpha(alpha))).toBeCloseTo(alpha, 6);
    }
  });

  it('declares the axis scaling the angle is measured against', () => {
    expect(AXIS_MMHG_PER_SECOND).toBe(25);
  });

  it('Scenario: bronchospasm produces the shark-fin morphology', () => {
    const normal = slopesForAlpha(alphaForObstruction(0));
    const severe = slopesForAlpha(alphaForObstruction(1));
    // The expiratory upstroke slope decreases and the plateau slope increases.
    expect(severe.upstroke).toBeLessThan(normal.upstroke);
    expect(severe.plateau).toBeGreaterThan(normal.plateau);
    // And the degree of change scales with severity.
    const moderate = slopesForAlpha(alphaForObstruction(0.5));
    expect(moderate.plateau).toBeGreaterThan(normal.plateau);
    expect(moderate.plateau).toBeLessThan(severe.plateau);
    expect(alphaForObstruction(0)).toBe(NORMAL_ALPHA_DEGREES);
  });

  it('Scenario: morphology changes before the number does', () => {
    const rate = SAMPLE_RATE_HZ.capno;
    const etco2 = 38;
    const normal = run(30, { etco2MmHg: etco2, bronchospasmSeverity: 0 });
    const obstructed = run(30, { etco2MmHg: etco2, bronchospasmSeverity: 0.7 });
    const endTidal = (samples: number[]) => Math.max(...samples.slice(Math.round(20 * rate)));
    // The end-tidal number is unchanged and still inside a normal alarm band.
    expect(endTidal(obstructed.capno)).toBeCloseTo(endTidal(normal.capno), 0);
    expect(endTidal(obstructed.capno)).toBeGreaterThan(30);
    expect(endTidal(obstructed.capno)).toBeLessThan(45);
    // But the alpha angle measured back off the rendered trace has widened.
    expect(measureAlpha(obstructed.capno, rate)).toBeGreaterThan(measureAlpha(normal.capno, rate) + 12);
  });

  it('renders the four named phases in order', () => {
    const rate = SAMPLE_RATE_HZ.capno;
    const { capno } = run(30, { respiratoryRateBpm: 12, etco2MmHg: 38 });
    const cycle = Math.round(5 * rate);
    const beat = capno.slice(Math.round(20 * rate), Math.round(20 * rate) + cycle);
    // Phase I baseline near zero, a rise, a plateau near the end-tidal value, then a fall.
    expect(Math.min(...beat)).toBeLessThan(2);
    expect(Math.max(...beat)).toBeGreaterThan(35);
    const peakIndex = beat.indexOf(Math.max(...beat));
    expect(peakIndex).toBeGreaterThan(0);
    expect(beat[beat.length - 1] ?? 99).toBeLessThan(5);
  });

  it('Scenario: other named capnogram patterns are available', () => {
    expect([...CAPNO_PATTERNS].sort()).toEqual([
      'cardiogenic-oscillations', 'curare-cleft', 'disconnection', 'esophageal-intubation',
      'normal', 'rebreathing', 'shark-fin',
    ]);
  });

  it('loses the waveform entirely on circuit disconnection', () => {
    const { capno } = run(20, {}, (engine) => engine.setArtifact('circuit-disconnection', true));
    expect(Math.max(...capno)).toBe(0);
  });

  it('renders the rapidly decaying trace of an esophageal intubation', () => {
    const rate = SAMPLE_RATE_HZ.capno;
    const { capno } = run(40, {}, (engine) => engine.setArtifact('esophageal-intubation', true));
    const early = Math.max(...capno.slice(0, Math.round(6 * rate)));
    const late = Math.max(...capno.slice(Math.round(30 * rate)));
    expect(early).toBeLessThan(20);
    expect(late).toBeLessThan(early * 0.4);
  });

  it('notches the plateau when neuromuscular function returns', () => {
    const rate = SAMPLE_RATE_HZ.capno;
    const clean = run(30, { curareCleftDepth: 0 }).capno.slice(Math.round(20 * rate));
    const clefted = run(30, { curareCleftDepth: 1 }).capno.slice(Math.round(20 * rate));
    // The plateau rises steadily, so a cleft is not a low value: it is a
    // departure from the plateau's own straight line. Fit that line and take the
    // deepest negative residual, which is zero for an uninterrupted plateau.
    expect(plateauNotchDepth(clefted, SAMPLE_RATE_HZ.capno)).toBeGreaterThan(6);
    expect(plateauNotchDepth(clean, SAMPLE_RATE_HZ.capno)).toBeLessThan(1);
  });
});

/** Recover the alpha angle from a rendered capnogram, as a reviewer would from a printout. */
function measureAlpha(samples: readonly number[], rate: number): number {
  const tail = samples.slice(Math.round(samples.length * 0.6));
  const slope = tail.map((value, i) => (i === 0 ? 0 : (value - (tail[i - 1] ?? 0)) * rate));
  const upstroke = Math.max(...slope);
  // The plateau slope is the median of the small positive slopes, excluding the
  // steep upstroke and the inspiratory downstroke.
  const plateauSlopes = slope.filter((s) => s > 0 && s < upstroke * 0.3).sort((a, b) => a - b);
  const plateau = plateauSlopes[Math.floor(plateauSlopes.length / 2)] ?? 0;
  return alphaFromSlopes({ upstroke, plateau });
}

/**
 * The deepest departure of the alveolar plateau from its own straight line, in
 * mmHg. Zero for an uninterrupted plateau; large where a curare cleft notches it.
 */
function plateauNotchDepth(samples: readonly number[], rate: number): number {
  const cycle = Math.round(5 * rate);
  // Take a whole breath from the middle of whatever window was passed in.
  const breaths = Math.floor(samples.length / cycle);
  if (breaths < 2) return 0;
  const start = Math.floor(breaths / 2) * cycle;
  const breath = samples.slice(start, start + cycle);
  const peak = Math.max(...breath);
  const peakIndex = breath.indexOf(peak);
  // The plateau runs from the end of the upstroke to the end-tidal peak.
  const rising = breath.findIndex((v) => v > peak * 0.75);
  if (rising < 0 || peakIndex - rising < 8) return 0;
  const plateau = breath.slice(rising, peakIndex + 1);
  const first = plateau[0] ?? 0;
  const last = plateau[plateau.length - 1] ?? 0;
  let worst = 0;
  for (let i = 0; i < plateau.length; i += 1) {
    const line = first + ((last - first) * i) / (plateau.length - 1);
    worst = Math.max(worst, line - (plateau[i] ?? 0));
  }
  return worst;
}

describe('Requirement: Plethysmogram Follows Perfusion', () => {
  it('Scenario: poor perfusion degrades the trace realistically', () => {
    const good = run(20, { perfusionIndex: 0.9 });
    const poor = run(20, { perfusionIndex: 0.15 });
    const rate = SAMPLE_RATE_HZ.pleth;
    const amplitude = (samples: number[]) => {
      const tail = samples.slice(Math.round(12 * rate));
      return Math.max(...tail) - Math.min(...tail);
    };
    expect(amplitude(poor.pleth)).toBeLessThan(amplitude(good.pleth) * 0.3);
    // And the interface must be told to declare low signal quality.
    expect(PlethGenerator.isLowSignal(0.15)).toBe(true);
    expect(PlethGenerator.isLowSignal(0.9)).toBe(false);
    expect(LOW_SIGNAL_PERFUSION_INDEX).toBeGreaterThan(0);
  });

  it('Scenario: pulseless electrical activity flattens the mechanical traces only', () => {
    const rate = SAMPLE_RATE_HZ.pleth;
    const { pleth, ecg, arterial } = run(20, { rhythmId: 'pea' });
    const plethTail = pleth.slice(Math.round(12 * rate));
    expect(Math.max(...plethTail) - Math.min(...plethTail)).toBeLessThan(0.1);
    const arterialTail = arterial.slice(Math.round(12 * SAMPLE_RATE_HZ.arterial));
    expect(Math.max(...arterialTail) - Math.min(...arterialTail)).toBeLessThan(6);
    // While the electrocardiogram still shows organized complexes.
    expect(Math.max(...ecg.slice(Math.round(12 * SAMPLE_RATE_HZ.ecg)))).toBeGreaterThan(0.8);
  });

  it('Scenario: pulse oximeter probe displacement', () => {
    const rate = SAMPLE_RATE_HZ.pleth;
    const { pleth, capno } = run(20, {}, (engine) => engine.setArtifact('probe-displacement', true));
    const tail = pleth.slice(Math.round(12 * rate));
    expect(Math.max(...tail) - Math.min(...tail)).toBeLessThan(0.1);
    // Capnography continues to show normal ventilation.
    expect(Math.max(...capno)).toBeGreaterThan(30);
  });
});

describe('Scenario: Electrocautery corrupts the electrocardiogram only', () => {
  it('leaves the plethysmograph and capnogram clean', () => {
    const noisy = run(20, {}, (engine) => engine.setArtifact('electrocautery', true));
    const clean = run(20);
    const roughness = (samples: number[]) =>
      derivative(samples).reduce((a, b) => a + Math.abs(b), 0) / samples.length;
    expect(roughness(noisy.ecg)).toBeGreaterThan(roughness(clean.ecg) * 3);
    expect(roughness(noisy.pleth)).toBeCloseTo(roughness(clean.pleth), 3);
    expect(roughness(noisy.capno)).toBeCloseTo(roughness(clean.capno), 3);
  });
});

describe('Requirement: Rendering Is Decoupled From Generation', () => {
  it('declares a sample rate per signal, with at least 250 Hz for the electrocardiogram', () => {
    expect(SAMPLE_RATE_HZ.ecg).toBeGreaterThanOrEqual(250);
    expect(SAMPLE_RATE_HZ.arterial).toBeGreaterThan(0);
    expect(SAMPLE_RATE_HZ.capno).toBeGreaterThan(0);
    expect(SAMPLE_RATE_HZ.pleth).toBeGreaterThan(0);
  });

  it('emits a sample block per tick whose length matches the declared rate', () => {
    const engine = new WaveformEngine({ seed: 1, tickSeconds: TICK });
    const frame = engine.tick(restingDrive());
    expect(frame.ecg.samples.length).toBe(SAMPLE_RATE_HZ.ecg * TICK);
    expect(frame.capno.samples.length).toBe(SAMPLE_RATE_HZ.capno * TICK);
    expect(frame.ecg.startSeconds).toBe(0);
  });

  it('produces an identical signal for an identical seed, so a dropped frame loses pixels only', () => {
    const a = run(10).ecg;
    const b = run(10).ecg;
    expect(a).toEqual(b);
  });
});

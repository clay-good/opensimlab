/**
 * Acceptance tests for engine/waveform-synthesis, ECG requirements.
 * Each test names the WHEN/THEN scenario it stands in for.
 */
import { describe, expect, it } from 'vitest';
import {
  EcgGenerator,
  MCSHARRY_TABLE_1,
  eventTimeOffsetSeconds,
  qtIntervalSeconds,
  scaleEventsForRate,
} from '@anesthesia/waveforms/ecg';
import { getRhythm, RHYTHM_IDS } from '@anesthesia/waveforms/rhythms';
import { createRng } from '@platform/kernel/rng';
import { SAMPLE_RATE_HZ, type RhythmId } from '@anesthesia/waveforms/types';

const RATE = SAMPLE_RATE_HZ.ecg;

function render(
  seconds: number,
  drive: Partial<Parameters<EcgGenerator['advance']>[1]> = {},
  rhythm: RhythmId = 'sinus',
) {
  const generator = new EcgGenerator(
    { sampleRateHz: RATE, rng: createRng(20260819, 'test') },
    getRhythm(rhythm).morphology,
  );
  generator.setMorphology(getRhythm(rhythm).morphology, rhythm);
  const chunk = new Float32Array(RATE);
  const all: number[] = [];
  const rWaves: number[] = [];
  for (let s = 0; s < seconds; s += 1) {
    generator.advance(1, {
      heartRateBpm: 72,
      rhythmId: rhythm,
      respiratoryRateBpm: 12,
      anesthesiaDepthFraction: 0,
      ...drive,
    }, chunk);
    all.push(...chunk);
    rWaves.push(...generator.drainRWaves().map((b) => b.atSeconds));
  }
  return { samples: all, rWaves };
}

describe('The published table is the one from the paper', () => {
  it('carries the five events at the published angles, amplitudes and widths', () => {
    expect(MCSHARRY_TABLE_1.map((e) => e.name)).toEqual(['P', 'Q', 'R', 'S', 'T']);
    expect(MCSHARRY_TABLE_1.map((e) => e.a)).toEqual([1.2, -5.0, 30.0, -7.5, 0.75]);
    expect(MCSHARRY_TABLE_1.map((e) => e.b)).toEqual([0.25, 0.1, 0.1, 0.1, 0.4]);
    expect(MCSHARRY_TABLE_1.map((e) => e.theta)).toEqual([
      -Math.PI / 3, -Math.PI / 12, 0, Math.PI / 12, Math.PI / 2,
    ]);
  });
});

describe('Scenario: A normal sinus rhythm is recognizable to a clinician', () => {
  it('renders P, QRS and T with the right ordering, polarity and relative amplitude', () => {
    const { samples, rWaves } = render(6);
    expect(rWaves.length).toBeGreaterThanOrEqual(5);

    const rIndex = Math.round((rWaves[2] ?? 0) * RATE);
    const rr = (rWaves[3] ?? 0) - (rWaves[2] ?? 0);
    const at = (offsetSeconds: number) => samples[rIndex + Math.round(offsetSeconds * RATE)] ?? 0;

    const rPeak = Math.max(...samples.slice(rIndex - 4, rIndex + 4));
    // R is the dominant deflection, around 1 to 1.6 mV in lead II.
    expect(rPeak).toBeGreaterThan(0.9);
    expect(rPeak).toBeLessThan(1.9);

    // Q immediately precedes R and is negative; S immediately follows and is negative.
    const qWindow = samples.slice(rIndex - Math.round(0.05 * RATE), rIndex - Math.round(0.01 * RATE));
    const sWindow = samples.slice(rIndex + Math.round(0.01 * RATE), rIndex + Math.round(0.06 * RATE));
    expect(Math.min(...qWindow)).toBeLessThan(-0.03);
    expect(Math.min(...sWindow)).toBeLessThan(-0.08);

    // P precedes the complex, is upright, and is far smaller than R.
    const pWindow = samples.slice(rIndex - Math.round(0.22 * RATE), rIndex - Math.round(0.07 * RATE));
    const pPeak = Math.max(...pWindow);
    expect(pPeak).toBeGreaterThan(0.03);
    expect(pPeak).toBeLessThan(rPeak * 0.35);

    // T follows the complex, is upright, and is larger than P.
    const tWindow = samples.slice(rIndex + Math.round(0.18 * RATE), rIndex + Math.round(0.45 * RATE));
    const tPeak = Math.max(...tWindow);
    expect(tPeak).toBeGreaterThan(pPeak);
    expect(tPeak).toBeLessThan(rPeak * 0.6);

    // The ST segment sits near the isoelectric line between S and T.
    expect(Math.abs(at(0.09))).toBeLessThan(0.12);
    expect(rr).toBeGreaterThan(0.6);
  });
});

describe('Scenario: Heart rate variability is present and physiological', () => {
  it('varies beat to beat with a respiratory component when awake', () => {
    const { rWaves } = render(60, { anesthesiaDepthFraction: 0 });
    const intervals = rWaves.slice(1).map((t, i) => t - (rWaves[i] ?? 0));
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const sd = Math.sqrt(intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length);
    expect(sd / mean).toBeGreaterThan(0.02);
  });

  it('attenuates that variability under general anesthesia', () => {
    const awake = render(60, { anesthesiaDepthFraction: 0 }).rWaves;
    const asleep = render(60, { anesthesiaDepthFraction: 1 }).rWaves;
    const spread = (times: number[]) => {
      const intervals = times.slice(1).map((t, i) => t - (times[i] ?? 0));
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      return Math.sqrt(intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length) / mean;
    };
    expect(spread(asleep)).toBeLessThan(spread(awake) * 0.5);
  });
});

describe('Scenario: Rate changes do not distort morphology incorrectly', () => {
  const morphology = getRhythm('sinus').morphology;

  it('shortens QT with rate rather than scaling the whole complex uniformly', () => {
    const qtAt60 = qtIntervalSeconds(morphology, 1.0);
    const qtAt140 = qtIntervalSeconds(morphology, 60 / 140);
    expect(qtAt140).toBeLessThan(qtAt60);
    // Bazett: the rate-corrected interval QT / sqrt(RR) is stable across rates,
    // which is what "shortens in the published manner" means.
    const qtcAt60 = qtAt60 / Math.sqrt(1.0);
    const qtcAt140 = qtAt140 / Math.sqrt(60 / 140);
    // The residual is the rate-independent QRS width inside the measured interval,
    // which is the intended behavior rather than an error, so the band is +/- 12%.
    expect(qtcAt140 / qtcAt60).toBeGreaterThan(0.88);
    expect(qtcAt140 / qtcAt60).toBeLessThan(1.12);
    // A model that scaled the whole complex uniformly would give the linear ratio.
    const linearRatio = (60 / 140) / 1.0;
    expect(qtAt140 / qtAt60).toBeGreaterThan(linearRatio * 1.25);
  });

  it('keeps the published Q and S event timing rate independent', () => {
    const q = morphology.events.find((event) => event.name === 'Q');
    const s = morphology.events.find((event) => event.name === 'S');
    expect(q).toBeDefined();
    expect(s).toBeDefined();
    if (!q || !s) return;

    expect(eventTimeOffsetSeconds(q, 1)).toBeCloseTo(-1 / 24, 9);
    expect(eventTimeOffsetSeconds(s, 1)).toBeCloseTo(1 / 24, 9);
    expect(eventTimeOffsetSeconds(q, 60 / 140)).toBeCloseTo(-1 / 24, 9);
    expect(eventTimeOffsetSeconds(s, 60 / 140)).toBeCloseTo(1 / 24, 9);
  });

  it('shortens the RR interval as expected', () => {
    const slow = render(20, { heartRateBpm: 60, anesthesiaDepthFraction: 1 }).rWaves;
    const fast = render(20, { heartRateBpm: 140, anesthesiaDepthFraction: 1 }).rWaves;
    const meanInterval = (times: number[]) =>
      (times[times.length - 1] ?? 0) - (times[0] ?? 0) === 0
        ? 0
        : ((times[times.length - 1] ?? 0) - (times[0] ?? 0)) / (times.length - 1);
    expect(meanInterval(slow)).toBeCloseTo(1.0, 1);
    expect(meanInterval(fast)).toBeCloseTo(60 / 140, 1);
  });

  it('scales the rate-dependent events but not the QRS events', () => {
    const at60 = scaleEventsForRate(MCSHARRY_TABLE_1, 1);
    const scaled = scaleEventsForRate(MCSHARRY_TABLE_1, 0.5);
    const q = scaled.find((e) => e.name === 'Q');
    const t = scaled.find((e) => e.name === 'T');
    expect(q?.b).toBeCloseTo(0.1 * 2, 9);
    expect(t?.b).toBeCloseTo(0.4 * Math.pow(0.5, -0.5), 9);

    const widthSeconds = (event: (typeof scaled)[number], rr: number) =>
      event.b * rr / (2 * Math.PI);
    for (const name of ['Q', 'R', 'S'] as const) {
      const reference = at60.find((event) => event.name === name);
      const faster = scaled.find((event) => event.name === name);
      expect(reference).toBeDefined();
      expect(faster).toBeDefined();
      if (reference && faster) {
        expect(widthSeconds(faster, 0.5)).toBeCloseTo(widthSeconds(reference, 1), 9);
      }
    }
  });

  it('keeps declared wide-complex rhythms wider than sinus', () => {
    const qrsWidth = (rhythm: RhythmId) => getRhythm(rhythm).morphology.events
      .filter((event) => event.name === 'Q' || event.name === 'R' || event.name === 'S')
      .reduce((sum, event) => sum + event.b, 0);
    const sinusWidth = qrsWidth('sinus');
    for (const rhythm of ['complete-heart-block', 'ventricular-tachycardia', 'paced'] as const) {
      expect(qrsWidth(rhythm)).toBeGreaterThan(sinusWidth);
    }
  });
});

describe('Scenario: Atrial fibrillation is irregularly irregular', () => {
  it('has absent P waves and an interval distribution wider than sinus with variability', () => {
    const afib = render(60, { anesthesiaDepthFraction: 0 }, 'atrial-fibrillation');
    const sinus = render(60, { anesthesiaDepthFraction: 0 }, 'sinus');
    const cv = (times: number[]) => {
      const intervals = times.slice(1).map((t, i) => t - (times[i] ?? 0));
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      return Math.sqrt(intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length) / mean;
    };
    expect(cv(afib.rWaves)).toBeGreaterThan(cv(sinus.rWaves) * 2);

    // No P wave. Measured by signal-averaging the pre-complex window across every
    // beat, which is how it would be measured on a real recording: a P wave is time
    // locked to the complex and survives averaging, while the model's 0.15 mV
    // respiratory baseline wander is not and averages away.
    const pAmplitude = (result: { samples: number[]; rWaves: number[] }) => {
      const from = Math.round(0.22 * RATE);
      const to = Math.round(0.08 * RATE);
      const width = from - to;
      const stack = new Array<number>(width).fill(0);
      const beats = result.rWaves.slice(2);
      for (const beat of beats) {
        const index = Math.round(beat * RATE);
        for (let i = 0; i < width; i += 1) {
          stack[i] = (stack[i] ?? 0) + (result.samples[index - from + i] ?? 0) / beats.length;
        }
      }
      return Math.max(...stack) - Math.min(...stack);
    };
    expect(pAmplitude(afib)).toBeLessThan(pAmplitude(sinus) * 0.4);

    // And no repeating pattern: successive intervals are not autocorrelated.
    const intervals = afib.rWaves.slice(1).map((t, i) => t - (afib.rWaves[i] ?? 0));
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    let num = 0, den = 0;
    for (let i = 0; i < intervals.length - 1; i += 1) {
      num += ((intervals[i] ?? 0) - mean) * ((intervals[i + 1] ?? 0) - mean);
    }
    for (const value of intervals) den += (value - mean) ** 2;
    expect(Math.abs(num / den)).toBeLessThan(0.4);
  });
});

describe('Scenario: Electrical and mechanical activity are separate', () => {
  it('declares which rhythms produce a mechanical pulse', () => {
    expect(getRhythm('pea').morphology.mechanicalPulse).toBe(false);
    expect(getRhythm('ventricular-fibrillation').morphology.mechanicalPulse).toBe(false);
    expect(getRhythm('asystole').morphology.mechanicalPulse).toBe(false);
    expect(getRhythm('sinus').morphology.mechanicalPulse).toBe(true);
  });

  it('renders organized complexes during pulseless electrical activity', () => {
    const { samples, rWaves } = render(10, {}, 'pea');
    expect(rWaves.length).toBeGreaterThan(5);
    expect(Math.max(...samples)).toBeGreaterThan(0.8);
  });
});

describe('The rhythm library is complete and self-describing', () => {
  it('provides every named rhythm the specification lists', () => {
    expect(RHYTHM_IDS).toEqual([
      'sinus', 'sinus-bradycardia', 'sinus-tachycardia', 'atrial-fibrillation', 'svt',
      'first-degree-block', 'complete-heart-block', 'torsades-de-pointes', 'ventricular-tachycardia',
      'ventricular-fibrillation', 'asystole', 'pea', 'paced',
    ]);
  });

  it('cites a source and a non-visual description for every morphology', () => {
    for (const id of RHYTHM_IDS) {
      const rhythm = getRhythm(id);
      expect(rhythm.source.length).toBeGreaterThan(20);
      expect(rhythm.morphologyDescription.length).toBeGreaterThan(20);
    }
  });

  it('renders ventricular fibrillation as chaotic with no measurable rate', () => {
    const { samples, rWaves } = render(10, {}, 'ventricular-fibrillation');
    expect(rWaves).toHaveLength(0);
    expect(getRhythm('ventricular-fibrillation').rateIsMeasurable).toBe(false);
    expect(Math.max(...samples)).toBeLessThan(0.7);
    expect(Math.max(...samples)).toBeGreaterThan(0.2);
  });

  it('renders torsades as deterministic wide complexes that twist around baseline', () => {
    const first = render(8, { heartRateBpm: 220 }, 'torsades-de-pointes');
    const second = render(8, { heartRateBpm: 220 }, 'torsades-de-pointes');
    expect(first.rWaves.length).toBeGreaterThan(20);
    expect(Math.min(...first.samples)).toBeLessThan(-0.4);
    expect(Math.max(...first.samples)).toBeGreaterThan(0.4);
    expect(first.samples).toEqual(second.samples);
    expect(getRhythm('torsades-de-pointes').morphologyDescription).toContain('polymorphic');
  });

  it('renders asystole as a flat line with only baseline noise', () => {
    const { samples } = render(10, {}, 'asystole');
    expect(Math.max(...samples.map(Math.abs))).toBeLessThan(0.08);
  });

  it('dissociates the atria from the ventricles in complete heart block', () => {
    const { rWaves } = render(30, { heartRateBpm: 36 }, 'complete-heart-block');
    const intervals = rWaves.slice(1).map((t, i) => t - (rWaves[i] ?? 0));
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    // Ventricular escape is regular and slow while the atria run at their own rate.
    expect(mean).toBeGreaterThan(1.3);
    expect(getRhythm('complete-heart-block').morphology.atrialRateBpm).toBe(82);
  });

  it('renders a pacing artifact ahead of each paced complex', () => {
    const { samples, rWaves } = render(10, { heartRateBpm: 70 }, 'paced');
    const rIndex = Math.round((rWaves[2] ?? 0) * RATE);
    const spikeWindow = samples.slice(rIndex - Math.round(0.09 * RATE), rIndex - Math.round(0.01 * RATE));
    expect(Math.max(...spikeWindow)).toBeGreaterThan(0.5);
  });
});

describe('Requirement: Deflection Amplitude Does Not Depend On Heart Rate', () => {
  // The Gaussian deflection is a·b²/omega, and `scaleEventsForRate` changes b to
  // hold each event's duration in seconds. Correcting the gain for omega alone
  // left b² uncorrected, so the QRS grew with the SQUARE of heart rate: 1.1 mV at
  // 60 bpm became 5.0 mV at 130 and 9.8 mV at 180. R-wave voltage is not
  // rate-dependent, and 5 mV in a limb lead is twice the usual voltage criterion
  // for left ventricular hypertrophy.
  function renderedPeakMv(heartRateBpm: number): number {
    const generator = new EcgGenerator(
      { sampleRateHz: 500, rng: createRng(1, 'amplitude') },
      getRhythm('sinus').morphology,
    );
    const buffer = new Float32Array(500);
    let peak = -Infinity;
    for (let second = 0; second < 12; second += 1) {
      generator.advance(1, {
        heartRateBpm, rhythmId: 'sinus', respiratoryRateBpm: 13, anesthesiaDepthFraction: 0,
      }, buffer);
      // Skip the limit cycle's settling transient.
      if (second < 4) continue;
      for (const value of buffer) if (value > peak) peak = value;
    }
    return peak;
  }

  it('Scenario: the R wave is the same height at 40 and at 180 beats per minute', () => {
    const slow = renderedPeakMv(40);
    const fast = renderedPeakMv(180);
    // Within 25% across a four-and-a-half-fold change in rate.
    expect(Math.abs(fast - slow) / slow).toBeLessThan(0.25);
  });

  it('Scenario: the R wave stays inside a physiological voltage at every rate', () => {
    // Lead II R is about 1.0 to 1.5 mV. 2.6 mV in a limb lead is an LVH voltage
    // criterion, so nothing this generator draws for a normal heart may reach it.
    for (const rate of [40, 60, 72, 100, 130, 180]) {
      const peak = renderedPeakMv(rate);
      expect(peak, `R wave at ${rate} bpm is ${peak.toFixed(2)} mV`).toBeGreaterThan(0.7);
      expect(peak, `R wave at ${rate} bpm is ${peak.toFixed(2)} mV`).toBeLessThan(2.0);
    }
  });
});

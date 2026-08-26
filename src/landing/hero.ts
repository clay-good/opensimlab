/**
 * The landing hero (platform/landing → The Hero Is The Product Running).
 *
 * A real electrocardiogram from the project's own waveform generator, drawn in
 * `--ecg` — the only saturated colour on the page. It pulls in ONLY the waveform
 * generator and the canvas renderer: no scenario, no pharmacology model, no
 * cockpit code, so the landing route stays inside its own budget.
 */

import { EcgGenerator } from '@anesthesia/waveforms/ecg';
import { getRhythm } from '@anesthesia/waveforms/rhythms';
import { SAMPLE_RATE_HZ } from '@anesthesia/waveforms/types';
import { createRng } from '@platform/kernel/rng';
import { NEUTRAL, TRACE } from '@platform/tokens/tokens';

const HERO_SEED = 20260819;
const HERO_HEART_RATE = 68;
/** Pixels per second across the hero, matching the monitor's 25 mm/s. */
const PIXELS_PER_SECOND = 100;

/**
 * The millivolt window the hero's height maps onto, shared by the static path and
 * the live sweep so the two cannot drift apart. Chosen so the isoelectric line
 * sits at about a third of the way up and the R wave reaches about four fifths,
 * which is roughly where a monitor puts them.
 */
export const HERO_RANGE = { minMv: -0.9, maxMv: 1.6 } as const;

/** The hero's drawing box, in CSS pixels. The stylesheet matches it. */
export const HERO_WIDTH_PX = 720;
export const HERO_HEIGHT_PX = 200;

/**
 * Render one still frame of the trace as an SVG path.
 *
 * This is the reduced-motion and no-JavaScript fallback: the SAME generator, the
 * same seed, rendered once. It occupies the same box as the live canvas, so there
 * is no layout shift when the live version takes over.
 */
export function heroStaticPath(widthPx: number, heightPx: number): string {
  const seconds = widthPx / PIXELS_PER_SECOND;
  const generator = new EcgGenerator(
    { sampleRateHz: SAMPLE_RATE_HZ.ecg, rng: createRng(HERO_SEED, 'hero') },
    getRhythm('sinus').morphology,
  );
  const buffer = new Float32Array(SAMPLE_RATE_HZ.ecg);
  const samples: number[] = [];
  for (let second = 0; second < Math.ceil(seconds); second += 1) {
    generator.advance(1, {
      heartRateBpm: HERO_HEART_RATE, rhythmId: 'sinus',
      respiratoryRateBpm: 13, anesthesiaDepthFraction: 0,
    }, buffer);
    samples.push(...buffer);
  }
  const toY = (value: number): number => {
    const fraction = (value - HERO_RANGE.minMv) / (HERO_RANGE.maxMv - HERO_RANGE.minMv);
    const clamped = fraction < 0 ? 0 : fraction > 1 ? 1 : fraction;
    return heightPx - clamped * heightPx;
  };

  // MIN-MAX decimation, one column at a time — the same thing the sweep renderer
  // and the live hero do. Taking one nearest sample per column instead, which is
  // what an earlier version did, aliases: an R wave is only two or three samples
  // wide at 2.5 samples per column, so it was sometimes missed and sometimes
  // caught at full height, and the trace came out as an irregular picket fence
  // with no recognisable P or T wave between the spikes.
  const perColumn = SAMPLE_RATE_HZ.ecg / PIXELS_PER_SECOND;
  // Two CSS pixels per static column preserves the P-QRS-T silhouette at this
  // scale while keeping the server-rendered fallback comfortably inside the
  // landing transfer budget. The live canvas still paints at one-pixel density.
  const staticColumnWidth = 2;
  const points: string[] = [];
  for (let x = 0; x < widthPx; x += staticColumnWidth) {
    const from = Math.floor(x * perColumn);
    const to = Math.min(Math.floor((x + staticColumnWidth) * perColumn), samples.length);
    let low = Infinity;
    let high = -Infinity;
    for (let i = from; i < to; i += 1) {
      const value = samples[i] ?? 0;
      if (value < low) low = value;
      if (value > high) high = value;
    }
    if (low === Infinity) { low = 0; high = 0; }
    points.push(`${x === 0 ? 'M' : 'L'}${x} ${toY(high).toFixed(1)}`);
    if (low !== high) points.push(`L${x} ${toY(low).toFixed(1)}`);
  }
  return points.join(' ');
}

/** The static hero as a complete inline SVG. No image file is fetched. */
export function heroStaticSvg(widthPx = HERO_WIDTH_PX, heightPx = HERO_HEIGHT_PX): string {
  // `slice`, not `none`: stretching a 720 by 120 box into the 200 px-tall hero
  // was making every deflection two thirds taller than it should be, and on a
  // phone it squashed seven seconds of trace into 343 px so the heart looked
  // like it was going at 140. Preserving the aspect ratio and cropping shows
  // fewer beats at the right proportions, which is the correct trade.
  return `<svg viewBox="0 0 ${widthPx} ${heightPx}" width="100%" height="100%" preserveAspectRatio="xMinYMid slice" `
    + `role="img" aria-label="A normal electrocardiogram trace, drawn by this project's own waveform engine." `
    + `xmlns="http://www.w3.org/2000/svg">`
    + `<rect width="${widthPx}" height="${heightPx}" fill="${NEUTRAL.void}"/>`
    + `<path d="${heroStaticPath(widthPx, heightPx)}" fill="none" stroke="${TRACE.ecg.line}" stroke-width="1.5"/>`
    + '</svg>';
}

/** Drive a live sweeping hero on a canvas. Returns a stop function. */
export function startLiveHero(canvas: HTMLCanvasElement): () => void {
  // Transparent, so the static fallback shows through until the sweep arrives.
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return () => {};
  const generator = new EcgGenerator(
    { sampleRateHz: SAMPLE_RATE_HZ.ecg, rng: createRng(HERO_SEED, 'hero') },
    getRhythm('sinus').morphology,
  );
  const buffer = new Float32Array(Math.round(SAMPLE_RATE_HZ.ecg / 10));
  const pending: number[] = [];
  let cursor = 0;
  let lastY: number | null = null;
  let frame = 0;
  let lastTime = 0;
  let accumulator = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(Math.round(rect.width * dpr), 1);
    canvas.height = Math.max(Math.round(rect.height * dpr), 1);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Cleared to TRANSPARENT rather than filled, so the static trace underneath
    // shows through everywhere the sweep has not reached yet. The takeover is
    // then a column-by-column overwrite with no layout shift and no moment where
    // the box is blank — which is what "degrades to a still image" has to mean if
    // the live version is interrupted, as it is in a backgrounded tab.
    context.clearRect(0, 0, rect.width, rect.height);
    cursor = 0;
    lastY = null;
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  const loop = (time: number) => {
    const elapsed = lastTime === 0 ? 16.7 : time - lastTime;
    lastTime = time;
    const rect = canvas.getBoundingClientRect();

    // Generate in 100 ms blocks, exactly as the solver worker does.
    accumulator += elapsed;
    while (accumulator >= 100) {
      accumulator -= 100;
      generator.advance(0.1, {
        heartRateBpm: HERO_HEART_RATE, rhythmId: 'sinus',
        respiratoryRateBpm: 13, anesthesiaDepthFraction: 0,
      }, buffer);
      for (const sample of buffer) pending.push(sample);
    }

    const columns = Math.floor((elapsed / 1000) * PIXELS_PER_SECOND);
    const perColumn = SAMPLE_RATE_HZ.ecg / PIXELS_PER_SECOND;
    for (let column = 0; column < columns; column += 1) {
      if (pending.length < perColumn) break;
      const chunk = pending.splice(0, Math.floor(perColumn));
      context.fillStyle = NEUTRAL.void;
      context.fillRect(cursor, 0, 12, rect.height);
      let low = Infinity;
      let high = -Infinity;
      for (const value of chunk) { if (value < low) low = value; if (value > high) high = value; }
      const toY = (value: number) => {
        const fraction = (value - HERO_RANGE.minMv) / (HERO_RANGE.maxMv - HERO_RANGE.minMv);
        const clamped = fraction < 0 ? 0 : fraction > 1 ? 1 : fraction;
        return rect.height - clamped * rect.height;
      };
      context.strokeStyle = TRACE.ecg.line;
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(cursor, lastY ?? toY(high));
      context.lineTo(cursor, toY(high));
      context.lineTo(cursor, toY(low));
      context.stroke();
      lastY = toY(low);
      cursor += 1;
      if (cursor >= rect.width) { cursor = 0; lastY = null; }
    }
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
}

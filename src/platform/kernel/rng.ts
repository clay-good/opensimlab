/**
 * Deterministic pseudorandom generation.
 *
 * The engine must be free of wall-clock reads, `Date`, and unseeded randomness
 * (engine/pkpd-core → Fixed-Step Deterministic Integration). Every stochastic
 * term in the simulation draws from one of these, seeded from the session seed
 * recorded in the transcript, so the same seed reproduces the same trace exactly
 * (engine/physiology → Noise is seeded).
 */

/** A named, reproducible stream of pseudorandom numbers. */
export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform in [min, max). */
  uniform(min: number, max: number): number;
  /** Standard normal, Box-Muller with a cached second variate. */
  normal(): number;
  /** A fresh independent stream derived from this one plus a label. */
  fork(label: string): Rng;
}

/** FNV-1a over a string, used to turn a label into a 32-bit seed contribution. */
export function hashLabel(label: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < label.length; i += 1) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * sfc32 — a small, fast, well-distributed counter-based generator.
 * Chosen because it is trivially reimplementable, has no platform dependency,
 * and produces identical output on every device, which the bit-identical
 * replay requirement needs.
 */
export function createRng(seed: number, label = 'root'): Rng {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  let b = (seed ^ hashLabel(label)) >>> 0;
  let c = (seed + 0x6d2b79f5) >>> 0;
  let d = 1;
  let spare: number | null = null;

  const next = (): number => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };

  // Discard the first few outputs so nearby seeds decorrelate.
  for (let i = 0; i < 12; i += 1) next();

  const rng: Rng = {
    next,
    uniform: (min, max) => min + next() * (max - min),
    normal() {
      if (spare !== null) {
        const value = spare;
        spare = null;
        return value;
      }
      // Box-Muller. `u` is nudged off zero so the logarithm stays finite.
      const u = Math.max(next(), Number.EPSILON);
      const v = next();
      const radius = Math.sqrt(-2 * Math.log(u));
      const angle = 2 * Math.PI * v;
      spare = radius * Math.sin(angle);
      return radius * Math.cos(angle);
    },
    fork: (childLabel) => createRng((seed ^ hashLabel(childLabel)) >>> 0, `${label}/${childLabel}`),
  };
  return rng;
}

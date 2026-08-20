/**
 * Colour-vision-deficiency simulation and perceptual distance, used by the
 * confusion-line test that guards the colourblind-safe palette
 * (design/design-system → The colourblind-safe palette preserves distinguishability).
 *
 * The simulation uses the Viénot, Brettel and Mollon linear-RGB projection for
 * dichromacy. It is implemented from the published matrices; it is a test
 * instrument rather than a rendering path, so it never runs in the application.
 */

import { parseHex, type Rgb } from './tokens';

export type Dichromacy = 'deuteranopia' | 'protanopia' | 'tritanopia';

const toLinear = (value: number): number => {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const toSrgb = (value: number): number => {
  const clamped = Math.min(Math.max(value, 0), 1);
  const s = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return s * 255;
};

/** Linear-RGB projection matrices, row major. */
const MATRICES: Record<Dichromacy, readonly number[]> = {
  protanopia: [0.11238, 0.88762, 0.0, 0.11238, 0.88762, 0.0, 0.00401, -0.00401, 1.0],
  deuteranopia: [0.29275, 0.70725, 0.0, 0.29275, 0.70725, 0.0, -0.02234, 0.02234, 1.0],
  tritanopia: [1.0, 0.14461, -0.14461, 0.0, 0.85924, 0.14076, 0.0, 0.85924, 0.14076],
};

/** Simulate how a colour appears to a dichromatic observer. */
export function simulate(hex: string, kind: Dichromacy): Rgb {
  const { r, g, b } = parseHex(hex);
  const lin = [toLinear(r), toLinear(g), toLinear(b)];
  const m = MATRICES[kind];
  const out = [0, 1, 2].map((row) =>
    (m[row * 3] ?? 0) * (lin[0] ?? 0) + (m[row * 3 + 1] ?? 0) * (lin[1] ?? 0) + (m[row * 3 + 2] ?? 0) * (lin[2] ?? 0),
  );
  return { r: toSrgb(out[0] ?? 0), g: toSrgb(out[1] ?? 0), b: toSrgb(out[2] ?? 0) };
}

/** Convert sRGB 0-255 to CIE L*a*b* under D65. */
export function toLab({ r, g, b }: Rgb): { L: number; a: number; b: number } {
  const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b);
  const x = (0.4124 * rl + 0.3576 * gl + 0.1805 * bl) / 0.95047;
  const y = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
  const z = (0.0193 * rl + 0.1192 * gl + 0.9505 * bl) / 1.08883;
  const f = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/** CIE76 perceptual distance between two colours. */
export function deltaE(a: Rgb, b: Rgb): number {
  const la = toLab(a), lb = toLab(b);
  return Math.sqrt((la.L - lb.L) ** 2 + (la.a - lb.a) ** 2 + (la.b - lb.b) ** 2);
}

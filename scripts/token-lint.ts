/**
 * The token lint (design/design-system → A decorative hue fails review, and
 * Off-scale values fail lint).
 *
 * Fails the build, naming the file, the property, and the nearest valid token,
 * when source introduces:
 *   - a saturated colour outside the trace, alarm and focus token sets,
 *   - a spacing value outside the 4 px scale,
 *   - a corner radius outside the four permitted radii,
 *   - a transition duration longer than the longest motion token.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOTION, NEUTRAL, RADIUS, SIGNAL, SPACE, TRACE, TRACE_COLORBLIND_SAFE, TRACE_IDS,
} from '../src/platform/tokens/tokens.ts';

const root = fileURLToPath(new URL('..', import.meta.url));

/** Files that legitimately contain raw values because they define them. */
const EXEMPT = new Set([
  'src/platform/tokens/tokens.ts',
  'src/platform/tokens/tokens.generated.css',
  'src/platform/tokens/fonts.generated.css',
  'src/platform/tokens/cvd.ts',
  // Builds an rgba() string FROM the tokens at runtime rather than hard-coding one.
  'src/platform/render/renderer-colors.ts',
  'scripts/build-tokens.ts',
  'scripts/token-lint.ts',
]);

const allowedColors = new Set<string>();
for (const value of Object.values(NEUTRAL)) allowedColors.add(value.toLowerCase());
for (const id of TRACE_IDS) {
  allowedColors.add(TRACE[id].line.toLowerCase());
  allowedColors.add(TRACE[id].dim.toLowerCase());
  allowedColors.add(TRACE_COLORBLIND_SAFE[id].toLowerCase());
}
for (const value of Object.values(SIGNAL)) allowedColors.add(value.toLowerCase());
// Pure black, white and fully transparent are structural, not decorative.
for (const value of ['#000', '#fff', '#000000', '#ffffff']) allowedColors.add(value);

const spacingScale = new Set<number>(SPACE);
const radiusScale = new Set<number>(Object.values(RADIUS));
const longestMotion = Math.max(...Object.values(MOTION));

export interface Violation {
  readonly file: string;
  readonly line: number;
  readonly property: string;
  readonly value: string;
  readonly reason: string;
  readonly suggestion: string;
}

/** Nearest permitted value in a scale, for the "did you mean" message. */
function nearest(value: number, scale: Iterable<number>): number {
  let best = 0;
  let bestDistance = Infinity;
  for (const candidate of scale) {
    const distance = Math.abs(candidate - value);
    if (distance < bestDistance) { bestDistance = distance; best = candidate; }
  }
  return best;
}

/** Saturation of a hex colour, 0 for a grey. */
function saturation(hex: string): number {
  const full = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const r = Number.parseInt(full.slice(1, 3), 16) / 255;
  const g = Number.parseInt(full.slice(3, 5), 16) / 255;
  const b = Number.parseInt(full.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

const SPACING_PROPERTIES = /(margin|padding|gap|top|right|bottom|left|inset|width|height)/i;

export function lintSource(file: string, source: string): Violation[] {
  const violations: Violation[] = [];
  const lines = source.split('\n');

  lines.forEach((text, index) => {
    const line = index + 1;
    if (text.trimStart().startsWith('//') || text.trimStart().startsWith('*')) return;

    // Saturated colour literals.
    for (const match of text.matchAll(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/g)) {
      const value = match[0].toLowerCase();
      if (allowedColors.has(value)) continue;
      if (saturation(value) < 0.12) continue; // A neutral grey is chrome, not decoration.
      violations.push({
        file, line, property: 'color', value,
        reason: 'saturated colour outside the trace, alarm and focus token sets',
        suggestion: 'use a var(--ecg|--arterial|--capno|--spo2|--neuro|--alarm-*|--focus) token, or a neutral',
      });
    }
    for (const match of text.matchAll(/\b(?:rgb|hsl)a?\(([^)]*)\)/g)) {
      const inner = match[1] ?? '';
      const isTokenFill = TRACE_IDS.some((id) => TRACE[id].fill.includes(inner.replace(/\s/g, '')));
      const isSignalBg = Object.values(SIGNAL).some((v) => v.includes(inner.replace(/\s/g, '')));
      if (isTokenFill || isSignalBg) continue;
      const parts = inner.split(',').map((p) => Number.parseFloat(p));
      const [a, b, c] = parts;
      if (a !== undefined && b !== undefined && c !== undefined && a === b && b === c) continue;
      violations.push({
        file, line, property: 'color', value: match[0],
        reason: 'literal colour function outside the token sets',
        suggestion: 'reference the token variable instead',
      });
    }

    // Off-scale spacing.
    const declaration = /([a-z-]+)\s*:\s*([^;]+);/gi;
    for (const match of text.matchAll(declaration)) {
      const property = match[1] ?? '';
      const value = match[2] ?? '';
      if (value.includes('var(')) continue;

      if (/border-radius/i.test(property)) {
        for (const px of value.matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
          const number = Number.parseFloat(px[1] ?? '0');
          if (number === 0 || radiusScale.has(number)) continue;
          violations.push({
            file, line, property, value: `${number}px`,
            reason: 'corner radius outside the four permitted radii',
            suggestion: `--radius-* nearest is ${nearest(number, radiusScale)}px`,
          });
        }
        continue;
      }

      if (/transition|animation/i.test(property)) {
        for (const ms of value.matchAll(/(\d+(?:\.\d+)?)ms/g)) {
          const number = Number.parseFloat(ms[1] ?? '0');
          if (number <= longestMotion) continue;
          violations.push({
            file, line, property, value: `${number}ms`,
            reason: `transition longer than --motion-deliberate (${longestMotion}ms)`,
            suggestion: 'use --motion-micro, --motion-standard or --motion-deliberate',
          });
        }
        continue;
      }

      if (!SPACING_PROPERTIES.test(property)) continue;
      // Width and height often carry component sizes rather than spacing.
      if (/width|height/i.test(property)) continue;
      for (const px of value.matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
        const number = Math.abs(Number.parseFloat(px[1] ?? '0'));
        if (number === 0 || number === 1 || spacingScale.has(number)) continue;
        violations.push({
          file, line, property, value: `${number}px`,
          reason: 'spacing value outside the 4 px scale',
          suggestion: `--space-${SPACE.indexOf(nearest(number, spacingScale) as never) + 1} is ${nearest(number, spacingScale)}px`,
        });
      }
    }
  });

  return violations;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.css', '.ts', '.tsx'].includes(extname(full))) out.push(full);
  }
  return out;
}

export function lintProject(): Violation[] {
  const files = walk(join(root, 'src'));
  const violations: Violation[] = [];
  for (const file of files) {
    const rel = relative(root, file);
    if (EXEMPT.has(rel)) continue;
    violations.push(...lintSource(rel, readFileSync(file, 'utf8')));
  }
  return violations;
}

const isEntryPoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];

if (isEntryPoint) {
  const violations = lintProject();
  for (const v of violations) {
    process.stderr.write(`${v.file}:${v.line}  ${v.property}: ${v.value}\n    ${v.reason}\n    ${v.suggestion}\n`);
  }
  if (violations.length > 0) {
    process.stderr.write(`\ntoken-lint: ${violations.length} violation(s)\n`);
    process.exit(1);
  }
  process.stdout.write('token-lint: clean\n');
}

/**
 * Emit the CSS custom properties from the one token module.
 *
 * design/design-system → A token change propagates everywhere at once: editing a
 * value in `src/platform/tokens/tokens.ts` must reach CSS, canvas rendering, and
 * the component gallery with no other edit. This script is what makes that true.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ALARM_FLASH_HZ, BREAKPOINTS, CONTROL_HEIGHT, EASE, LAYOUT, MOTION, NEUTRAL, parseHex,
  RADIUS, SCRIM_OPACITY, SIGNAL, SPACE, TRACE, TRACE_COLORBLIND_SAFE, TYPE, TRACE_IDS,
} from '../src/platform/tokens/tokens.ts';

const lines: string[] = [
  '/* GENERATED FILE — do not edit.',
  ' * Produced by `npm run tokens` from src/platform/tokens/tokens.ts,',
  ' * which is the single source of truth for every design value.',
  ' */',
  '',
  ':root {',
];

const push = (name: string, value: string | number, comment?: string) => {
  lines.push(`  --${name}: ${value};${comment ? `  /* ${comment} */` : ''}`);
};

lines.push('  /* Neutral ramp — all interface chrome. */');
for (const [name, value] of Object.entries(NEUTRAL)) push(name, value);

lines.push('', '  /* Physiological traces — one of the three permitted uses of saturated colour. */');
for (const id of TRACE_IDS) {
  push(id, TRACE[id].line);
  push(`${id}-dim`, TRACE[id].dim);
  push(`${id}-fill`, TRACE[id].fill);
}

lines.push('', '  /* Alarm severity and the single focus accent. */');
for (const [name, value] of Object.entries(SIGNAL)) push(name, value);
const voidRgb = parseHex(NEUTRAL.void);
push('scrim', `rgba(${voidRgb.r}, ${voidRgb.g}, ${voidRgb.b}, ${SCRIM_OPACITY})`, 'the modal scrim: --void at 72%');

lines.push('', '  /* Alarm flash periods, derived from the IEC 60601-1-8 rate bands.');
lines.push('   * These are clinical signals at a standard-mandated rate, not interface');
lines.push('   * transitions, so they are not bound by the 280 ms motion ceiling. */');
for (const [priority, band] of Object.entries(ALARM_FLASH_HZ)) {
  if (band.nominal === 0) continue;
  push(`alarm-flash-${priority}-period`, `${Math.round(1000 / band.nominal)}ms`, `${band.nominal} Hz`);
}

lines.push('', '  /* Type scale. */');
for (const [name, style] of Object.entries(TYPE)) {
  push(`type-${name}`, `${style.weight} ${style.sizePx}px/${style.lineHeight} var(--font-ui)`);
  push(`type-${name}-tracking`, `${style.trackingEm}em`);
}

lines.push('', '  /* Spacing, radius, motion. */');
SPACE.forEach((value, index) => push(`space-${index + 1}`, `${value}px`));
for (const [name, value] of Object.entries(RADIUS)) push(`radius-${name}`, `${value}px`);
for (const [name, value] of Object.entries(MOTION)) push(`motion-${name}`, `${value}ms`);
push('ease', EASE);

lines.push('', '  /* Layout. */');
push('status-bar-height', `${LAYOUT.statusBarHeightPx}px`);
push('status-bar-height-compact', `${LAYOUT.statusBarCompactHeightPx}px`);
// Fluid by default, bounded, and overridable by the learner at runtime.
push('action-cockpit-height', `clamp(${LAYOUT.actionCockpitMinPx}px, `
  + `${(LAYOUT.actionCockpitViewportShare * 100).toFixed(0)}dvh, ${LAYOUT.actionCockpitMaxPx}px)`);
push('divider-thickness', `${LAYOUT.dividerThicknessPx}px`);
push('divider-hit', `${LAYOUT.dividerHitTargetPx}px`);
push('alarm-rail-height', `${LAYOUT.alarmRailHeightPx}px`);
push('max-content-width', `${LAYOUT.maxContentWidthPx}px`);
push('control-height', `${CONTROL_HEIGHT.comfortable}px`);
push('font-ui', "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif");
push('font-mono', "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace");

lines.push('}', '');

lines.push('/* Accessibility modifier: the colourblind-safe trace palette. It overrides');
lines.push(' * only the affected tokens; the layout, type, spacing and component');
lines.push(' * structure are unchanged and the theme is still Theater Dark. */');
lines.push('[data-trace-palette="colorblind-safe"] {');
for (const id of TRACE_IDS) push(id, TRACE_COLORBLIND_SAFE[id]);
lines.push('}', '');

lines.push('/* Accessibility modifier: contrast boost. */');
lines.push('[data-contrast="boost"] {');
push('text-secondary', '#C6D2E0');
push('text-tertiary', '#B4C1D0');
push('line', '#4A586B');
lines.push('}', '');

lines.push('/* Compact density steps control height and panel padding, using scale values only. */');
lines.push('[data-density="compact"] {');
push('control-height', `${CONTROL_HEIGHT.compact}px`);
lines.push('}', '');

lines.push('/* Reduced motion collapses every transition duration to zero. Waveform');
lines.push(' * rendering is not a transition and is handled by the renderer. */');
lines.push('@media (prefers-reduced-motion: reduce) {');
lines.push('  :root {');
for (const name of Object.keys(MOTION)) push(`motion-${name}`, '0ms');
lines.push('  }');
lines.push('}', '');

lines.push('/* Breakpoints are documented here and used through these exact values. */');
for (const [name, value] of Object.entries(BREAKPOINTS)) {
  lines.push(`/* ${name}: ${value}px */`);
}
lines.push('');

const target = fileURLToPath(new URL('../src/platform/tokens/tokens.generated.css', import.meta.url));
writeFileSync(target, lines.join('\n'), 'utf8');

/**
 * The @font-face rules are generated rather than hand-written, because the `src`
 * URL may only appear once the file it names actually exists. Referencing a font
 * that is not there makes the browser download the single-page fallback and fail
 * to parse it as a font, which is noise in every learner's console.
 *
 * `docs/fonts.md` records the subsetting procedure that produces these files.
 */
const root = fileURLToPath(new URL('..', import.meta.url));
const FACES = [
  {
    family: 'Inter', file: 'inter-latin.woff2', weight: '400 700',
    // Basic Latin, Latin-1 Supplement, Latin Extended-A, and the punctuation and
    // symbols the interface actually uses.
    range: 'U+0000-00FF, U+0100-017F, U+0131, U+0152-0153, U+02BB-02BC, '
      + 'U+2000-206F, U+2070-209F, U+20A0-20BF, U+2122, U+2190-2193, U+2212, U+2215',
  },
  {
    family: 'JetBrains Mono', file: 'jetbrains-mono-latin.woff2', weight: '400 600',
    range: 'U+0000-00FF, U+2000-206F, U+2212',
  },
];

const fontLines: string[] = [
  '/* GENERATED FILE — do not edit. Produced by `npm run tokens`.',
  ' *',
  ' * Self-hosted type only. Nothing is fetched from a font service: the privacy',
  ' * architecture forbids any request to a foreign origin, and a font CDN is',
  ' * exactly that. `font-display: swap` so text is never invisible while a face',
  ' * loads, and both families have a complete platform fallback stack.',
  ' */',
  '',
];

let vendored = 0;
for (const face of FACES) {
  const present = existsSync(join(root, 'public', 'fonts', face.file));
  if (present) vendored += 1;
  const sources = present
    ? `local('${face.family}'), url('/fonts/${face.file}') format('woff2')`
    : `local('${face.family}')`;
  fontLines.push(
    present
      ? `/* ${face.file} is vendored. */`
      : `/* ${face.file} is NOT vendored, so ${face.family} falls through to the platform`,
    present ? '' : ' * system stack. See docs/fonts.md for the subsetting procedure. */',
    '@font-face {',
    `  font-family: '${face.family}';`,
    '  font-style: normal;',
    `  font-weight: ${face.weight};`,
    '  font-display: swap;',
    `  src: ${sources};`,
    `  unicode-range: ${face.range};`,
    '}',
    '',
  );
}

const fontsTarget = fileURLToPath(new URL('../src/platform/tokens/fonts.generated.css', import.meta.url));
writeFileSync(fontsTarget, fontLines.filter((line) => line !== '' || true).join('\n'), 'utf8');

process.stdout.write(`tokens: wrote ${target}\n`);
process.stdout.write(`tokens: wrote font faces, ${vendored} of ${FACES.length} families vendored\n`);

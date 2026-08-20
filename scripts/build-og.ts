/**
 * Build-time social preview images (platform/discoverability → Social Previews).
 *
 * Generated from the design tokens and the route's own title, with no manual asset
 * step. They are SVG at 1200 by 630, which is a few hundred bytes each rather
 * than a few hundred kilobytes, and the application itself never fetches them, so
 * they cost the download budget nothing.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NEUTRAL, TRACE, TYPE } from '../src/platform/tokens/tokens.ts';
import { ROUTES } from '../src/routes/routes.ts';
import { heroStaticPath } from '../src/landing/hero.ts';

const WIDTH = 1200;
const HEIGHT = 630;

const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Wrap text into lines of at most `perLine` characters. */
function wrap(text: string, perLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((`${current} ${word}`).trim().length > perLine) { lines.push(current.trim()); current = word; }
    else current = `${current} ${word}`;
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

export function ogImage(subject: string, description: string): string {
  const titleSize = TYPE['vital-l']?.sizePx ?? 40;
  const bodySize = TYPE.subtitle?.sizePx ?? 16;
  const titleLines = wrap(subject, 34);
  const bodyLines = wrap(description, 74).slice(0, 3);
  // A real trace from the project's own generator: the same hero, in Theater Dark.
  const trace = heroStaticPath(WIDTH, 140);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${NEUTRAL['surface-0']}"/>`,
    `<rect x="0" y="${HEIGHT - 200}" width="${WIDTH}" height="200" fill="${NEUTRAL.void}"/>`,
    `<g transform="translate(0 ${HEIGHT - 175})">`,
    `<path d="${trace}" fill="none" stroke="${TRACE.ecg.line}" stroke-width="3"/>`,
    '</g>',
    `<text x="72" y="130" font-family="Inter, system-ui, sans-serif" font-size="${bodySize * 1.4}" `
      + `letter-spacing="2" fill="${NEUTRAL['text-tertiary']}">OPEN SIM LAB</text>`,
    ...titleLines.map((line, index) =>
      `<text x="72" y="${210 + index * (titleSize * 1.2)}" font-family="Inter, system-ui, sans-serif" `
      + `font-size="${titleSize}" font-weight="600" fill="${NEUTRAL['text-primary']}">${escape(line)}</text>`),
    ...bodyLines.map((line, index) =>
      `<text x="72" y="${230 + titleLines.length * (titleSize * 1.2) + index * (bodySize * 1.7)}" `
      + `font-family="Inter, system-ui, sans-serif" font-size="${bodySize * 1.35}" `
      + `fill="${NEUTRAL['text-secondary']}">${escape(line)}</text>`),
    '</svg>',
  ].join('');
}

/** The application icons, likewise generated from the tokens. */
export function iconSvg(size: number, maskable: boolean): string {
  const inset = maskable ? size * 0.1 : 0;
  const inner = size - inset * 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" fill="${NEUTRAL.void}"/>`,
    `<g transform="translate(${inset} ${inset})">`,
    // A single QRS complex, drawn from the token palette.
    `<path d="M0 ${inner * 0.6} L${inner * 0.28} ${inner * 0.6} L${inner * 0.34} ${inner * 0.68} `
      + `L${inner * 0.44} ${inner * 0.12} L${inner * 0.54} ${inner * 0.82} L${inner * 0.6} ${inner * 0.6} `
      + `L${inner} ${inner * 0.6}" fill="none" stroke="${TRACE.ecg.line}" `
      + `stroke-width="${Math.max(size * 0.05, 2)}" stroke-linejoin="round" stroke-linecap="round"/>`,
    '</g></svg>',
  ].join('');
}

function main(): void {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const ogDir = join(root, 'public', 'og');
  mkdirSync(ogDir, { recursive: true });

  for (const route of ROUTES) {
    const name = route.path === '/' ? 'index' : route.path.replace(/^\//, '').replace(/\//g, '-');
    writeFileSync(join(ogDir, `${name}.svg`), ogImage(route.heading, route.description), 'utf8');
  }

  writeFileSync(join(root, 'public', 'icon-192.svg'), iconSvg(192, false), 'utf8');
  writeFileSync(join(root, 'public', 'icon-512.svg'), iconSvg(512, false), 'utf8');
  writeFileSync(join(root, 'public', 'icon-maskable.svg'), iconSvg(512, true), 'utf8');

  process.stdout.write(`og: wrote ${ROUTES.length} preview images and 3 icons\n`);
}

const isEntryPoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) main();

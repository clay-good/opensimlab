/**
 * Build-time social preview images (platform/discoverability → Social Previews).
 *
 * Generated from the design tokens and the route's own title, with no manual asset
 * step. Each is drawn as SVG at 1200 by 630 and then rasterised to PNG.
 *
 * The PNG is the one that ships in `og:image`. No major crawler or link preview
 * scraper renders SVG — Google, Facebook, LinkedIn, X, Slack and iMessage all
 * accept PNG, JPEG and WebP and nothing else — so every shared link resolved to a
 * card with no image at all for as long as the tag named the `.svg`. The SVG is
 * still written beside it as the source the PNG is drawn from.
 *
 * The application itself never fetches either, so they cost the download budget
 * nothing.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
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

/**
 * The sans face the previews are lettered in.
 *
 * One named file rather than the whole system font stack. `loadSystemFonts`
 * rescans every font on the machine for each image, which costs 909 ms against
 * 108 ms for a single file — across 270 images that is four minutes of build
 * time to arrive at the same picture. The list is tried in order and the first
 * file present wins; where none is, the scan is the fallback and still correct,
 * only slow.
 */
const SANS_CANDIDATES = [
  '/System/Library/Fonts/Helvetica.ttc',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
];
const sansFile = SANS_CANDIDATES.find((path) => existsSync(path));
const FONT_OPTIONS = sansFile
  ? { loadSystemFonts: false, fontFiles: [sansFile], defaultFontFamily: 'sans-serif' }
  : { loadSystemFonts: true, defaultFontFamily: 'sans-serif' };

/**
 * Rasterise one preview image.
 *
 * Text is drawn with the host's own fonts. The vendored interface face is WOFF2,
 * which the renderer does not decode — handed it, it silently drops every glyph
 * and returns a picture of the ECG trace with no words on it. So a system face
 * does the drawing, and `renderedGlyphCount` proves it did: a machine with no
 * usable sans face fails the build here rather than publishing 270 blank cards,
 * which is the failure nobody would have noticed.
 */
function rasterise(svg: string): Buffer {
  const image = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: FONT_OPTIONS,
  }).render();
  const png = image.asPng();
  if (renderedGlyphCount(image.pixels, image.width, image.height) < MINIMUM_GLYPH_PIXELS) {
    throw new Error(
      'og: the preview rendered without text. No usable sans-serif font was found on this '
      + 'machine, and a preview image with no words on it is worse than none. Install a '
      + 'system font (on a bare Linux image, `fonts-dejavu-core`) and rebuild.',
    );
  }
  return png;
}

/** How many pixels in the title band are neither background nor the trace green. */
const MINIMUM_GLYPH_PIXELS = 500;
function renderedGlyphCount(pixels: Buffer, width: number, height: number): number {
  // The band holding the title and the body copy, above the trace panel.
  const top = Math.round(height * 0.15);
  const bottom = Math.round(height * 0.6);
  let count = 0;
  for (let y = top; y < bottom; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      const [r, g, b] = [pixels[at] ?? 0, pixels[at + 1] ?? 0, pixels[at + 2] ?? 0];
      // Text is the only light ink in this band; the ground is near-black.
      if (r > 90 && g > 90 && b > 90) count += 1;
    }
  }
  return count;
}

function main(): void {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const ogDir = join(root, 'public', 'og');
  mkdirSync(ogDir, { recursive: true });

  for (const route of ROUTES) {
    const name = route.path === '/' ? 'index' : route.path.replace(/^\//, '').replace(/\//g, '-');
    const svg = ogImage(route.heading, route.description);
    writeFileSync(join(ogDir, `${name}.svg`), svg, 'utf8');
    writeFileSync(join(ogDir, `${name}.png`), rasterise(svg));
  }

  writeFileSync(join(root, 'public', 'icon-192.svg'), iconSvg(192, false), 'utf8');
  writeFileSync(join(root, 'public', 'icon-512.svg'), iconSvg(512, false), 'utf8');
  writeFileSync(join(root, 'public', 'icon-maskable.svg'), iconSvg(512, true), 'utf8');

  process.stdout.write(`og: wrote ${ROUTES.length} preview images as SVG and PNG, and 3 icons\n`);
}

const isEntryPoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) main();

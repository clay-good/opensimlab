/** Acceptance tests for design/design-system → Typography. */
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  REQUIRED_FONT_LICENSES, REQUIRED_FONTS, checkFonts, listFonts,
} from '../../scripts/check-fonts';
import { ROUTES } from '@routes/routes';

const root = process.cwd();
const fontDir = join(root, 'public', 'fonts');
const fileHashes: Readonly<Record<string, string>> = {
  'open-sim-lab-inter-latin.woff2': '7dfb5ab2e136df8836db217661ed52d35dadfad389866e8291e9e3cb9dbac556',
  'jetbrains-mono-latin.woff2': '26f4a0765a0e74540276a94e0e817892f27f39b4ed63e4926ccdc74caddb3bc3',
  'inter-OFL.txt': '262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a',
  'jetbrains-mono-OFL.txt': '30f0c136e3c88e422d0791acd97238870f9054a9729bc34cf2ff0d4ed8cac4ad',
};

describe('Requirement: Exactly Two Self-Hosted Variable Font Families', () => {
  it('ships the inspected WOFF2 subsets and their distinct licenses', () => {
    const files = listFonts(fontDir);
    expect(files.filter((file) => file.endsWith('.woff2')).sort())
      .toEqual(REQUIRED_FONTS.map((font) => font.file).sort());

    for (const font of REQUIRED_FONTS) {
      const bytes = readFileSync(join(fontDir, font.file));
      expect(bytes.subarray(0, 4).toString('ascii')).toBe('wOF2');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(fileHashes[font.file]);
    }

    for (const license of REQUIRED_FONT_LICENSES) {
      const text = readFileSync(join(fontDir, license.file), 'utf8');
      expect(text).toContain(license.copyright);
      expect(text).toContain('SIL OPEN FONT LICENSE Version 1.1');
      expect(createHash('sha256').update(text).digest('hex')).toBe(fileHashes[license.file]);
    }
  });

  it('keeps the combined transfer inside the 120 KB font budget', () => {
    const report = checkFonts(fontDir);
    expect(report.missing).toEqual([]);
    expect(report.missingLicenses).toEqual([]);
    expect(report.invalid).toEqual([]);
    expect(report.withinBudget).toBe(true);
  });

  it('rejects missing, malformed, and oversized font payloads', () => {
    const missing = checkFonts(join(root, 'public/fonts-does-not-exist'));
    expect(missing.missing).toEqual(REQUIRED_FONTS.map((font) => font.file));
    expect(missing.missingLicenses).toEqual(REQUIRED_FONT_LICENSES.map((license) => license.file));

    const fixture = mkdtempSync(join(tmpdir(), 'opensimlab-font-check-'));
    try {
      writeFileSync(join(fixture, REQUIRED_FONTS[0].file), Buffer.from('not a font'));
      writeFileSync(
        join(fixture, REQUIRED_FONTS[1].file),
        Buffer.concat([Buffer.from('wOF2'), randomBytes(130 * 1024)]),
      );
      for (const license of REQUIRED_FONT_LICENSES) {
        writeFileSync(
          join(fixture, license.file),
          `${license.copyright}\nSIL OPEN FONT LICENSE Version 1.1`,
        );
      }
      const report = checkFonts(fixture);
      expect(report.invalid).toContain(REQUIRED_FONTS[0].file);
      expect(report.withinBudget).toBe(false);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('declares only same-origin vendored sources with swap and variable weights', () => {
    const css = readFileSync(join(root, 'src/platform/tokens/fonts.generated.css'), 'utf8');
    expect(css.match(/@font-face/g)).toHaveLength(2);
    expect(css).toContain("font-family: 'Open Sim Lab Inter'");
    expect(css).toContain("url('/fonts/open-sim-lab-inter-latin.woff2') format('woff2')");
    expect(css).toContain("url('/fonts/jetbrains-mono-latin.woff2') format('woff2')");
    expect(css).not.toContain('src: local(');
    expect(css.match(/font-display: swap;/g)).toHaveLength(2);
    expect(css).toContain('font-weight: 400 700');
    expect(css).toContain('font-weight: 400 600');
    expect(css).toContain('U+2070-209F, U+2190-2193, U+2212');
  });
});

describe('Scenario: Fonts Load Without A Foreign Request', () => {
  it('preloads interface text and leaves the cockpit-only mono face on demand', () => {
    for (const route of ROUTES) {
      const htmlPath = route.path === '/'
        ? join(root, 'dist/index.html')
        : join(root, 'dist', route.path.slice(1), 'index.html');
      const html = readFileSync(htmlPath, 'utf8');
      expect(html).toContain(
        '<link rel="preload" href="/fonts/open-sim-lab-inter-latin.woff2" as="font" type="font/woff2" crossorigin',
      );
      expect(html).not.toContain('<link rel="preload" href="/fonts/jetbrains-mono-latin.woff2"');
      expect(html).not.toMatch(/(?:fonts\.googleapis|fonts\.gstatic|use\.typekit)\.com/);
    }
  });
});

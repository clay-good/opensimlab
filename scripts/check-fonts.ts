/**
 * The font budget (design/design-system → Fonts load offline and never block
 * first paint: the Latin subsets together add no more than 120 KB compressed).
 *
 * Missing, malformed, or unlicensed files fail the check. A budget that passes
 * because nothing is there is worse than no budget at all.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

export const FONT_BUDGET_BYTES = 120 * 1024;

/** The faces the interface declares. Both must be vendored before release. */
export const REQUIRED_FONTS = [
  {
    file: 'open-sim-lab-inter-latin.woff2',
    family: 'Open Sim Lab Inter',
    use: 'All interface text and numerics; an OFL-compliant renamed subset of Inter.',
  },
  { file: 'jetbrains-mono-latin.woff2', family: 'JetBrains Mono', use: 'The event log and tabular code.' },
] as const;

export const REQUIRED_FONT_LICENSES = [
  { file: 'inter-OFL.txt', copyright: 'Copyright (c) 2016 The Inter Project Authors' },
  { file: 'jetbrains-mono-OFL.txt', copyright: 'Copyright 2020 The JetBrains Mono Project Authors' },
] as const;

export interface FontReport {
  readonly present: readonly { file: string; bytes: number; compressedBytes: number }[];
  readonly missing: readonly string[];
  readonly invalid: readonly string[];
  readonly missingLicenses: readonly string[];
  readonly totalCompressedBytes: number;
  readonly withinBudget: boolean;
}

export function checkFonts(directory: string): FontReport {
  const present: { file: string; bytes: number; compressedBytes: number }[] = [];
  const missing: string[] = [];
  const invalid: string[] = [];
  const missingLicenses: string[] = [];

  for (const font of REQUIRED_FONTS) {
    const path = join(directory, font.file);
    if (!existsSync(path)) { missing.push(font.file); continue; }
    const bytes = readFileSync(path);
    if (bytes.subarray(0, 4).toString('ascii') !== 'wOF2') invalid.push(font.file);
    present.push({
      file: font.file,
      bytes: bytes.length,
      // woff2 is already compressed; gzip measures what the transfer actually costs.
      compressedBytes: gzipSync(bytes, { level: 9 }).length,
    });
  }

  for (const license of REQUIRED_FONT_LICENSES) {
    const path = join(directory, license.file);
    if (!existsSync(path)) { missingLicenses.push(license.file); continue; }
    const text = readFileSync(path, 'utf8');
    if (!text.includes(license.copyright) || !text.includes('SIL OPEN FONT LICENSE Version 1.1')) {
      invalid.push(license.file);
    }
  }

  const total = present.reduce((sum, entry) => sum + entry.compressedBytes, 0);
  return {
    present, missing, invalid, missingLicenses,
    totalCompressedBytes: total,
    withinBudget: total <= FONT_BUDGET_BYTES,
  };
}

function main(): void {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const directory = join(root, 'public', 'fonts');
  const report = checkFonts(directory);

  for (const entry of report.present) {
    process.stdout.write(`  ${entry.file}: ${(entry.compressedBytes / 1024).toFixed(1)} KB compressed\n`);
  }
  const missing = [...report.missing, ...report.missingLicenses];
  if (missing.length > 0 || report.invalid.length > 0) {
    if (missing.length > 0) process.stderr.write(`check-fonts: FAIL — missing ${missing.join(', ')}\n`);
    if (report.invalid.length > 0) {
      process.stderr.write(`check-fonts: FAIL — invalid ${report.invalid.join(', ')}\n`);
    }
    process.exit(1);
  }
  const total = (report.totalCompressedBytes / 1024).toFixed(1);
  if (!report.withinBudget) {
    process.stderr.write(`check-fonts: FAIL — ${total} KB compressed, budget ${FONT_BUDGET_BYTES / 1024} KB\n`);
    process.exit(1);
  }
  process.stdout.write(`check-fonts: ok — ${total} KB of ${FONT_BUDGET_BYTES / 1024} KB\n`);
}

/** Unused import guard for the directory listing helper used by tests. */
export function listFonts(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((entry) => statSync(join(directory, entry)).isFile());
}

const isEntryPoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) main();

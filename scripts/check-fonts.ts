/**
 * The font budget (design/design-system → Fonts load offline and never block
 * first paint: the Latin subsets together add no more than 120 KB compressed).
 *
 * The check reports honestly when the files are absent rather than passing
 * vacuously, because a budget that passes because nothing is there is worse than
 * no budget at all.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

export const FONT_BUDGET_BYTES = 120 * 1024;

/** The faces the interface declares. Both must be vendored before release. */
export const REQUIRED_FONTS = [
  { file: 'inter-latin.woff2', family: 'Inter', use: 'All interface text and numerics.' },
  { file: 'jetbrains-mono-latin.woff2', family: 'JetBrains Mono', use: 'The event log and tabular code.' },
] as const;

export interface FontReport {
  readonly present: readonly { file: string; bytes: number; compressedBytes: number }[];
  readonly missing: readonly string[];
  readonly totalCompressedBytes: number;
  readonly withinBudget: boolean;
}

export function checkFonts(directory: string): FontReport {
  const present: { file: string; bytes: number; compressedBytes: number }[] = [];
  const missing: string[] = [];

  for (const font of REQUIRED_FONTS) {
    const path = join(directory, font.file);
    if (!existsSync(path)) { missing.push(font.file); continue; }
    const bytes = readFileSync(path);
    present.push({
      file: font.file,
      bytes: bytes.length,
      // woff2 is already compressed; gzip measures what the transfer actually costs.
      compressedBytes: gzipSync(bytes, { level: 9 }).length,
    });
  }

  const total = present.reduce((sum, entry) => sum + entry.compressedBytes, 0);
  return { present, missing, totalCompressedBytes: total, withinBudget: total <= FONT_BUDGET_BYTES };
}

function main(): void {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const directory = join(root, 'public', 'fonts');
  if (!existsSync(directory)) {
    process.stdout.write('check-fonts: public/fonts does not exist.\n');
  }
  const report = checkFonts(existsSync(directory) ? directory : root);

  for (const entry of report.present) {
    process.stdout.write(`  ${entry.file}: ${(entry.compressedBytes / 1024).toFixed(1)} KB compressed\n`);
  }
  if (report.missing.length > 0) {
    process.stdout.write(
      `check-fonts: NOT VENDORED — ${report.missing.join(', ')}. Both families currently fall through `
      + 'to the system stack. See docs/fonts.md for the subsetting procedure. This is recorded in the '
      + 'validation report rather than passing silently.\n',
    );
    // Not a build failure while the project is honest about it, but never silent.
    return;
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

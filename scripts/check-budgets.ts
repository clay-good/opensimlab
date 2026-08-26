/**
 * The continuous integration budget gate
 * (platform/offline-pwa → Budget is enforced in continuous integration,
 * platform/landing → The Landing Route Has Its Own Budget).
 *
 * Fails the build and reports the largest contributors when a change pushes a
 * bundle past its budget.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

/** Compressed budgets, in bytes. */
export const BUDGETS = {
  /** Everything needed to reach an interactive cockpit. */
  interactive: 1.625 * 1024 * 1024,
  /** The complete offline bundle, every scenario included. */
  fullBundle: 8 * 1024 * 1024,
  /** The landing route, budgeted separately so it never pulls in the simulator. */
  landing: 150 * 1024,
} as const;

interface Asset { readonly path: string; readonly rawBytes: number; readonly gzipBytes: number }

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

export function measure(): Asset[] {
  return walk(dist).map((file) => {
    const bytes = readFileSync(file);
    return {
      path: relative(dist, file),
      rawBytes: bytes.length,
      gzipBytes: gzipSync(bytes, { level: 9 }).length,
    };
  });
}

const format = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;

function main(): void {
  let assets: Asset[];
  try {
    assets = measure();
  } catch {
    process.stderr.write('check-budgets: no dist/ directory. Run `npm run build` first.\n');
    process.exit(1);
  }

  // The landing route's own weight: its HTML, its CSS, and the entry chunks it
  // actually loads. It must not pull in the simulator bundle.
  const landing = assets.filter((asset) =>
    asset.path === 'index.html'
    || (/^assets\//.test(asset.path) && /landing|index/.test(asset.path))
    || extname(asset.path) === '.css'
    || extname(asset.path) === '.woff2');
  const landingBytes = landing.reduce((sum, asset) => sum + asset.gzipBytes, 0);

  // Everything needed to reach an interactive cockpit: all scripts, styles and fonts.
  const interactive = assets.filter((asset) => ['.js', '.css', '.woff2', '.html'].includes(extname(asset.path)));
  const interactiveBytes = interactive.reduce((sum, asset) => sum + asset.gzipBytes, 0);

  const fullBytes = assets.reduce((sum, asset) => sum + asset.gzipBytes, 0);

  const checks: [string, number, number, Asset[]][] = [
    ['landing route', landingBytes, BUDGETS.landing, landing],
    ['interactive cockpit', interactiveBytes, BUDGETS.interactive, interactive],
    ['full offline bundle', fullBytes, BUDGETS.fullBundle, assets],
  ];

  let failed = false;
  for (const [name, actual, budget, contributors] of checks) {
    const status = actual <= budget ? 'ok  ' : 'FAIL';
    process.stdout.write(`${status} ${name.padEnd(22)} ${format(actual).padStart(10)} / ${format(budget)}\n`);
    if (actual > budget) {
      failed = true;
      process.stderr.write(`\n  largest contributors to ${name}:\n`);
      for (const asset of [...contributors].sort((a, b) => b.gzipBytes - a.gzipBytes).slice(0, 10)) {
        process.stderr.write(`    ${format(asset.gzipBytes).padStart(10)}  ${asset.path}\n`);
      }
      process.stderr.write('\n');
    }
  }

  if (failed) process.exit(1);
  process.stdout.write('check-budgets: all budgets met\n');
}

const isEntryPoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) main();

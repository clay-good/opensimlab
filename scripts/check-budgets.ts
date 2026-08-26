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
interface ManifestChunk {
  readonly file: string;
  readonly imports?: readonly string[];
  readonly css?: readonly string[];
  readonly assets?: readonly string[];
}
type BuildManifest = Readonly<Record<string, ManifestChunk>>;

const ENTRY = 'index.html';
const COCKPIT_ROUTE = 'src/routes/AnesthesiaRoute.tsx';

/** Resolve only static imports. Dynamic sibling routes are not part of this load. */
export function manifestAssetPaths(
  manifest: BuildManifest,
  entryKeys: readonly string[],
): ReadonlySet<string> {
  const paths = new Set<string>();
  const visited = new Set<string>();

  const visit = (key: string): void => {
    if (visited.has(key)) return;
    visited.add(key);
    const chunk = manifest[key];
    if (!chunk) throw new Error(`build manifest is missing ${key}`);
    paths.add(chunk.file);
    for (const path of chunk.css ?? []) paths.add(path);
    for (const path of chunk.assets ?? []) paths.add(path);
    for (const dependency of chunk.imports ?? []) visit(dependency);
  };

  for (const key of entryKeys) visit(key);
  return paths;
}

function fontPreloads(html: string): readonly string[] {
  return [...html.matchAll(/href="\/(fonts\/[^"?]+\.woff2)"[^>]*rel="preload"|rel="preload"[^>]*href="\/(fonts\/[^"?]+\.woff2)"/g)]
    .map((match) => match[1] ?? match[2])
    .filter((path): path is string => path !== undefined);
}

function largestCockpitDocument(assets: readonly Asset[]): Asset | undefined {
  return assets
    .filter((asset) => /^(?:anesthesia|emergency-medicine|critical-care|cardiology|respiratory-medicine|pediatrics|neurology|toxicology)\/scenario\/[^/]+\/index\.html$/.test(asset.path))
    .sort((a, b) => b.gzipBytes - a.gzipBytes)[0];
}

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
  let manifest: BuildManifest;
  try {
    assets = measure();
    manifest = JSON.parse(readFileSync(join(dist, '.vite', 'manifest.json'), 'utf8')) as BuildManifest;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`check-budgets: ${message}. Run \`npm run build\` first.\n`);
    process.exit(1);
  }

  const byPath = new Map(assets.map((asset) => [asset.path, asset]));
  const landingPaths = new Set(manifestAssetPaths(manifest, [ENTRY]));
  landingPaths.add('index.html');
  for (const font of fontPreloads(readFileSync(join(dist, 'index.html'), 'utf8'))) landingPaths.add(font);
  const landing = [...landingPaths].map((path) => {
    const asset = byPath.get(path);
    if (!asset) throw new Error(`landing graph references missing ${path}`);
    return asset;
  });
  const landingBytes = landing.reduce((sum, asset) => sum + asset.gzipBytes, 0);

  // The entry, selected clinical route, its static imports, the solver it starts,
  // both cockpit fonts, and the largest direct scenario document. Lazy sibling
  // routes remain covered by the separate complete-offline ceiling.
  const interactivePaths = new Set(manifestAssetPaths(manifest, [ENTRY, COCKPIT_ROUTE]));
  for (const asset of assets) {
    if (/^assets\/solver\.worker-[^/]+\.js$/.test(asset.path) || extname(asset.path) === '.woff2') {
      interactivePaths.add(asset.path);
    }
  }
  const cockpitDocument = largestCockpitDocument(assets) ?? byPath.get('index.html');
  if (cockpitDocument) interactivePaths.add(cockpitDocument.path);
  const interactive = [...interactivePaths].map((path) => {
    const asset = byPath.get(path);
    if (!asset) throw new Error(`cockpit graph references missing ${path}`);
    return asset;
  });
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

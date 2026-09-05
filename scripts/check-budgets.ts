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
  /**
   * What a first visit downloads before the service worker reports ready: the
   * precached scripts, styles and fonts, compressed.
   *
   * This is the tightest ceiling in the project and the one that decides whether
   * another lesson can ship. It is enforced by tests/unit/offline.test.ts, whose
   * comment block is the decision log for every time it has bound; the number
   * lives here so `npm run budget` reports it alongside the others rather than
   * leaving the binding constraint visible only inside a unit test.
   */
  precache: 2 * 1024 * 1024,
  /**
   * The social preview images, raw.
   *
   * They are budgeted apart from the offline bundle rather than inside it. A
   * crawler fetches one; the application never fetches any, so they are not part
   * of what a learner downloads and counting them against the offline ceiling
   * measured the wrong thing. That went unnoticed while they were SVG and gzipped
   * to almost nothing. As PNG — which is the only format a link preview actually
   * renders — they are real bytes, and they get their own ceiling instead of
   * quietly consuming the one that decides whether another scenario can ship.
   */
  previewImages: 20 * 1024 * 1024,
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
// Each clinical module is its own lazily loaded chunk, so a learner downloads
// one module's catalogue rather than all thirteen. Anesthesia is the heaviest
// (39 scenarios) and the default landing module, so it is the honest worst case
// for "what it costs to start practising".
const COCKPIT_ROUTE = 'src/routes/modules/anesthesia.tsx';

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

export function largestCockpitDocument(assets: readonly Asset[]): Asset | undefined {
  return assets
    .filter((asset) => /^[^/]+\/scenario\/[^/]+\/index\.html$/.test(asset.path))
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

/**
 * The scripts, styles and fonts the service worker precaches, read from the
 * built `sw.js` exactly as tests/unit/offline.test.ts reads them.
 *
 * Documents and catalog artifacts are precached too and are not counted here,
 * for the same reason the offline test does not count them: this ceiling is
 * about the code and typefaces a first visit must download, and the offline
 * test's second, looser ceiling covers the stored bytes of everything else.
 */
export function precachedAssetPaths(sw: string): string[] {
  const urls = JSON.parse(/const PRECACHE = (\[[^\]]*\])/.exec(sw)?.[1] ?? '[]') as string[];
  return urls
    .filter((url) => url.startsWith('/assets/') || url.startsWith('/fonts/'))
    .map((url) => url.slice(1));
}

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

  // The offline bundle is what a learner downloads. Preview images are fetched
  // only by crawlers and link previews, so they are measured on their own line.
  const isPreviewImage = (asset: Asset) => asset.path.startsWith('og/');
  const offline = assets.filter((asset) => !isPreviewImage(asset));
  const previews = assets.filter(isPreviewImage);
  const fullBytes = offline.reduce((sum, asset) => sum + asset.gzipBytes, 0);
  const previewBytes = previews.reduce((sum, asset) => sum + asset.rawBytes, 0);

  const precache = precachedAssetPaths(readFileSync(join(dist, 'sw.js'), 'utf8')).map((path) => {
    const asset = byPath.get(path);
    if (!asset) throw new Error(`precache references missing ${path}`);
    return asset;
  });
  const precacheBytes = precache.reduce((sum, asset) => sum + asset.gzipBytes, 0);

  const checks: [string, number, number, Asset[]][] = [
    ['landing route', landingBytes, BUDGETS.landing, landing],
    ['interactive cockpit', interactiveBytes, BUDGETS.interactive, interactive],
    ['first-visit precache', precacheBytes, BUDGETS.precache, precache],
    ['full offline bundle', fullBytes, BUDGETS.fullBundle, offline],
    ['social preview images', previewBytes, BUDGETS.previewImages, previews],
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

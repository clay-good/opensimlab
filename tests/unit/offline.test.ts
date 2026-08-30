/**
 * Acceptance tests for platform/offline-pwa and platform/privacy's
 * no-outbound-traffic guarantee.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BUDGETS, largestCockpitDocument, manifestAssetPaths } from '../../scripts/check-budgets';
import { precacheVersion } from '../../scripts/prerender';
import { isCrawler } from '@platform/offline/register';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { ROUTES } from '@routes/routes';
import { PUBLIC_CATALOG_ARTIFACTS } from '@platform/catalog/public-artifacts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const serviceWorker = readFileSync(join(root, 'public/sw.js'), 'utf8');
const manifest = JSON.parse(readFileSync(join(root, 'public/manifest.webmanifest'), 'utf8')) as {
  name: string; short_name: string; start_url: string; display: string;
  theme_color: string; background_color: string; icons: { src: string; sizes: string; purpose: string }[];
};

describe('Requirement: Cache-First Service Worker With Explicit Updates', () => {
  it('serves cache-first from a versioned cache', () => {
    expect(serviceWorker).toContain('caches.open(CACHE_NAME)');
    expect(serviceWorker).toContain('cache.match(path)');
    // The cache name carries a version, so a new build gets a new cache.
    expect(serviceWorker).toMatch(/const CACHE_NAME = `opensimlab-\$\{CACHE_VERSION\}`/);
  });

  it('Scenario: An update never interrupts a running session', () => {
    // No unconditional skipWaiting: the learner accepts the update explicitly.
    expect(serviceWorker).not.toMatch(/self\.skipWaiting\(\);?\s*\n\s*\}\)\(\)\);?\s*\n\}\);?\s*\n\s*self\.addEventListener\('activate'/);
    const installBlock = serviceWorker.slice(
      serviceWorker.indexOf("addEventListener('install'"),
      serviceWorker.indexOf("addEventListener('activate'"),
    );
    expect(installBlock, 'install calls skipWaiting, which would interrupt a session')
      .not.toContain('skipWaiting()');
    // It is called only in response to an explicit message from the page.
    expect(serviceWorker).toContain("event.data.type === 'skip-waiting'");
  });

  it('Scenario: Version activation is atomic', () => {
    const installBlock = serviceWorker.slice(
      serviceWorker.indexOf("addEventListener('install'"),
      serviceWorker.indexOf("addEventListener('activate'"),
    );
    // The new cache is fully populated during install, before it can activate.
    expect(installBlock).toContain('cache.addAll');
    // Activation retires only unpinned releases; a failed new install can remove
    // its own newly created cache, never the active snapshot.
    const activateBlock = serviceWorker.slice(serviceWorker.indexOf("addEventListener('activate'"));
    expect(activateBlock).toContain('caches.delete');
    expect(installBlock).toContain('if (!existed) await caches.delete(CACHE_NAME)');
    expect(installBlock).toContain('integrity: INTEGRITY[url]');
  });

  it('Scenario: A broken service worker can be escaped', async () => {
    const source = readFileSync(join(root, 'src/platform/offline/register.ts'), 'utf8');
    expect(source).toContain('MAX_FAILURES');
    expect(source).toContain('unregister()');
    // And it shows a diagnostic the learner can report.
    expect(source).toContain('Please report');
  });

  it('never fetches a foreign origin', () => {
    expect(serviceWorker).toContain('url.origin !== self.location.origin');
  });
});

describe('Requirement: Installable Progressive Web App', () => {
  it('supplies a manifest with a name, icons, theme colour and display mode', () => {
    expect(manifest.name).toBe('Open Sim Lab');
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toMatch(/^#[0-9A-F]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9A-F]{6}$/i);
    // An icon set covering Android, iOS, Windows, macOS and ChromeOS install flows.
    const sizes = manifest.icons.map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  it('Scenario: Installed app launches offline into the cockpit', () => {
    expect(manifest.start_url).toBe('/anesthesia');
  });

  it('uses only colours from the token module', () => {
    expect(manifest.theme_color).toBe('#06080B');
    expect(manifest.background_color).toBe('#0B0F14');
  });
});

describe('Requirement: Full Offline Operation After First Load', () => {
  it('Scenario: No runtime network dependency exists', () => {
    // A complete session runs with every network primitive removed. If the engine
    // reached the network anywhere, this would throw rather than complete.
    const forbidden = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon'];
    const globalObject = globalThis as unknown as Record<string, unknown>;
    const saved: Record<string, unknown> = {};
    for (const name of forbidden) {
      saved[name] = globalObject[name];
      globalObject[name] = () => { throw new Error(`The engine attempted a network call via ${name}`); };
    }
    try {
      const engine = new AnesthesiaEngine({
        scenario: ROUTINE_INDUCTION, seed: 1, practiceRegion: 'GB',
      });
      engine.apply({ tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 130, unit: 'mg' } });
      engine.apply({ tick: 0, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } });
      let last = engine.step();
      for (let i = 0; i < 3000; i += 1) last = engine.step();
      expect(last.state.meanArterialMmHg).toBeGreaterThan(0);
      expect(last.concentrations.length).toBeGreaterThan(0);
    } finally {
      for (const name of forbidden) globalObject[name] = saved[name];
    }
  });

  it('Scenario: Every scenario is playable offline on first load', async () => {
    // The scenario is bundled source, not a fetched document.
    const module = await import('@anesthesia/scenarios/routine-induction');
    expect(module.ROUTINE_INDUCTION.metadata.id).toBe('routine-induction');
    const source = readFileSync(join(root, 'src/modules/anesthesia/scenarios/routine-induction.ts'), 'utf8');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('import(');
  });

  it('bundles every citation, so a learner can check a source with no signal', async () => {
    const { MODELS } = await import('@anesthesia/pharmacology/registry');
    for (const model of MODELS) {
      // The full citation, the locator, and a plain-language summary all render
      // from the bundle rather than being fetched.
      expect(model.citation.authors.length).toBeGreaterThan(3);
      expect(model.citation.journal.length).toBeGreaterThan(3);
      expect(model.citation.locator.length).toBeGreaterThan(10);
      expect(model.citation.summary.length).toBeGreaterThan(40);
    }
  });
});

describe('Requirement: Bounded Download Budget', () => {
  it('includes every specialty when selecting the largest scenario document', () => {
    const assets = [
      { path: 'anesthesia/scenario/routine-induction/index.html', rawBytes: 1000, gzipBytes: 100 },
      { path: 'endocrine-metabolic/scenario/dka-resolution-transition/index.html', rawBytes: 2000, gzipBytes: 200 },
      { path: 'endocrine-metabolic/index.html', rawBytes: 3000, gzipBytes: 300 },
    ];
    expect(largestCockpitDocument(assets)).toBe(assets[1]);
    expect(largestCockpitDocument([])).toBeUndefined();
  });

  it('declares the budgets the specification states', () => {
    expect(BUDGETS.interactive).toBe(1.625 * 1024 * 1024);
    expect(BUDGETS.fullBundle).toBe(8 * 1024 * 1024);
    // The landing route is budgeted separately and far more tightly.
    expect(BUDGETS.landing).toBe(150 * 1024);
    expect(BUDGETS.landing).toBeLessThan(BUDGETS.interactive);
  });

  it('follows static cockpit imports without charging unrelated lazy routes', () => {
    const buildManifest = {
      'index.html': {
        file: 'assets/index.js',
        imports: ['_shared.js'],
        dynamicImports: ['src/routes/DocumentRoute.tsx'],
        css: ['assets/index.css'],
      },
      '_shared.js': { file: 'assets/shared.js' },
      'src/routes/AnesthesiaRoute.tsx': {
        file: 'assets/cockpit.js',
        imports: ['_shared.js'],
        css: ['assets/cockpit.css'],
      },
      'src/routes/DocumentRoute.tsx': { file: 'assets/documents.js' },
    };

    expect([...manifestAssetPaths(
      buildManifest,
      ['index.html', 'src/routes/AnesthesiaRoute.tsx'],
    )].sort()).toEqual([
      'assets/cockpit.css',
      'assets/cockpit.js',
      'assets/index.css',
      'assets/index.js',
      'assets/shared.js',
    ]);
  });
});

describe('Requirement: Local Storage Is Small, Inspectable, And Erasable', () => {
  it('stores only preferences, the acknowledgement, and transcripts', async () => {
    const { LOCAL_DATA_ITEMS } = await import('@platform/offline/local-data');
    for (const item of LOCAL_DATA_ITEMS) {
      expect(['preference', 'acknowledgement', 'transcript', 'recommendation', 'history']).toContain(item.kind);
      expect(item.purpose.length).toBeGreaterThan(15);
    }
    // Every key the application writes is declared here, so the data panel can
    // list them by name, purpose and size.
    expect(LOCAL_DATA_ITEMS.length).toBeGreaterThan(3);
  });
});

describe('Scenario: The service worker is not registered for a crawler', () => {
  it('detects the common crawlers', () => {
    expect(isCrawler('Googlebot/2.1')).toBe(true);
    expect(isCrawler('Chrome/120')).toBe(false);
  });
});

describe('Requirement: Everything The Offline Claim Names Is Actually Precached', () => {
  // The front page says it "works offline once it has loaded, including every
  // scenario". An earlier manifest was built by scanning the shell's own script
  // tags, which by design do not include the lazily imported route chunks or the
  // solver worker — so the landing page worked offline and starting a simulation
  // did not. Runtime caching covered it only for a learner who had already
  // opened the simulator, which is the learner who did not need it.
  const sw = readFileSync(join(process.cwd(), 'dist/sw.js'), 'utf8');
  const precache = JSON.parse(/const PRECACHE = (\[[^\]]*\])/.exec(sw)?.[1] ?? '[]') as string[];

  it('stamps the exact bytes of every offline response with SHA-256 integrity', () => {
    const integrity = JSON.parse(/const INTEGRITY = (\{[^;]+\});/.exec(sw)?.[1] ?? '{}') as Record<string, string>;
    expect(Object.keys(integrity)).toEqual(precache);
    const entries: { url: string; bytes: Buffer }[] = [];
    for (const url of precache) {
      const path = url === '/' || url === '/index.html' ? 'index.html'
        : ROUTES.some((route) => route.path === url) ? `${url.slice(1)}/index.html` : url.slice(1);
      const bytes = readFileSync(join(root, 'dist', path));
      entries.push({ url, bytes });
      const expected = `sha256-${createHash('sha256').update(bytes).digest('base64')}`;
      expect(integrity[url], url).toBe(expected);
    }
    expect(/const CACHE_VERSION = '([^']+)'/.exec(sw)?.[1]).toBe(precacheVersion([
      ...entries, { url: '/sw.js', bytes: Buffer.from(serviceWorker) },
    ]));
  });

  it('Scenario: the solver worker is precached', () => {
    expect(precache.some((url) => url.includes('solver.worker'))).toBe(true);
  });

  it('Scenario: every built asset is precached', () => {
    const built = [
      ...readdirSync(join(process.cwd(), 'dist/assets')).map((file) => `/assets/${file}`),
      ...readdirSync(join(process.cwd(), 'dist/fonts')).map((file) => `/fonts/${file}`),
    ];
    for (const asset of built) {
      expect(precache, `${asset} is not precached`).toContain(asset);
    }
  });

  it('precaches every public machine-readable catalog artifact', () => {
    for (const artifact of PUBLIC_CATALOG_ARTIFACTS) expect(precache).toContain(artifact);
  });

  it('changes the cache version when bytes at a stable font URL change', () => {
    const before = precacheVersion([{ url: '/fonts/example.woff2', bytes: Buffer.from('first') }]);
    const after = precacheVersion([{ url: '/fonts/example.woff2', bytes: Buffer.from('second') }]);
    expect(after).not.toBe(before);
    expect(sw).not.toContain('__CACHE_VERSION__');
  });

  it('Scenario: every scenario briefing is precached', () => {
    const briefings = ROUTES
      .filter((route) => route.path.startsWith('/anesthesia/scenario/'))
      .map((route) => route.path);
    expect(briefings.length).toBeGreaterThanOrEqual(3);
    for (const path of briefings) expect(precache, `${path} is not precached`).toContain(path);
  });

  it('Scenario: the precache stays inside the offline bundle budget', () => {
    // Precaching everything is only reasonable while everything is small. What
    // decides whether a first offline install is bearable on a slow connection
    // is the number of bytes that cross the wire, so the binding budget is the
    // compressed one; every host this deploys to serves these assets encoded.
    //
    // Back to 2.00 MiB from the 2.25 the seventh oncology lesson forced, because the
    // reason it grew has been removed rather than accommodated. Every lesson's authored
    // prose used to ship TWICE here — once in solver.worker, which runs the simulation,
    // and once in the session bundle, because debrief/replay.ts constructed an
    // AnesthesiaEngine on the main thread to compute counterfactuals and the engine
    // imports every lesson model. The engine now exists in exactly one place: the
    // debrief and the instructor review page ask the worker to re-run an action list
    // over the `history-replay` message and measure what comes back. That took this
    // graph from 2.001 to 1.648 MiB, a 361.6 KB compressed saving, and the second
    // engine copy — 374.6 KB gz on its own — is gone from the build entirely.
    //
    // So a lesson now costs roughly its own size rather than double, and the 0.35 MiB
    // of headroom under this ceiling is worth about thirty-five of them rather than
    // the six it would have been. The next thing to measure if this binds again is the
    // one remaining engine copy, not another raise.
    const files = precache
      .filter((url) => url.startsWith('/assets/') || url.startsWith('/fonts/'))
      .map((url) => readFileSync(join(process.cwd(), 'dist', url)));
    const transferred = files.reduce((sum, body) => sum + gzipSync(body, { level: 9 }).length, 0);
    expect(transferred, `${(transferred / 1024 / 1024).toFixed(2)} MiB compressed`)
      .toBeLessThan(2 * 1024 * 1024);
    // A second, deliberately loose ceiling on the stored bytes. Compression
    // ratios hide a blob that inflates on disk, and Cache Storage holds the
    // decoded response, so an accidental data dump must still trip something.
    const stored = precache
      .filter((url) => url.startsWith('/assets/') || url.startsWith('/fonts/'))
      .reduce((sum, url) => sum + statSync(join(process.cwd(), 'dist', url)).size, 0);
    expect(stored, `${(stored / 1024 / 1024).toFixed(2)} MiB stored`)
      .toBeLessThan(16 * 1024 * 1024);
  });

  it('Scenario: the engine is precached once, not twice', () => {
    // The budget above is the symptom; this is the cause it was tripping on. Any
    // main-thread module that constructs an AnesthesiaEngine drags every lesson
    // model into a second bundle, and both bundles are precached, so every
    // lesson's authored prose is downloaded twice for offline use. That is what
    // the debrief used to do, and what pushed this graph past 2.00 MiB.
    //
    // The check is on the built output rather than on imports, because an
    // engine-free import that a bundler still resolves to the engine would pass a
    // source-level check and fail the learner on a slow connection. The marker is
    // a string literal that exists only in engine.ts, so it survives minification
    // and appears once per copy of the engine that ships.
    const marker = 'A supraglottic airway is in place. Removal or intubation through it is not modeled.';
    const carrying = precache
      .filter((url) => url.startsWith('/assets/'))
      .filter((url) => readFileSync(join(process.cwd(), 'dist', url), 'utf8').includes(marker));
    expect(carrying, `the engine ships in ${carrying.length} precached assets`).toHaveLength(1);
    expect(carrying[0]).toContain('solver.worker');
  });
});

describe('Requirement: An Explicit Update Is Actually Offered', () => {
  // The worker is cache-first with explicit update acceptance, so a new version
  // never interrupts a running session. That is only defensible if something
  // asks. The event was dispatched and nothing listened, so a returning learner
  // stayed on the build they first cached — and would report defects that were
  // already fixed, which for a project collecting tester reports is the worst
  // possible failure.
  const register = readFileSync(join(process.cwd(), 'src/platform/offline/register.ts'), 'utf8');
  const notice = readFileSync(join(process.cwd(), 'src/platform/offline/UpdateNotice.tsx'), 'utf8');
  const app = readFileSync(join(process.cwd(), 'src/routes/App.tsx'), 'utf8');

  it('Scenario: something listens for the update and offers it', () => {
    expect(register).toContain('UPDATE_READY_EVENT');
    expect(notice).toContain('addEventListener(UPDATE_READY_EVENT');
    expect(notice).toContain('acceptUpdate');
    expect(app).toContain('<UpdateNotice />');
  });

  it('Scenario: a version that installed before this page loaded is still offered', () => {
    // No `updatefound` fires for a worker that is already waiting, so the
    // registration is checked directly as well.
    expect(register).toMatch(/registration\.waiting && navigator\.serviceWorker\.controller/);
  });

  it('Scenario: the offer never takes the decision away', () => {
    // No automatic reload and no skipWaiting outside the learner's click.
    expect(notice).toContain('Not now');
    expect(register).not.toMatch(/skipWaiting\(\)/);
  });
});

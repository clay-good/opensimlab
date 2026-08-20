/**
 * Acceptance tests for platform/offline-pwa and platform/privacy's
 * no-outbound-traffic guarantee.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUDGETS } from '../../scripts/check-budgets';
import { isCrawler } from '@platform/offline/register';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { ROUTES } from '@routes/routes';

const root = fileURLToPath(new URL('../..', import.meta.url));
const serviceWorker = readFileSync(join(root, 'public/sw.js'), 'utf8');
const manifest = JSON.parse(readFileSync(join(root, 'public/manifest.webmanifest'), 'utf8')) as {
  name: string; short_name: string; start_url: string; display: string;
  theme_color: string; background_color: string; icons: { src: string; sizes: string; purpose: string }[];
};

describe('Requirement: Cache-First Service Worker With Explicit Updates', () => {
  it('serves cache-first from a versioned cache', () => {
    expect(serviceWorker).toContain('caches.open(CACHE_NAME)');
    expect(serviceWorker).toContain('cache.match(request');
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
    // Old caches are deleted only in activate, after the new one is in place.
    const activateBlock = serviceWorker.slice(serviceWorker.indexOf("addEventListener('activate'"));
    expect(activateBlock).toContain('caches.delete');
    expect(installBlock).not.toContain('caches.delete');
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
  it('declares the budgets the specification states', () => {
    expect(BUDGETS.interactive).toBe(1.5 * 1024 * 1024);
    expect(BUDGETS.fullBundle).toBe(8 * 1024 * 1024);
    // The landing route is budgeted separately and far more tightly.
    expect(BUDGETS.landing).toBe(150 * 1024);
    expect(BUDGETS.landing).toBeLessThan(BUDGETS.interactive);
  });
});

describe('Requirement: Local Storage Is Small, Inspectable, And Erasable', () => {
  it('stores only preferences, the acknowledgement, and transcripts', async () => {
    const { LOCAL_DATA_ITEMS } = await import('@platform/offline/local-data');
    for (const item of LOCAL_DATA_ITEMS) {
      expect(['preference', 'acknowledgement', 'transcript']).toContain(item.kind);
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

  it('Scenario: the solver worker is precached', () => {
    expect(precache.some((url) => url.includes('solver.worker'))).toBe(true);
  });

  it('Scenario: every built asset is precached', () => {
    const built = readdirSync(join(process.cwd(), 'dist/assets')).map((file) => `/assets/${file}`);
    for (const asset of built) {
      expect(precache, `${asset} is not precached`).toContain(asset);
    }
  });

  it('Scenario: every scenario briefing is precached', () => {
    const briefings = ROUTES
      .filter((route) => route.path.startsWith('/anesthesia/scenario/'))
      .map((route) => route.path);
    expect(briefings.length).toBeGreaterThanOrEqual(3);
    for (const path of briefings) expect(precache, `${path} is not precached`).toContain(path);
  });

  it('Scenario: the precache stays inside the offline bundle budget', () => {
    // Precaching everything is only reasonable while everything is small.
    const bytes = precache
      .filter((url) => url.startsWith('/assets/'))
      .reduce((sum, url) => sum + statSync(join(process.cwd(), 'dist', url)).size, 0);
    expect(bytes).toBeLessThan(8 * 1024 * 1024);
  });
});

/**
 * A learner opening one scenario should download that module's catalogue, not
 * all thirteen. This used to be untrue: every clinical module's configuration
 * lived in one file, so the bundler had no seam to split on and the cockpit
 * graph carried every scenario in the project. These tests hold the seam open.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { availableModules } from '@platform/modules/registry';
import { manifestAssetPaths } from '../../scripts/check-budgets';

const dist = join(process.cwd(), 'dist');
const manifest = JSON.parse(readFileSync(join(dist, '.vite', 'manifest.json'), 'utf8')) as Parameters<typeof manifestAssetPaths>[0];
const ENTRY = 'index.html';
const routeKey = (moduleId: string) => `src/routes/modules/${moduleId}.tsx`;
const gzipBytes = (paths: readonly string[]) => paths.reduce((sum, path) => {
  try { return sum + gzipSync(readFileSync(join(dist, path)), { level: 9 }).length; } catch { return sum; }
}, 0);

describe('Requirement: One Module Downloads One Catalogue', () => {
  it('Scenario: every available module is its own lazily loaded route chunk', () => {
    for (const module of availableModules()) {
      expect(manifest[routeKey(module.id)], `${module.id} has no route chunk`).toBeTruthy();
    }
    // A shared file would collapse them back into one chunk.
    const files = new Set(availableModules().map((module) => manifest[routeKey(module.id)]!.file));
    expect(files.size).toBe(availableModules().length);
  });

  it('Scenario: opening one module does not download another module’s scenarios', () => {
    const entryOnly = manifestAssetPaths(manifest, [ENTRY]);
    const perModule = availableModules().map((module) => {
      const graph = [...manifestAssetPaths(manifest, [ENTRY, routeKey(module.id)])];
      return { id: module.id, added: graph.filter((path) => !entryOnly.has(path)) };
    });
    for (const { id, added } of perModule) {
      const others = perModule.filter((entry) => entry.id !== id);
      // Each module pulls at least one asset no other module pulls: its catalogue.
      const exclusive = added.filter((path) => !others.some((entry) => entry.added.includes(path)));
      expect(exclusive.length, `${id} shares its entire graph with other modules`).toBeGreaterThan(0);
    }
  });

  it('Scenario: one module’s cockpit never carries another module’s scenarios', () => {
    // Prose that exists only inside a scenario object, so a match means the
    // catalogue itself was downloaded rather than an id referenced elsewhere.
    const marker: Record<string, string> = {
      'infectious-disease': 'A previously well 15-year-old arrives nine hours',
      toxicology: 'becomes dusky, dyspneic, headachy',
    };
    const contains = (path: string, needle: string) => {
      try { return readFileSync(join(dist, path), 'utf8').includes(needle); } catch { return false; }
    };
    for (const [moduleId, needle] of Object.entries(marker)) {
      const own = [...manifestAssetPaths(manifest, [ENTRY, routeKey(moduleId)])];
      expect(own.some((path) => contains(path, needle)), `${moduleId} lost its own catalogue`).toBe(true);
      for (const other of Object.keys(marker).filter((id) => id !== moduleId)) {
        const graph = [...manifestAssetPaths(manifest, [ENTRY, routeKey(other)])];
        expect(graph.some((path) => contains(path, needle)),
          `${other} downloads ${moduleId}'s catalogue`).toBe(false);
      }
    }
  });

  it('Scenario: the largest module still fits well inside the cockpit budget', () => {
    const anesthesia = [...manifestAssetPaths(manifest, [ENTRY, routeKey('anesthesia')])];
    // Before the split this graph carried all thirteen catalogues at once. It no longer does, and
    // the three tests above prove the seam still holds: each module has its own chunk, pulls at
    // least one exclusive asset, and cannot see another module's scenario prose.
    //
    // This number is a headroom guard, not the seam. It was raised from 1100 to 1150 when the
    // ninth nursing lesson pushed the graph to 1104.3, with a note that splitting the shared
    // registers per module was the durable fix and that raising it again would be the wrong
    // instinct. The limitations register is now split: one file per module, assembled into the
    // whole register only for the limitations page and the reviewer index. The graph fell to
    // 1025.0 KB gz, so the guard comes back down to 1075 rather than staying loose.
    //
    // The source register is out of this graph too, by a different route: a cockpit only ever
    // read three titles from it, so the drug card carries its own and a test in sources.test.ts
    // stops that copy drifting. Splitting the register instead would have reordered the published
    // evidence manifest for the sake of three strings. The graph was 941.0 KB gz there.
    //
    // Raised from 985 to 1000 when binding the tutor and worked example to the surgery and
    // trauma lesson took it to 986.5, with a note naming the cause rather than absorbing it:
    // `Cockpit.tsx` statically imported all 241 demonstration modules and a demonstration
    // carries its narration, so EVERY lesson's script was in EVERY module's cockpit graph and
    // a lesson added to surgery and trauma grew anesthesia. The marginal cost was measured at
    // about 5.8 KB gz per lesson, which left room for exactly one more.
    //
    // That is now fixed for the demonstrations. A module hands its own worked examples to the
    // cockpit as data through `ClinicalModuleConfig.demonstrations` (see
    // `src/modules/*/demo/demonstrations.ts`), and one `useObservedDemonstration` call runs
    // whichever the module supplied. 198 of the 241 moved; the rest read more than the
    // resuscitation snapshot and still have their own hooks here. The graph fell from 992.4 to
    // 878.5 KB gz and the shared cockpit chunk from 652.2 to 538.3, so the guard comes down to
    // 900 rather than staying loose at 1000.
    //
    // The 48 lesson trays followed, by the same route: a module supplies them through
    // `ClinicalModuleConfig.trays` and the cockpit renders whichever one the scenario matches,
    // naming no lesson. It could be one block because the props are uniform — `guidance` was
    // `session.guidance` at all 202 call sites and the handler was the same
    // `session.act({ type, payload: { action } })` at 198 of 201. Stubbing the trays first
    // measured the prize at 98.9 KB gz; the migration collected 101.5. The graph fell from
    // 878.5 to 776.9 KB gz and the shared chunk from 538.3 to 436.8, so the guard comes down
    // again, to 800.
    //
    // The ~167 trays still written inline in `ActionCockpit.tsx` were the next lever, and the
    // same seam took them. Stubbing them first measured the prize at 264 KB gz; the migration
    // collected 261. Every migratable tray now lives in its module, the graph is 532.5 KB gz
    // and `ActionCockpit.tsx` is 5,774 lines rather than 17,180, so the guard comes down to
    // 575.
    //
    // Five trays are still defined here, and belong here. Four are gated on `injected.has(...)`
    // -- a crisis injected at runtime, which the seam's `supports(scenario)` cannot see -- and
    // the emergence-residual-block tray reads the train-of-four count and ratio, which are
    // cockpit props rather than fields of the resuscitation snapshot a tray is handed. Moving
    // it would mean widening the seam for one lesson.
    //
    // Note `React.lazy` is NOT available for any of this: 294 test files render `ActionCockpit`
    // through `renderToStaticMarkup`, which will not serve Suspense. Raising this number is not
    // the answer; measure and move the boundary.
    expect(gzipBytes(anesthesia) / 1024).toBeLessThan(575);
  });
});

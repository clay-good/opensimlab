/**
 * Scenario ids are unique inside a module, not across the catalogue.
 *
 * `status-epilepticus` is one lesson in emergency medicine and a different one
 * in critical care. That has already caused three defects, each found
 * separately and each the same shape: the practice history treated the two as
 * one lesson, the README's mapped-lesson count reported one fewer than the
 * catalogue has, and the USMLE blueprint would have collided their list keys
 * and pointed both at the same maturity record.
 *
 * So this file is the standing guard rather than a fourth diagnosis. It holds
 * the invariant where it matters: anything that looks a lesson up by id alone
 * must either be scoped to a module, or must not be given an id that two
 * modules share.
 */
import { describe, expect, it } from 'vitest';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { LIMITATIONS, limitationsFor } from '@platform/docs/limitations';
import { REFERENCE_PATHS } from '@platform/facilitation/reference-paths.generated';
import { CORRECTIONS } from '@platform/docs/corrections';

const modulesById = new Map<string, string[]>();
for (const entry of FACILITATED_SCENARIOS) {
  const modules = modulesById.get(entry.scenario.metadata.id) ?? [];
  modules.push(entry.moduleRoute);
  modulesById.set(entry.scenario.metadata.id, modules);
}
const SHARED = [...modulesById].filter(([, modules]) => modules.length > 1).map(([id]) => id);

describe('ids that two modules share', () => {
  /**
   * Not a count to keep at one. If a second shared id appears, every lookup
   * below has to be checked again, and this test is where that starts.
   */
  it('is exactly the one the catalogue knows about', () => {
    expect(SHARED).toEqual(['status-epilepticus']);
    expect(modulesById.get('status-epilepticus')!.sort())
      .toEqual(['critical-care', 'emergency-medicine']);
  });

  it('every lesson is unique within its own module', () => {
    const byModule = new Map<string, string[]>();
    for (const entry of FACILITATED_SCENARIOS) {
      const ids = byModule.get(entry.moduleRoute) ?? [];
      ids.push(entry.scenario.metadata.id);
      byModule.set(entry.moduleRoute, ids);
    }
    for (const [module, ids] of byModule) {
      expect(new Set(ids).size, `${module} ships a duplicate scenario id`).toBe(ids.length);
    }
  });
});

describe('the registries that look a lesson up by id alone', () => {
  /**
   * `limitationsFor` takes a scenario id and no module, so a limitation
   * declared for one of the two lessons would appear on the other as well -
   * a limitation about a patient nobody in that lesson has. Nothing names a
   * shared id today, and this is what keeps that true.
   */
  it('no limitation is declared against a shared id', () => {
    for (const limitation of LIMITATIONS) {
      for (const scenarioId of limitation.briefIn ?? []) {
        expect(SHARED, `a limitation names ${scenarioId}, which two modules ship`)
          .not.toContain(scenarioId);
      }
    }
    expect(limitationsFor('status-epilepticus')).toEqual([]);
  });

  /** And every limitation names a lesson that exists, in some module. */
  it('every limitation names a real lesson', () => {
    for (const limitation of LIMITATIONS) {
      for (const scenarioId of limitation.briefIn ?? []) {
        expect(modulesById.has(scenarioId), `no lesson is called ${scenarioId}`).toBe(true);
      }
    }
  });

  /**
   * The adoption pack attaches a correction to a lesson by matching the
   * correction's `item` against the audit's scenario id, with no module. The
   * log is empty today and is meant to grow, so the guard is here before the
   * first entry rather than after the one that lands on two lessons.
   */
  it('no correction is filed against a shared id', () => {
    for (const correction of CORRECTIONS) {
      expect(SHARED, `correction "${correction.title}" names a shared id`)
        .not.toContain(correction.item);
    }
  });

  /**
   * The reference paths carry a module and are looked up by both, which is the
   * shape every cross-module registry needs. Holding it here means a
   * regression to id-only matching fails rather than quietly serving the wrong
   * lesson's expert transcript to a facilitator.
   */
  it('reference paths carry their module, and both lessons have their own', () => {
    const shared = REFERENCE_PATHS.filter((paths) => paths.scenarioId === 'status-epilepticus');
    expect(shared.map((paths) => paths.moduleId).sort())
      .toEqual(['critical-care', 'emergency-medicine']);
    expect(shared[0]!.expert).not.toEqual(shared[1]!.expert);
  });
});

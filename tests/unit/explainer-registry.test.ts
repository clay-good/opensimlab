/**
 * The cross-module explainer contract (knowledge-layer → the minimum knowledge
 * set, and the catalog gate behind it).
 *
 * The per-explainer rules used to be asserted over the anesthesia array alone,
 * so a second module's explanations would have shipped unchecked: under no word
 * count, with no source, and pointing at whatever lesson id they happened to
 * name. These run over every module that declares a set.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MODULE_EXPLAINERS, allExplainers } from '@platform/knowledge/explainer-registry';
import { wordCount } from '@platform/knowledge/explainer';
import { EXPLAINER_FLOOR, knowledgeGaps } from '@platform/knowledge/knowledge-sets';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { isUnreviewed } from '@platform/governance/review-gate';
import { registeredPmids } from '@platform/docs/sources';
import { availableModules } from '@platform/modules/registry';

const entries = allExplainers();

describe('every module\'s concept explainers', () => {
  it('declares only available modules, each at or above the floor', () => {
    const available = new Set(availableModules().map((module) => module.id));
    for (const module of MODULE_EXPLAINERS) {
      expect(available.has(module.moduleId), `${module.moduleId} is not an available module`).toBe(true);
      expect(module.explainers.length, module.moduleId).toBeGreaterThanOrEqual(EXPLAINER_FLOOR);
    }
  });

  it('gives every explainer one id across the whole build', () => {
    const ids = entries.map(({ explainer }) => explainer.id);
    expect([...new Set(ids)].length).toBe(ids.length);
  });

  it.each(entries.map((entry) => [`${entry.module.moduleId}/${entry.explainer.id}`, entry] as const))(
    '%s reads as an explanation with a source and a stated limit',
    (_, { explainer }) => {
      const words = wordCount(explainer.body);
      expect(words, `${explainer.id} is ${words} words`).toBeLessThanOrEqual(250);
      expect(words).toBeGreaterThan(60);
      expect(explainer.diagram.caption.length).toBeGreaterThan(20);
      expect(explainer.reflects.length).toBeGreaterThan(15);
      expect(explainer.simplifies.trim().length).toBeGreaterThan(0);
      // Unsigned until a clinician signs it, and detected as unsigned where it is read.
      expect(isUnreviewed(explainer.review), explainer.id).toBe(true);
    },
  );

  it('demonstrates each explainer with a lesson in its own module', () => {
    for (const { module, explainer } of entries) {
      const lessons = FACILITATED_SCENARIOS.filter((entry) => entry.moduleRoute === module.route);
      expect(lessons.some((entry) => entry.scenario.metadata.id === explainer.showMe.scenarioId),
        `${explainer.id} points at ${explainer.showMe.scenarioId}, which is not a ${module.route} lesson`).toBe(true);
    }
    expect(knowledgeGaps().flatMap((gap) => gap.showMeOutsideModule)).toEqual([]);
  });

  it('names every PMID it cites in the source register', () => {
    const registered = registeredPmids();
    for (const { explainer } of entries) {
      for (const match of explainer.reflects.matchAll(/PMID (\d{5,8})/g)) {
        expect(registered.has(match[1]!), `${explainer.id} cites unregistered PMID ${match[1]}`).toBe(true);
      }
    }
  });

  it('cites a named source whenever a body claims trial evidence', () => {
    for (const { explainer } of entries) {
      if (!/\btrials?\b|\bstudies\b|\bevidence\b/i.test(explainer.body)) continue;
      expect(explainer.reflects, `${explainer.id} claims trial evidence without naming it`)
        .toMatch(/PMID \d{5,8}/);
    }
  });

  it('points each maturity record at the file the explainer is authored in', () => {
    for (const module of MODULE_EXPLAINERS) {
      const source = readFileSync(module.sourcePath, 'utf8');
      for (const explainer of module.explainers) {
        expect(source, `${module.sourcePath} does not declare ${explainer.id}`)
          .toContain(`id: '${explainer.id}'`);
      }
    }
  });
});

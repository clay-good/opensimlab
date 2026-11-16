/**
 * catalog-growth → computed counts. The README is the one count surface a
 * build cannot render, so it is held against the registry and the scenario
 * arrays instead: adding or withdrawing a lab without updating the table fails.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { availableModules } from '@platform/modules/registry';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { READY_MODULE_COUNT, READY_SCENARIO_COUNT } from '@landing/content';
import { BLUEPRINTS } from '@platform/curriculum/blueprints';
import { mappedDomainsFor } from '@platform/curriculum/mapped-modules';

const readme = readFileSync('README.md', 'utf8');
const rows = [...readme.matchAll(/^\| ([^|]+?) \| (\d+) \| `\/([a-z-]+)` \|$/gm)]
  .map((match) => ({ name: match[1]!, labs: Number(match[2]), route: match[3]! }));

describe('the README module table', () => {
  it('lists every available module exactly once', () => {
    expect(rows.map((row) => row.route).sort())
      .toEqual(availableModules().map((module) => module.route).sort());
  });

  it.each(rows)('states the real lab count for $route', ({ route, labs }) => {
    expect(labs).toBe(availableModules().find((module) => module.route === route)?.scenarioCount);
    expect(labs).toBe(FACILITATED_SCENARIOS.filter((entry) => entry.moduleRoute === route).length);
  });

  it('states how many lessons actually carry a framework mapping', () => {
    // Keyed by module and id, not id alone: emergency medicine and critical
    // care each ship a lesson called `status-epilepticus`, and counting ids
    // would quietly report one lesson fewer than the catalogue has.
    const mapped = new Set([
      ...FACILITATED_SCENARIOS
        .filter((entry) => mappedDomainsFor(entry.moduleRoute, entry.scenario.metadata.id).length > 0)
        .map((entry) => `${entry.moduleRoute}/${entry.scenario.metadata.id}`),
      // Nursing's mapping is derived from its objectives rather than authored,
      // so it reaches the count through the blueprint it feeds.
      ...BLUEPRINTS.flatMap((blueprint) => blueprint.categories
        .flatMap((category) => category.lessons
          .map((lesson) => `${blueprint.moduleRoute}/${lesson.scenarioId}`))),
    ]);
    const claim = /(\d+) of (\d+) lessons\s+carry a mapping/.exec(readme);
    expect(Number(claim?.[1])).toBe(mapped.size);
    expect(Number(claim?.[2])).toBe(READY_SCENARIO_COUNT);
  });

  it('states the totals the landing page renders', () => {
    const total = /^(\d+) bounded labs across (\d+) specialties:/m.exec(readme);
    expect(Number(total?.[1])).toBe(READY_SCENARIO_COUNT);
    expect(Number(total?.[2])).toBe(READY_MODULE_COUNT);
    expect(rows.reduce((sum, row) => sum + row.labs, 0)).toBe(READY_SCENARIO_COUNT);
  });
});

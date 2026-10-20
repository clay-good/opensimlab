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

  it('states the totals the landing page renders', () => {
    const total = /^(\d+) bounded labs across (\d+) specialties:/m.exec(readme);
    expect(Number(total?.[1])).toBe(READY_SCENARIO_COUNT);
    expect(Number(total?.[2])).toBe(READY_MODULE_COUNT);
    expect(rows.reduce((sum, row) => sum + row.labs, 0)).toBe(READY_SCENARIO_COUNT);
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import { buildAnesthesiaCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import {
  buildPublicScenarioCatalog,
  SCENARIO_CATALOG_SCHEMA,
  validatePublicScenarioCatalog,
} from '@anesthesia/catalog/public-catalog';

const completion = buildAnesthesiaCompletionCatalog(SCENARIOS, ENGINE_VERSION);
const catalog = buildPublicScenarioCatalog(SCENARIOS, completion);

describe('public scenario catalog', () => {
  it('publishes every scenario once with exact-version discovery data', () => {
    expect(validatePublicScenarioCatalog(catalog)).toEqual([]);
    expect(catalog.scenarioCount).toBe(SCENARIOS.length);
    expect(catalog.preparationPathCount).toBe(10);
    expect(new Set(catalog.scenarios.map((scenario) => scenario.id)).size).toBe(SCENARIOS.length);
    for (const scenario of catalog.scenarios) {
      expect(scenario.searchText).toContain(scenario.title.toLocaleLowerCase());
      expect(scenario.path).toBe(`/anesthesia/scenario/${scenario.id}`);
      expect(scenario.objectives.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('fails closed when an exact-version completion audit is absent', () => {
    expect(() => buildPublicScenarioCatalog(SCENARIOS, {
      ...completion, scenarios: completion.scenarios.slice(1),
    })).toThrow(/No exact-version completion audit/);
  });

  it('rejects dishonest counts, duplicate ids, and mismatched paths', () => {
    const hostile = structuredClone(catalog) as unknown as {
      scenarioCount: number;
      scenarios: Array<{ id: string; path: string }>;
    };
    hostile.scenarioCount += 1;
    hostile.scenarios[1]!.id = hostile.scenarios[0]!.id;
    hostile.scenarios[1]!.path = '/wrong';
    const errors = validatePublicScenarioCatalog(hostile);
    expect(errors).toContain('/scenarioCount: does not match scenarios length');
    expect(errors.some((error) => error.includes('duplicate'))).toBe(true);
    expect(errors.some((error) => error.includes('/path:'))).toBe(true);
  });

  it('keeps generated public files equal to the authoritative builder', () => {
    const target = join(process.cwd(), 'public', 'catalog');
    expect(JSON.parse(readFileSync(join(target, 'scenario-catalog.schema.json'), 'utf8')))
      .toEqual(SCENARIO_CATALOG_SCHEMA);
    expect(JSON.parse(readFileSync(join(target, 'anesthesia-catalog.json'), 'utf8')))
      .toEqual(catalog);
  });
});

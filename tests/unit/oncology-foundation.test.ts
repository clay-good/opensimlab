import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getModule, availableModules } from '@platform/modules/registry';
import { PUBLIC_CATALOG_ARTIFACTS } from '@platform/catalog/public-artifacts';
import { reviewableItems } from '@platform/governance/records';
import { structuredDataFor } from '@platform/docs/structured-data';
import { SITE_BAR_LINKS } from '@platform/ui';
import { limitationsFor } from '@platform/docs/limitations';
import { requireSource } from '@platform/docs/sources';
import { READY_MODULE_COUNT } from '@landing/content';
import { ROUTES, routeFor } from '@routes/routes';
import { PrerenderedBody } from '@routes/Prerendered';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { moduleProse } from '@platform/modules/module-prose';
import {
  DEFAULT_ONCOLOGY_SCENARIO_ID, ONCOLOGY_SCENARIOS, getOncologyScenario,
} from '../../src/modules/oncology/scenarios';

const id = 'delayed-immune-event-a-drug-that-stopped-months-ago';
const path = `/oncology/scenario/${id}`;
const scenario = ONCOLOGY_SCENARIOS[0]!;
const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');
const json = (file: string) => JSON.parse(read(file));

describe('Oncology module foundation', () => {
  it('opens the module with the first of eleven planned lessons', () => {
    expect(getModule('oncology')).toMatchObject({
      route: 'oncology', displayName: 'Oncology', status: 'available',
      timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
    });
    expect(moduleProse('oncology').plannedScope).toContain('Eleven bounded');
    // The prose must no longer read as an unbuilt module, because the route now runs one.
    expect(moduleProse('oncology').description).not.toBe('Planned.');
    expect(ONCOLOGY_SCENARIOS).toHaveLength(2);
    expect(DEFAULT_ONCOLOGY_SCENARIO_ID).toBe(id);
    expect(getOncologyScenario(id)).toBe(scenario);
    expect(getOncologyScenario('not-a-scenario')).toBeUndefined();
    expect(availableModules().map((entry) => entry.id)).toContain('oncology');
    expect(READY_MODULE_COUNT).toBe(15);
  });

  it('validates against the shared scenario schema', () => {
    expect(validateScenario(scenario)).toEqual([]);
  });

  // A module is only reachable if every surface knows about it. Each of these has been a
  // separate omission in past module launches.
  it('is reachable from the nav, the routes, and the prerendered markup', () => {
    expect(SITE_BAR_LINKS.map((link) => link.href)).toContain('/oncology');
    expect(routeFor('/oncology')).toMatchObject({
      indexable: true, heading: 'Oncology simulator',
    });
    const route = routeFor(path)!;
    expect(route.indexable).toBe(true);
    expect(route.description.length).toBeGreaterThanOrEqual(110);
    expect(route.description.length).toBeLessThanOrEqual(160);
    expect(ROUTES.filter((entry) => entry.path.startsWith('/oncology'))).toHaveLength(3);
    const markup = renderToStaticMarkup(createElement(PrerenderedBody, { path }));
    expect(markup).toContain('a drug that stopped months ago');
    const moduleMarkup = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/oncology' }));
    expect(moduleMarkup).toContain('Oncology simulator');
  });

  it('publishes structured data and its own catalog artifacts', () => {
    const data = structuredDataFor(['LearningResource'], path);
    expect(data.some((entry) => JSON.stringify(entry).includes(id))).toBe(true);
    for (const artifact of ['completion-audit', 'quality-audit', 'maturity']) {
      expect(PUBLIC_CATALOG_ARTIFACTS).toContain(`/catalog/oncology-${artifact}.json`);
    }
    const completion = json('public/catalog/oncology-completion-audit.json');
    expect(completion.scenarioCount).toBe(2);
    expect(completion.scenarios[0].scenarioId).toBe(id);
    expect(completion.scenarios[0].environment).toBe('clinic');
    // The two report catalogs must stay byte-identical, or a report can resolve in one and not the other.
    expect(read('public/catalog/scenario-report-catalog.json'))
      .toBe(read('workers/reports/src/report-catalog.generated.json'));
  });

  it('enters the governance record under its own domain', () => {
    const item = reviewableItems().find((entry) => entry.id === id);
    expect(item).toMatchObject({ kind: 'scenario', domains: ['oncology'] });
    expect(item!.review.reviewer).toBe('UNSIGNED');
  });

  it('declares its limitations and resolves every cited source', () => {
    const limitations = limitationsFor(id);
    expect(limitations).toHaveLength(3);
    expect(limitations.map((entry) => entry.id)).toContain('delayed-immune-event-series-figures-are-not-an-incidence');
    for (const source of ['oncology-delayed-immune-related-events-2019',
      'oncology-sitc-checkpoint-adverse-events-2021', 'oncology-fatal-checkpoint-toxicity-2018']) {
      expect(requireSource(source).verifiedOn).toBe('2026-08-29');
    }
  });

  it('makes every scenario in the module reportable, not just the first', () => {
    const catalog = json('public/catalog/scenario-report-catalog.json');
    for (const entry of ONCOLOGY_SCENARIOS) {
      const record = catalog.scenarios.find((row: { scenarioId: string; contentVersion: string }) =>
        row.scenarioId === entry.metadata.id && row.contentVersion === entry.metadata.version);
      expect(record, `${entry.metadata.id} is missing from the report catalog at its current version`).toMatchObject({
        moduleId: 'oncology', contentVersion: entry.metadata.version, maturity: 'preview',
      });
    }
  });
});

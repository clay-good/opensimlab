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
  DEFAULT_MEDICAL_SURGICAL_NURSING_SCENARIO_ID, MEDICAL_SURGICAL_NURSING_SCENARIOS,
  getMedicalSurgicalNursingScenario,
} from '../../src/modules/medical-surgical-nursing/scenarios';

const id = 'low-score-what-the-threshold-does-not-exclude';
const path = `/medical-surgical-nursing/scenario/${id}`;
const scenario = MEDICAL_SURGICAL_NURSING_SCENARIOS[0]!;
const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');
const json = (file: string) => JSON.parse(read(file));

describe('Nursing module foundation', () => {
  it('registers two previews toward nine planned lessons', () => {
    expect(getModule('medical-surgical-nursing')).toMatchObject({
      route: 'medical-surgical-nursing', displayName: 'Nursing', status: 'available',
      timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
    });
    expect(moduleProse('medical-surgical-nursing').plannedScope).toContain('Nine bounded');
    expect(MEDICAL_SURGICAL_NURSING_SCENARIOS).toHaveLength(2);
    expect(DEFAULT_MEDICAL_SURGICAL_NURSING_SCENARIO_ID).toBe(id);
    expect(getMedicalSurgicalNursingScenario(id)).toBe(scenario);
    expect(getMedicalSurgicalNursingScenario('not-a-scenario')).toBeUndefined();
    expect(availableModules().map((entry) => entry.id)).toContain('medical-surgical-nursing');
    expect(READY_MODULE_COUNT).toBe(14);
  });

  it('validates against the shared scenario schema', () => {
    expect(validateScenario(scenario)).toEqual([]);
  });

  // A module is only reachable if every surface knows about it. Each of these has been a
  // separate omission in past module launches.
  it('is reachable from the nav, the routes, and the prerendered markup', () => {
    expect(SITE_BAR_LINKS.map((link) => link.href)).toContain('/medical-surgical-nursing');
    expect(routeFor('/medical-surgical-nursing')).toMatchObject({
      indexable: true, heading: 'Nursing simulator',
    });
    const route = routeFor(path)!;
    expect(route.indexable).toBe(true);
    expect(route.description.length).toBeGreaterThanOrEqual(110);
    expect(route.description.length).toBeLessThanOrEqual(160);
    expect(ROUTES.filter((entry) => entry.path.startsWith('/medical-surgical-nursing'))).toHaveLength(3);
    const markup = renderToStaticMarkup(createElement(PrerenderedBody, { path }));
    expect(markup).toContain('what the threshold does not exclude');
    const moduleMarkup = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/medical-surgical-nursing' }));
    expect(moduleMarkup).toContain('Nursing simulator');
  });

  it('publishes structured data and its own catalog artifacts', () => {
    const data = structuredDataFor(['LearningResource'], path);
    expect(data.some((entry) => JSON.stringify(entry).includes(id))).toBe(true);
    for (const artifact of ['completion-audit', 'quality-audit', 'maturity']) {
      expect(PUBLIC_CATALOG_ARTIFACTS).toContain(`/catalog/medical-surgical-nursing-${artifact}.json`);
    }
    const completion = json('public/catalog/medical-surgical-nursing-completion-audit.json');
    expect(completion.scenarioCount).toBe(2);
    expect(completion.scenarios[0].scenarioId).toBe(id);
    // The two report catalogs must stay byte-identical, or a report can resolve in one and not the other.
    expect(read('public/catalog/scenario-report-catalog.json'))
      .toBe(read('workers/reports/src/report-catalog.generated.json'));
  });

  it('enters the governance record under its own domain', () => {
    const item = reviewableItems().find((entry) => entry.id === id);
    expect(item).toMatchObject({ kind: 'scenario', domains: ['medical-surgical-nursing'] });
    expect(item!.review.reviewer).toBe('UNSIGNED');
  });

  it('declares its limitations and resolves every cited source', () => {
    const limitations = limitationsFor(id);
    expect(limitations).toHaveLength(3);
    expect(limitations.map((entry) => entry.id)).toContain('low-score-sensitivity-figures-are-population-statistics');
    for (const source of ['news2-sepsis-bacteraemia-accuracy-2025', 'afferent-limb-failure-systematic-review-2019']) {
      expect(requireSource(source).verifiedOn).toBe('2026-08-28');
    }
  });

  it('makes every scenario in the module reportable, not just the first', () => {
    const catalog = json('public/catalog/scenario-report-catalog.json');
    for (const entry of MEDICAL_SURGICAL_NURSING_SCENARIOS) {
      const record = catalog.scenarios.find((row: { scenarioId: string }) => row.scenarioId === entry.metadata.id);
      expect(record, `${entry.metadata.id} is missing from the report catalog`).toMatchObject({
        moduleId: 'medical-surgical-nursing', contentVersion: entry.metadata.version, maturity: 'preview',
      });
    }
  });
});

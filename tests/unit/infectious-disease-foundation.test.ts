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
import { READY_MODULE_COUNT, READY_SCENARIO_COUNT } from '@landing/content';
import { ROUTES, indexableRoutes, routeFor } from '@routes/routes';
import { PrerenderedBody } from '@routes/Prerendered';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { moduleProse } from '@platform/modules/module-prose';
import {
  DEFAULT_INFECTIOUS_DISEASE_SCENARIO_ID, INFECTIOUS_DISEASE_SCENARIOS, getInfectiousDiseaseScenario,
} from '../../src/modules/infectious-disease/scenarios';

const id = 'meningococcal-sepsis-recognition-and-escalation';
const path = `/infectious-disease/scenario/${id}`;
const scenario = INFECTIOUS_DISEASE_SCENARIOS[0]!;
const obstructionId = 'obstructed-infected-kidney-decompression';
const obstructionPath = `/infectious-disease/scenario/${obstructionId}`;
const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');
const json = (file: string) => JSON.parse(read(file));

describe('Infectious disease module foundation', () => {
  it('registers all ten planned lessons', () => {
    expect(getModule('infectious-disease')).toMatchObject({
      route: 'infectious-disease', displayName: 'Infectious disease', status: 'available',
      timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
    });
    expect(moduleProse('infectious-disease').plannedScope).toContain('Ten bounded');
    expect(INFECTIOUS_DISEASE_SCENARIOS).toHaveLength(10);
    expect(DEFAULT_INFECTIOUS_DISEASE_SCENARIO_ID).toBe(id);
    expect(getInfectiousDiseaseScenario(id)).toBe(scenario);
    expect(getInfectiousDiseaseScenario(obstructionId)).toBe(INFECTIOUS_DISEASE_SCENARIOS[1]);
    expect(getInfectiousDiseaseScenario('not-a-scenario')).toBeUndefined();
    expect(availableModules().map((entry) => entry.id)).toContain('infectious-disease');
    expect(READY_MODULE_COUNT).toBe(15);
    expect(READY_SCENARIO_COUNT).toBe(239);
  });

  it('validates the authored scenario and declares honest preview evidence', () => {
    expect(validateScenario(scenario)).toEqual([]);
    expect(scenario.metadata.maturity).toBe('preview');
    // An unsigned review must never look like a completed one.
    expect(scenario.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(scenario.metadata.clinicalReview.sources).toHaveLength(3);
    expect(scenario.metadata.clinicalReview.sources.join(' ')).toContain('NG240');
    expect(scenario.metadata.clinicalReview.sources.join(' ')).toContain('NG254');
    expect(scenario.metadata.clinicalReview.sources.join(' ')).toContain('Phoenix');
  });

  it('registers every declared limitation and its supporting sources', () => {
    const limitations = limitationsFor(id);
    expect(limitations.map((entry) => entry.id).sort()).toEqual([...(scenario.metadata.limitations ?? [])].sort());
    expect(limitations).toHaveLength(3);
    for (const source of ['nice-ng240-meningococcal-2024', 'nice-ng254-sepsis-under-16s-2025',
      'phoenix-pediatric-sepsis-criteria-2024']) {
      expect(requireSource(source).verifiedOn).toBe('2026-08-28');
      expect(requireSource(source).usedFor.length).toBeGreaterThan(40);
    }
  });

  it('routes, prerenders, and links the module as an indexable page', () => {
    expect(routeFor('/infectious-disease')?.indexable).toBe(true);
    expect(routeFor(path)?.indexable).toBe(true);
    expect(routeFor(path)?.structuredData).toEqual(['LearningResource']);
    expect(indexableRoutes().map((route) => route.path)).toContain(path);
    expect(SITE_BAR_LINKS).toContainEqual({ href: '/infectious-disease', label: 'Infectious disease' });

    expect(routeFor(obstructionPath)?.indexable).toBe(true);
    expect(indexableRoutes().map((route) => route.path)).toContain(obstructionPath);
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/infectious-disease' }));
    expect(index).toContain('<h1>Infectious disease simulator</h1>');
    expect(index).toContain('href="/infectious-disease" aria-current="page"');
    expect(index).toContain(`href="/infectious-disease/scenario/${id}"`);
    expect(index).toContain('Meningococcal sepsis with a non-blanching rash');
    expect(index).toContain(`href="/infectious-disease/scenario/${obstructionId}"`);
    expect(index).toContain('Infected obstructed kidney: drainage is the treatment');

    const detail = renderToStaticMarkup(createElement(PrerenderedBody, { path }));
    expect(detail).toContain('Meningococcal sepsis with a non-blanching rash');
    // The prerendered shell must not leak a dose or a settled diagnosis.
    expect(detail.toLowerCase()).not.toContain('ceftriaxone');
  });

  it('keeps every route description inside the search-result budget', () => {
    for (const route of ROUTES.filter((entry) => entry.path.startsWith('/infectious-disease'))) {
      expect(route.description.length).toBeGreaterThanOrEqual(110);
      expect(route.description.length).toBeLessThanOrEqual(160);
      expect(route.title.length).toBeLessThan(60);
    }
  });

  it('emits LearningResource structured data for the scenario route', () => {
    const data = structuredDataFor(['LearningResource'], path);
    expect(JSON.stringify(data)).toContain('LearningResource');
    expect(JSON.stringify(data)).toContain('Meningococcal sepsis with a non-blanching rash');
  });

  it('publishes the module catalog artifacts and a governance review item', () => {
    for (const artifact of ['/catalog/infectious-disease-completion-audit.json',
      '/catalog/infectious-disease-quality-audit.json', '/catalog/infectious-disease-maturity.json']) {
      expect(PUBLIC_CATALOG_ARTIFACTS).toContain(artifact);
      expect(json(`public${artifact}`)).toBeTruthy();
    }
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id, kind: 'scenario', contentVersion: '0.1.0', domains: ['infectious-disease'],
    }));
  });

  it('registers the obstructed kidney limitations and its three graded sources', () => {
    const limitations = limitationsFor(obstructionId);
    expect(limitations).toHaveLength(3);
    expect(limitations.map((entry) => entry.id).sort())
      .toEqual([...(INFECTIOUS_DISEASE_SCENARIOS[1]!.metadata.limitations ?? [])].sort());
    for (const source of ['aua-surgical-stones-2026', 'eau-urolithiasis-2026', 'nice-ng253-sepsis-16-and-over-2025']) {
      expect(requireSource(source).verifiedOn).toBe('2026-08-28');
    }
    // The evidence grades are the lesson, so they must survive into the register.
    expect(requireSource('aua-surgical-stones-2026').locator).toContain('Grade C');
    expect(requireSource('aua-surgical-stones-2026').locator).toContain('Grade A');
  });

  it('carries both scenarios into the report catalog so the shared report door works', () => {
    const catalog = json('workers/reports/src/report-catalog.generated.json');
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'infectious-disease', scenarioId: id, contentVersion: '0.1.0',
      maturity: 'preview', fidelityClass: 'state_transition',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'infectious-disease', scenarioId: obstructionId, contentVersion: '0.1.0',
      maturity: 'preview', fidelityClass: 'state_transition',
    }));
    expect(read('public/catalog/scenario-report-catalog.json')).toBe(read('workers/reports/src/report-catalog.generated.json'));
  });
});

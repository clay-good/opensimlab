import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ACKNOWLEDGEMENT_KEY } from '@platform/safety/not-for-clinical-use';
import { getModule, availableModules } from '@platform/modules/registry';
import { PUBLIC_CATALOG_ARTIFACTS } from '@platform/catalog/public-artifacts';
import { reviewableItems } from '@platform/governance/records';
import { structuredDataFor } from '@platform/docs/structured-data';
import { SITE_BAR_LINKS, SiteBar } from '@platform/ui';
import { READY_MODULE_COUNT, READY_SCENARIO_COUNT } from '@landing/content';
import { ROUTES, indexableRoutes, routeFor } from '@routes/routes';
import { PrerenderedBody } from '@routes/Prerendered';
import { getEmergencyMedicineScenario } from '../../src/modules/emergency-medicine/scenarios';
import {
  DEFAULT_RENAL_ELECTROLYTE_SCENARIO_ID, RENAL_ELECTROLYTE_SCENARIOS, getRenalElectrolyteScenario,
} from '../../src/modules/renal-electrolyte/scenarios';

const id = 'hyperkalemia-cardioprotection-and-rebound';
const path = `/renal-electrolyte/scenario/${id}`;
const scenario = RENAL_ELECTROLYTE_SCENARIOS[0]!;
const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');
const json = (file: string) => JSON.parse(read(file));

describe('Renal and Electrolyte Medicine module foundation', () => {
  it('registers one separate preview toward twelve planned lessons', () => {
    expect(getModule('renal-electrolyte')).toMatchObject({ route: 'renal-electrolyte',
      displayName: 'Renal and Electrolyte Medicine', status: 'available',
      timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] } });
    expect(getModule('renal-electrolyte').plannedScope).toContain('Twelve bounded');
    expect(RENAL_ELECTROLYTE_SCENARIOS).toHaveLength(1);
    expect(DEFAULT_RENAL_ELECTROLYTE_SCENARIO_ID).toBe(id);
    expect(getRenalElectrolyteScenario(id)).toBe(scenario);
    expect(scenario.metadata).toMatchObject({ id, version: '0.1.0', maturity: 'preview' });
    expect(getRenalElectrolyteScenario('missing')).toBeUndefined();
    expect(getRenalElectrolyteScenario('hyperkalemia-with-ecg-change')).toBeUndefined();
  });

  it('publishes exact module and scenario search metadata without inventing review', () => {
    expect(routeFor('/renal-electrolyte')).toMatchObject({ indexable: true, structuredData: ['SoftwareApplication'] });
    expect(routeFor(path)).toMatchObject({ indexable: true, structuredData: ['LearningResource'] });
    expect(routeFor('/renal-electrolyte/scenario/missing')).toBeUndefined();
    expect(structuredDataFor(['SoftwareApplication'], '/renal-electrolyte')[0]).toMatchObject({
      name: 'Open Sim Lab Renal and Electrolyte Medicine', url: 'https://opensimlab.com/renal-electrolyte' });
    const resource = structuredDataFor(['LearningResource'], path)[0];
    expect(resource).toMatchObject({ url: `https://opensimlab.com${path}`, name: scenario.metadata.title,
      timeRequired: 'PT60M', teaches: scenario.metadata.objectives.map((objective) => objective.statement) });
    expect(JSON.stringify(resource)).not.toMatch(/aggregateRating|reviewCount|reviewer/);
  });

  it('server-renders both destinations, sources, and unsigned status without JavaScript', () => {
    const directory = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/renal-electrolyte' }));
    expect(directory).toContain(`href="${path}"`);
    expect(directory).toContain('Renal and Electrolyte Medicine simulator');
    const briefing = renderToStaticMarkup(createElement(PrerenderedBody, { path }));
    expect(briefing).toContain(scenario.metadata.title);
    expect(briefing).toContain('Not clinically reviewed');
    expect(briefing).toContain('UK Kidney Association');
    expect(briefing).toContain('href="/renal-electrolyte"');
  });

  it('mounts the live module and preserves unknown-address feedback', async () => {
    const { RenalElectrolyteRoute } = await import('@routes/AnesthesiaRoute');
    const directory = renderToStaticMarkup(createElement(RenalElectrolyteRoute, { path: '/renal-electrolyte' }));
    expect(directory).toContain('1 of 12 planned Renal and Electrolyte Medicine labs');
    expect(directory).toContain(`href="${path}"`);
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === ACKNOWLEDGEMENT_KEY ? 'true' : null });
    try {
      const unknown = renderToStaticMarkup(createElement(RenalElectrolyteRoute, { path: '/renal-electrolyte/scenario/missing' }));
      expect(unknown).toContain('missing');
      expect(unknown).not.toContain('Routine induction');
      expect(unknown).toContain('href="/renal-electrolyte"');
    } finally { vi.unstubAllGlobals(); }
  });

  it('keeps the additional navigation destination in the closed accessible disclosure', () => {
    expect(SITE_BAR_LINKS.filter((link) => link.href === '/renal-electrolyte')).toEqual([
      { href: '/renal-electrolyte', label: 'Renal + electrolyte' },
    ]);
    const markup = renderToStaticMarkup(createElement(SiteBar, { current: '/renal-electrolyte' }));
    expect(markup).toContain('class="skip-link"');
    expect(markup).toMatch(/href="\/renal-electrolyte"[^>]*aria-current="page"/);
    expect(markup).not.toMatch(/<details[^>]*\bopen/);
  });

  it('keeps registry, landing, routes, and published artifact counts aligned', () => {
    expect(availableModules()).toHaveLength(12);
    expect(READY_MODULE_COUNT).toBe(12);
    expect(READY_SCENARIO_COUNT).toBe(205);
    expect(reviewableItems().filter((item) => item.kind === 'scenario')).toHaveLength(205);
    expect(ROUTES).toHaveLength(230);
    expect(indexableRoutes()).toHaveLength(227);
    expect(PUBLIC_CATALOG_ARTIFACTS).toHaveLength(47);
    expect(new Set(PUBLIC_CATALOG_ARTIFACTS).size).toBe(47);
    expect(PUBLIC_CATALOG_ARTIFACTS).toEqual(expect.arrayContaining([
      '/catalog/renal-electrolyte-completion-audit.json', '/catalog/renal-electrolyte-quality-audit.json',
      '/catalog/renal-electrolyte-maturity.json',
    ]));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({ id, contentVersion: '0.1.0', domains: ['renal-electrolyte'] }));
  });

  it('publishes exact preview, quality-gap, maturity, and secure-report artifacts', () => {
    const completion = json('public/catalog/renal-electrolyte-completion-audit.json');
    const quality = json('public/catalog/renal-electrolyte-quality-audit.json');
    const maturity = json('public/catalog/renal-electrolyte-maturity.json');
    const reports = json('workers/reports/src/report-catalog.generated.json');
    expect(completion).toMatchObject({ moduleId: 'renal-electrolyte', scenarioCount: 1, completeScenarioCount: 0 });
    expect(completion.scenarios).toEqual([expect.objectContaining({ scenarioId: id, moduleId: 'renal-electrolyte',
      contentVersion: '0.1.0', maturity: 'preview', complete: false, fidelityClass: 'state_transition' })]);
    expect(quality).toMatchObject({ moduleId: 'renal-electrolyte', scenarioCount: 1, playableScenarioCount: 0 });
    expect(quality.scenarios[0].qualityRecords).toHaveLength(4);
    expect(quality.scenarios[0].qualityRecords.every((record: { status: string }) => record.status === 'missing')).toBe(true);
    expect(maturity).toMatchObject({ moduleId: 'renal-electrolyte', recordCount: 1,
      records: [expect.objectContaining({ subjectId: id, contentVersion: '0.1.0', status: 'preview' })] });
    expect(reports.scenarios).toHaveLength(213);
    expect(reports.scenarios).toContainEqual(expect.objectContaining({ moduleId: 'renal-electrolyte', scenarioId: id,
      contentVersion: '0.1.0', maturity: 'preview' }));
    expect(json('public/catalog/scenario-report-catalog.json')).toEqual(reports);
  });

  it('preserves the existing emergency-medicine scenario, source bytes, and route identity', () => {
    const old = getEmergencyMedicineScenario('hyperkalemia-with-ecg-change')!;
    expect(old.metadata).toMatchObject({ id: 'hyperkalemia-with-ecg-change', version: '0.1.0', estimatedMinutes: 9 });
    expect(old).not.toBe(scenario);
    expect(routeFor('/emergency-medicine/scenario/hyperkalemia-with-ecg-change')).toBeDefined();
    expect(createHash('sha256').update(read('src/modules/emergency-medicine/scenarios/hyperkalemia-with-ecg-change.ts')).digest('hex'))
      .toBe('a44d6d103b64d6465a62c760fc98caa9f01aadbdaa0a71895a756995cf0a6214');
    expect(json('workers/reports/src/report-catalog.generated.json').scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'emergency-medicine', scenarioId: 'hyperkalemia-with-ecg-change', contentVersion: '0.1.0',
    }));
  });
});

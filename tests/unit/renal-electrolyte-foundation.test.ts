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
import { validateScenario } from '@anesthesia/scenarios/schema';
import {
  DEFAULT_RENAL_ELECTROLYTE_SCENARIO_ID, RENAL_ELECTROLYTE_SCENARIOS, getRenalElectrolyteScenario,
} from '../../src/modules/renal-electrolyte/scenarios';

const id = 'hyperkalemia-cardioprotection-and-rebound';
const path = `/renal-electrolyte/scenario/${id}`;
const scenario = RENAL_ELECTROLYTE_SCENARIOS[0]!;
const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');
const json = (file: string) => JSON.parse(read(file));

describe('Renal and Electrolyte Medicine module foundation', () => {
  it('registers three separate previews toward twelve planned lessons without changing the default', () => {
    expect(getModule('renal-electrolyte')).toMatchObject({ route: 'renal-electrolyte',
      displayName: 'Renal and Electrolyte Medicine', status: 'available',
      timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] } });
    expect(getModule('renal-electrolyte').plannedScope).toContain('Twelve bounded');
    expect(RENAL_ELECTROLYTE_SCENARIOS).toHaveLength(3);
    expect(RENAL_ELECTROLYTE_SCENARIOS.map(({ metadata }) => metadata.id)).toEqual([
      id, 'hypokalemia-magnesium-and-ongoing-losses', 'hyponatremia-symptoms-and-reassessment',
    ]);
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

  it('adds severe hypokalemia as its own sourced, discoverable lesson rather than a refeeding alias', () => {
    const next = getRenalElectrolyteScenario('hypokalemia-magnesium-and-ongoing-losses')!;
    expect(validateScenario(next)).toEqual([]);
    expect(next.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview', estimatedMinutes: 60 });
    expect(next.metadata.objectives.map((objective) => objective.id)).toEqual([
      'renal-hypokalemia-replacement', 'renal-hypokalemia-magnesium', 'renal-hypokalemia-losses',
      'renal-hypokalemia-reassessment', 'renal-hypokalemia-handoff',
    ]);
    expect(next.metadata.clinicalReview.sources).toHaveLength(4);
    expect(next.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(next.metadata.limitations).toEqual(['renal-hypokalemia-authored-contrasts',
      'renal-hypokalemia-individualized-care', 'renal-hypokalemia-observed-findings']);
    expect(next.patient).toMatchObject({ ageYears: 54, sex: 'female', weightKg: 64, heightCm: 168 });
    expect(next.timeline.map((event) => event.target)).toEqual(['renal-hypokalemia', 'renal-hypokalemia-boundary']);
    expect(next.patient.medications?.join(' ')).toContain('Hydrochlorothiazide');
    expect(next.patient.comorbidities?.join(' ')).toContain('Diarrhea for 4 days');
    expect(getRenalElectrolyteScenario('refeeding-electrolyte-shift')).toBeUndefined();
    const nextPath = `/renal-electrolyte/scenario/${next.metadata.id}`;
    expect(routeFor(nextPath)).toMatchObject({ indexable: true, heading: next.metadata.title });
    expect(structuredDataFor(['LearningResource'], nextPath)[0]).toMatchObject({
      name: next.metadata.title, url: `https://opensimlab.com${nextPath}`, timeRequired: 'PT60M',
    });
    expect(renderToStaticMarkup(createElement(PrerenderedBody, { path: nextPath }))).toContain('NHS Specialist Pharmacy Service');
    expect(reviewableItems()).toContainEqual(expect.objectContaining({ id: next.metadata.id,
      contentVersion: '0.1.0', domains: ['renal-electrolyte'] }));
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

  it('adds a distinct persistent-symptom hyponatremia lesson with its full observation duration', () => {
    const next = getRenalElectrolyteScenario('hyponatremia-symptoms-and-reassessment')!;
    expect(validateScenario(next)).toEqual([]);
    expect(next.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview', estimatedMinutes: 90 });
    expect(next.metadata.objectives.map((objective) => objective.id)).toEqual([
      'renal-hyponatremia-rescue', 'renal-hyponatremia-context', 'renal-hyponatremia-reassessment',
      'renal-hyponatremia-persistent', 'renal-hyponatremia-handoff',
    ]);
    expect(next.metadata.clinicalReview.sources).toHaveLength(3);
    expect(next.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(next.metadata.limitations).toEqual(['renal-hyponatremia-authored-contrasts',
      'renal-hyponatremia-persistent-symptoms', 'renal-hyponatremia-observed-findings']);
    expect(next.patient).toMatchObject({ ageYears: 70, sex: 'female', weightKg: 58, heightCm: 163 });
    expect(next.timeline.map((event) => event.target)).toEqual(['renal-hyponatremia', 'renal-hyponatremia-boundary']);
    const boundary = next.timeline[1]!.message;
    expect(boundary).toContain('Headache, nausea, and confusion persist');
    expect(boundary).toContain('not an automatic treatment-stop rule');
    expect(next.patient.comorbidities?.join(' ')).toContain('Contemporaneous pretreatment');
    expect(getRenalElectrolyteScenario('severe-hyponatremia-with-seizure')).toBeUndefined();
    expect(getRenalElectrolyteScenario('hyponatremia-aquaresis-and-overcorrection')).toBeUndefined();
    expect(routeFor('/emergency-medicine/scenario/severe-hyponatremia-with-seizure')).toBeDefined();
    expect(routeFor('/endocrine-metabolic/scenario/hyponatremia-aquaresis-and-overcorrection')).toBeDefined();
    const nextPath = `/renal-electrolyte/scenario/${next.metadata.id}`;
    expect(routeFor(nextPath)).toMatchObject({ indexable: true, heading: next.metadata.title });
    expect(structuredDataFor(['LearningResource'], nextPath)[0]).toMatchObject({
      name: next.metadata.title, url: `https://opensimlab.com${nextPath}`, timeRequired: 'PT90M',
    });
    const markup = renderToStaticMarkup(createElement(PrerenderedBody, { path: nextPath }));
    expect(markup).toContain('Society for Endocrinology');
    expect(markup).toContain('Not clinically reviewed');
    expect(reviewableItems()).toContainEqual(expect.objectContaining({ id: next.metadata.id,
      contentVersion: '0.1.0', domains: ['renal-electrolyte'] }));
  });

  it('mounts the live module and preserves unknown-address feedback', async () => {
    const { RenalElectrolyteRoute } = await import('@routes/AnesthesiaRoute');
    const directory = renderToStaticMarkup(createElement(RenalElectrolyteRoute, { path: '/renal-electrolyte' }));
    expect(directory).toContain('3 of 12 planned Renal and Electrolyte Medicine labs');
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

  it('binds hypokalemia completion to the exact scenario and capability without claiming pending gates', async () => {
    const { renalHypokalemiaCompletionEvidence } = await import('../../src/modules/renal-electrolyte/hypokalemia-completion');
    const next = getRenalElectrolyteScenario('hypokalemia-magnesium-and-ongoing-losses')!;
    const evidence = renalHypokalemiaCompletionEvidence(next, '0.1.0-alpha.48', 'renal-electrolyte');
    expect(evidence).toHaveLength(9);
    expect(evidence.filter((item) => item.status === 'satisfied')).toHaveLength(7);
    expect(evidence.filter((item) => item.status === 'missing').map((item) => item.id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(renalHypokalemiaCompletionEvidence(next, '0.1.0-alpha.49', 'renal-electrolyte')).toEqual([]);
    expect(renalHypokalemiaCompletionEvidence(next, '0.1.0-alpha.48', 'endocrine-metabolic')).toEqual([]);
    expect(renalHypokalemiaCompletionEvidence(scenario, '0.1.0-alpha.48', 'renal-electrolyte')).toEqual([]);
    expect(renalHypokalemiaCompletionEvidence({ ...next, metadata: { ...next.metadata, version: '0.1.1' } },
      '0.1.0-alpha.48', 'renal-electrolyte')).toEqual([]);
    expect(renalHypokalemiaCompletionEvidence({ ...next, patient: { ...next.patient, weightKg: 65 } },
      '0.1.0-alpha.48', 'renal-electrolyte')).toEqual([]);
  });

  it('keeps registry, landing, routes, and published artifact counts aligned', () => {
    expect(availableModules()).toHaveLength(12);
    expect(READY_MODULE_COUNT).toBe(12);
    expect(READY_SCENARIO_COUNT).toBe(207);
    expect(reviewableItems().filter((item) => item.kind === 'scenario')).toHaveLength(207);
    expect(ROUTES).toHaveLength(232);
    expect(indexableRoutes()).toHaveLength(229);
    expect(PUBLIC_CATALOG_ARTIFACTS).toHaveLength(47);
    expect(new Set(PUBLIC_CATALOG_ARTIFACTS).size).toBe(47);
    expect(PUBLIC_CATALOG_ARTIFACTS).toEqual(expect.arrayContaining([
      '/catalog/renal-electrolyte-completion-audit.json', '/catalog/renal-electrolyte-quality-audit.json',
      '/catalog/renal-electrolyte-maturity.json',
    ]));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({ id, contentVersion: '0.1.0', domains: ['renal-electrolyte'] }));
  });

  it('binds hyponatremia completion without promoting pending verification or a changed patient', async () => {
    const { renalHyponatremiaCompletionEvidence } = await import('../../src/modules/renal-electrolyte/hyponatremia-completion');
    const next = getRenalElectrolyteScenario('hyponatremia-symptoms-and-reassessment')!;
    const evidence = renalHyponatremiaCompletionEvidence(next, '0.1.0-alpha.48', 'renal-electrolyte');
    expect(evidence).toHaveLength(9);
    expect(evidence.filter((item) => item.status === 'satisfied')).toHaveLength(7);
    expect(evidence.filter((item) => item.status === 'missing').map((item) => item.id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(renalHyponatremiaCompletionEvidence(next, '0.1.0-alpha.49', 'renal-electrolyte')).toEqual([]);
    expect(renalHyponatremiaCompletionEvidence(next, '0.1.0-alpha.48', 'endocrine-metabolic')).toEqual([]);
    expect(renalHyponatremiaCompletionEvidence(scenario, '0.1.0-alpha.48', 'renal-electrolyte')).toEqual([]);
    expect(renalHyponatremiaCompletionEvidence({ ...next, metadata: { ...next.metadata, version: '0.1.1' } },
      '0.1.0-alpha.48', 'renal-electrolyte')).toEqual([]);
    expect(renalHyponatremiaCompletionEvidence({ ...next, patient: { ...next.patient, weightKg: 59 } },
      '0.1.0-alpha.48', 'renal-electrolyte')).toEqual([]);
  });

  it('publishes exact preview, quality-gap, maturity, and secure-report artifacts', () => {
    const completion = json('public/catalog/renal-electrolyte-completion-audit.json');
    const quality = json('public/catalog/renal-electrolyte-quality-audit.json');
    const maturity = json('public/catalog/renal-electrolyte-maturity.json');
    const reports = json('workers/reports/src/report-catalog.generated.json');
    expect(completion).toMatchObject({ moduleId: 'renal-electrolyte', scenarioCount: 3, completeScenarioCount: 0 });
    expect(completion.scenarios).toHaveLength(3);
    expect(quality).toMatchObject({ moduleId: 'renal-electrolyte', scenarioCount: 3, playableScenarioCount: 0 });
    expect(maturity).toMatchObject({ moduleId: 'renal-electrolyte', recordCount: 3 });
    for (const { metadata } of RENAL_ELECTROLYTE_SCENARIOS) {
      expect(completion.scenarios).toContainEqual(expect.objectContaining({ scenarioId: metadata.id, moduleId: 'renal-electrolyte',
        contentVersion: metadata.version, maturity: 'preview', complete: false, fidelityClass: 'state_transition' }));
      const audit = quality.scenarios.find((entry: { scenarioId: string }) => entry.scenarioId === metadata.id);
      expect(audit.qualityRecords).toHaveLength(4);
      expect(audit.qualityRecords.every((record: { status: string }) => record.status === 'missing')).toBe(true);
      expect(maturity.records).toContainEqual(expect.objectContaining({ subjectId: metadata.id,
        contentVersion: metadata.version, status: 'preview' }));
      expect(reports.scenarios).toContainEqual(expect.objectContaining({ moduleId: 'renal-electrolyte', scenarioId: metadata.id,
        contentVersion: metadata.version, maturity: 'preview' }));
    }
    expect(reports.scenarios).toHaveLength(215);
    const prior214 = reports.scenarios.filter((entry: { moduleId: string; scenarioId: string }) =>
      !(entry.moduleId === 'renal-electrolyte' && entry.scenarioId === 'hyponatremia-symptoms-and-reassessment'));
    expect(prior214).toHaveLength(214);
    expect(createHash('sha256').update(JSON.stringify(prior214)).digest('hex'))
      .toBe('6c3837a334e870c3d4b2b477c5a838b32a753e5a1fcc0991b7970bbadc94f337');
    const existing = prior214.filter((entry: { moduleId: string; scenarioId: string }) =>
      !(entry.moduleId === 'renal-electrolyte' && entry.scenarioId === 'hypokalemia-magnesium-and-ongoing-losses'));
    expect(existing).toHaveLength(213);
    expect(createHash('sha256').update(JSON.stringify(existing)).digest('hex'))
      .toBe('1fe87e23cf534d55167965728d29775cc2f2a64297c208ac0e96b0bac45c9daf');
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

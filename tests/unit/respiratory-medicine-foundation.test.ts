import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PUBLIC_CATALOG_ARTIFACTS } from '@platform/catalog/public-artifacts';
import { reviewableItems } from '@platform/governance/records';
import { MODULES, availableModules } from '@platform/modules/registry';
import { ROUTES, canonicalUrl, routeFor } from '@routes/routes';

const root = process.cwd();
const moduleId = 'respiratory-medicine';
const scenarioId = 'acute-severe-asthma';
const transitionScenarioId = 'copd-exacerbation-transition-reassessment';
const capScenarioId = 'community-acquired-pneumonia-hypoxemia-reassessment';
const postPeScenarioId = 'post-pulmonary-embolism-persistent-dyspnea';
const apeSupportScenarioId = 'acute-pulmonary-edema-respiratory-support-reassessment';
const postTensionScenarioId = 'spontaneous-tension-pneumothorax-post-drainage-reassessment';
const modulePath = `/${moduleId}`;
const scenarioPath = `${modulePath}/scenario/${scenarioId}`;

function source(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

function json(path: string): unknown {
  return JSON.parse(source(path));
}

describe('respiratory medicine module foundation', () => {
  it('registers one available specialty module and six honest scenarios', () => {
    const module = MODULES.find((entry) => entry.id === moduleId);
    expect(module).toMatchObject({
      id: moduleId,
      route: moduleId,
      displayName: 'Respiratory medicine',
      status: 'available',
    });
    expect(module?.description.toLowerCase()).toContain('respiratory');
    expect(module?.audience.length).toBeGreaterThan(10);
    expect(module?.prerequisites.length).toBeGreaterThan(10);
    expect(availableModules().map((entry) => entry.id)).toContain(moduleId);

    const indexPath = 'src/modules/respiratory-medicine/scenarios/index.ts';
    expect(existsSync(join(root, indexPath))).toBe(true);
    const index = source(indexPath);
    expect(index).toContain('RESPIRATORY_MEDICINE_SCENARIOS');
    expect(index).toContain('DEFAULT_RESPIRATORY_MEDICINE_SCENARIO_ID');
    expect(index).toContain('getRespiratoryMedicineScenario');
    expect(index).toContain('ACUTE_SEVERE_ASTHMA');
    expect(index).toContain('COPD_EXACERBATION_TRANSITION_REASSESSMENT');
    expect(index).toContain('COMMUNITY_ACQUIRED_PNEUMONIA_HYPOXEMIA_REASSESSMENT');
    expect(index).toContain('POST_PULMONARY_EMBOLISM_PERSISTENT_DYSPNEA');
    expect(index).toContain('ACUTE_PULMONARY_EDEMA_RESPIRATORY_SUPPORT_REASSESSMENT');
    expect(index).toContain('SPONTANEOUS_TENSION_PNEUMOTHORAX_POST_DRAINAGE_REASSESSMENT');
  });

  it('publishes distinct, canonical, indexable module and scenario routes', () => {
    expect(routeFor(modulePath)).toMatchObject({
      path: modulePath,
      indexable: true,
      structuredData: ['SoftwareApplication'],
      heading: 'Respiratory medicine simulator',
    });
    expect(routeFor(scenarioPath)).toMatchObject({
      path: scenarioPath,
      indexable: true,
      structuredData: ['LearningResource'],
    });
    expect(canonicalUrl(scenarioPath))
      .toBe('https://opensimlab.com/respiratory-medicine/scenario/acute-severe-asthma');
    expect(ROUTES.filter((route) => route.path.startsWith(`${modulePath}/scenario/`)))
      .toHaveLength(6);
    expect(new Set(ROUTES.map((route) => route.path)).size).toBe(ROUTES.length);
    expect(new Set(ROUTES.map((route) => route.title)).size).toBe(ROUTES.length);
  });

  it('mounts the module through every interactive and prerender route seam', () => {
    const app = source('src/routes/App.tsx');
    expect(app).toContain('RespiratoryMedicineRoute');
    expect(app).toContain("path === '/respiratory-medicine'");

    const clinicalRoute = source('src/routes/AnesthesiaRoute.tsx');
    expect(clinicalRoute).toContain('RESPIRATORY_MEDICINE_CONFIG');
    expect(clinicalRoute).toContain('RESPIRATORY_MEDICINE_SCENARIOS');
    expect(clinicalRoute).toContain('export function RespiratoryMedicineRoute');
    expect(clinicalRoute).toContain('`${RESPIRATORY_MEDICINE_SCENARIOS.length} bounded respiratory medicine labs are playable.`');

    const prerendered = source('src/routes/Prerendered.tsx');
    expect(prerendered).toContain("path === '/respiratory-medicine'");
    expect(prerendered).toContain("path.startsWith('/respiratory-medicine/scenario/')");
  });

  it('includes the exact-version scenario in governance and problem-report catalogs', () => {
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: scenarioId,
      kind: 'scenario',
      contentVersion: '0.1.0',
      domains: [moduleId],
    }));

    for (const path of [
      'public/catalog/scenario-report-catalog.json',
      'workers/reports/src/report-catalog.generated.json',
    ]) {
      const catalog = json(path) as {
        scenarios: Array<{ moduleId: string; scenarioId: string; contentVersion: string }>;
      };
      expect(catalog.scenarios).toContainEqual(expect.objectContaining({
        moduleId,
        scenarioId,
        contentVersion: '0.1.0',
      }));
      expect(catalog.scenarios.filter((entry) => entry.moduleId === moduleId)).toHaveLength(6);
      expect(catalog.scenarios).toContainEqual(expect.objectContaining({
        moduleId, scenarioId: transitionScenarioId, contentVersion: '0.1.0',
      }));
      expect(catalog.scenarios).toContainEqual(expect.objectContaining({
        moduleId, scenarioId: capScenarioId, contentVersion: '0.1.0',
      }));
      expect(catalog.scenarios).toContainEqual(expect.objectContaining({
        moduleId, scenarioId: postPeScenarioId, contentVersion: '0.1.0',
      }));
      expect(catalog.scenarios).toContainEqual(expect.objectContaining({
        moduleId, scenarioId: apeSupportScenarioId, contentVersion: '0.1.0',
      }));
      expect(catalog.scenarios).toContainEqual(expect.objectContaining({
        moduleId, scenarioId: postTensionScenarioId, contentVersion: '0.1.0',
      }));
    }
  });

  it('publishes completion, quality, and maturity artifacts for the new module', () => {
    const names = [
      'respiratory-medicine-completion-audit.json',
      'respiratory-medicine-quality-audit.json',
      'respiratory-medicine-maturity.json',
    ];
    for (const name of names) {
      expect(PUBLIC_CATALOG_ARTIFACTS).toContain(`/catalog/${name}`);
      expect(existsSync(join(root, 'public/catalog', name))).toBe(true);
    }

    const completion = json('public/catalog/respiratory-medicine-completion-audit.json') as {
      moduleId: string; scenarioCount: number;
      scenarios: Array<{ scenarioId: string; moduleId: string }>;
    };
    expect(completion).toMatchObject({ moduleId, scenarioCount: 6 });
    expect(completion.scenarios).toEqual(expect.arrayContaining([
      expect.objectContaining({ scenarioId, moduleId }),
      expect.objectContaining({ scenarioId: transitionScenarioId, moduleId }),
      expect.objectContaining({ scenarioId: capScenarioId, moduleId }),
      expect.objectContaining({ scenarioId: postPeScenarioId, moduleId }),
      expect.objectContaining({ scenarioId: apeSupportScenarioId, moduleId }),
      expect.objectContaining({ scenarioId: postTensionScenarioId, moduleId }),
    ]));

    const quality = json('public/catalog/respiratory-medicine-quality-audit.json') as {
      moduleId: string; scenarioCount: number;
    };
    expect(quality).toMatchObject({ moduleId, scenarioCount: 6 });
    const maturity = json('public/catalog/respiratory-medicine-maturity.json') as {
      moduleId: string; recordCount: number;
      records: Array<{ subjectKind: string; subjectId: string; status: string }>;
    };
    expect(maturity).toMatchObject({ moduleId, recordCount: 6 });
    expect(maturity.records).toContainEqual(expect.objectContaining({
      subjectKind: 'scenario', subjectId: scenarioId, status: 'draft',
    }));
    expect(maturity.records).toContainEqual(expect.objectContaining({
      subjectKind: 'scenario', subjectId: transitionScenarioId, status: 'draft',
    }));
    expect(maturity.records).toContainEqual(expect.objectContaining({
      subjectKind: 'scenario', subjectId: capScenarioId, status: 'draft',
    }));
    expect(maturity.records).toContainEqual(expect.objectContaining({
      subjectKind: 'scenario', subjectId: postPeScenarioId, status: 'draft',
    }));
    expect(maturity.records).toContainEqual(expect.objectContaining({
      subjectKind: 'scenario', subjectId: apeSupportScenarioId, status: 'draft',
    }));
  });

  it('keeps catalog generation and release review gates registry-complete', () => {
    const generator = source('scripts/build-completion-catalog.ts');
    for (const text of [
      'RESPIRATORY_MEDICINE_SCENARIOS',
      "'respiratory-medicine'",
      'respiratory-medicine-completion-audit.json',
      'respiratory-medicine-quality-audit.json',
      'respiratory-medicine-maturity.json',
    ]) expect(generator).toContain(text);

    const gate = source('scripts/check-review-gate.ts');
    expect(gate).toContain('RESPIRATORY_MEDICINE_SCENARIOS');
    expect(gate).toContain("'respiratory-medicine'");
    expect(gate).toContain('respiratoryMedicineCompletion');
  });
});

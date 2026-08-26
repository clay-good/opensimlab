import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getModule } from '@platform/modules/registry';
import { routeFor } from '@routes/routes';
import { canonicalUrl } from '@routes/site-metadata';
import { reviewableItems } from '@platform/governance/records';
import {
  DEFAULT_PEDIATRICS_SCENARIO_ID, PEDIATRICS_SCENARIOS, getPediatricsScenario,
} from '../../src/modules/pediatrics/scenarios';

const json = (path: string) => JSON.parse(readFileSync(join(process.cwd(), path), 'utf8'));

describe('Pediatrics module foundation', () => {
  it('registers one available, bounded lab behind an exact module contract', () => {
    expect(getModule('pediatrics')).toMatchObject({
      route: 'pediatrics', displayName: 'Pediatrics', status: 'available',
    });
    expect(PEDIATRICS_SCENARIOS).toHaveLength(1);
    expect(DEFAULT_PEDIATRICS_SCENARIO_ID).toBe('pediatric-respiratory-distress');
    expect(getPediatricsScenario(DEFAULT_PEDIATRICS_SCENARIO_ID))
      .toBe(PEDIATRICS_SCENARIOS[0]);
  });

  it('publishes unique indexable module and LearningResource routes with exact canonicals', () => {
    const moduleRoute = routeFor('/pediatrics')!;
    const scenarioRoute = routeFor('/pediatrics/scenario/pediatric-respiratory-distress')!;
    expect(moduleRoute).toMatchObject({ indexable: true, heading: 'Pediatrics simulator',
      structuredData: ['SoftwareApplication'] });
    expect(scenarioRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric respiratory distress', structuredData: ['LearningResource'] });
    expect(scenarioRoute.description.length).toBeGreaterThanOrEqual(110);
    expect(scenarioRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(scenarioRoute.path))
      .toBe('https://opensimlab.com/pediatrics/scenario/pediatric-respiratory-distress');
  });

  it('publishes exact completion, quality, maturity, and report records', () => {
    const completion = json('public/catalog/pediatrics-completion-audit.json');
    const quality = json('public/catalog/pediatrics-quality-audit.json');
    const maturity = json('public/catalog/pediatrics-maturity.json');
    const reports = json('public/catalog/scenario-report-catalog.json');
    expect(completion).toMatchObject({ moduleId: 'pediatrics', scenarioCount: 1 });
    expect(quality).toMatchObject({ scenarioCount: 1 });
    expect(maturity).toMatchObject({ recordCount: 1 });
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-respiratory-distress',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-respiratory-distress', domains: ['pediatrics'],
    }));
  });
});

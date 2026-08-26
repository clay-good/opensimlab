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
  it('registers three available, bounded labs behind an exact module contract', () => {
    expect(getModule('pediatrics')).toMatchObject({
      route: 'pediatrics', displayName: 'Pediatrics', status: 'available',
    });
    expect(PEDIATRICS_SCENARIOS).toHaveLength(3);
    expect(DEFAULT_PEDIATRICS_SCENARIO_ID).toBe('pediatric-respiratory-distress');
    expect(getPediatricsScenario(DEFAULT_PEDIATRICS_SCENARIO_ID))
      .toBe(PEDIATRICS_SCENARIOS[0]);
  });

  it('publishes unique indexable module and LearningResource routes with exact canonicals', () => {
    const moduleRoute = routeFor('/pediatrics')!;
    const scenarioRoute = routeFor('/pediatrics/scenario/pediatric-respiratory-distress')!;
    const bronchiolitisRoute = routeFor('/pediatrics/scenario/bronchiolitis')!;
    const croupRoute = routeFor('/pediatrics/scenario/croup')!;
    expect(moduleRoute).toMatchObject({ indexable: true, heading: 'Pediatrics simulator',
      structuredData: ['SoftwareApplication'] });
    expect(scenarioRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric respiratory distress', structuredData: ['LearningResource'] });
    expect(scenarioRoute.description.length).toBeGreaterThanOrEqual(110);
    expect(scenarioRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(scenarioRoute.path))
      .toBe('https://opensimlab.com/pediatrics/scenario/pediatric-respiratory-distress');
    expect(bronchiolitisRoute).toMatchObject({ indexable: true, heading: 'Bronchiolitis',
      structuredData: ['LearningResource'] });
    expect(bronchiolitisRoute.description.length).toBeGreaterThanOrEqual(110);
    expect(bronchiolitisRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(bronchiolitisRoute.path))
      .toBe('https://opensimlab.com/pediatrics/scenario/bronchiolitis');
    expect(croupRoute).toMatchObject({ indexable: true, heading: 'Croup with stridor at rest',
      structuredData: ['LearningResource'] });
    expect(croupRoute.description.length).toBeGreaterThanOrEqual(110);
    expect(croupRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(croupRoute.path))
      .toBe('https://opensimlab.com/pediatrics/scenario/croup');
  });

  it('publishes exact completion, quality, maturity, and report records', () => {
    const completion = json('public/catalog/pediatrics-completion-audit.json');
    const quality = json('public/catalog/pediatrics-quality-audit.json');
    const maturity = json('public/catalog/pediatrics-maturity.json');
    const reports = json('public/catalog/scenario-report-catalog.json');
    expect(completion).toMatchObject({ moduleId: 'pediatrics', scenarioCount: 3 });
    expect(quality).toMatchObject({ scenarioCount: 3 });
    expect(maturity).toMatchObject({ recordCount: 3 });
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-respiratory-distress',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'bronchiolitis',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'croup',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-respiratory-distress', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'bronchiolitis', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'croup', domains: ['pediatrics'],
    }));
  });
});

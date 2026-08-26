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
  it('registers six available, bounded labs behind an exact module contract', () => {
    expect(getModule('pediatrics')).toMatchObject({
      route: 'pediatrics', displayName: 'Pediatrics', status: 'available',
    });
    expect(PEDIATRICS_SCENARIOS).toHaveLength(6);
    expect(DEFAULT_PEDIATRICS_SCENARIO_ID).toBe('pediatric-respiratory-distress');
    expect(getPediatricsScenario(DEFAULT_PEDIATRICS_SCENARIO_ID))
      .toBe(PEDIATRICS_SCENARIOS[0]);
  });

  it('publishes unique indexable module and LearningResource routes with exact canonicals', () => {
    const moduleRoute = routeFor('/pediatrics')!;
    const scenarioRoute = routeFor('/pediatrics/scenario/pediatric-respiratory-distress')!;
    const bronchiolitisRoute = routeFor('/pediatrics/scenario/bronchiolitis')!;
    const croupRoute = routeFor('/pediatrics/scenario/croup')!;
    const statusAsthmaticusRoute = routeFor(
      '/pediatrics/scenario/pediatric-status-asthmaticus')!;
    const sepsisRoute = routeFor('/pediatrics/scenario/pediatric-sepsis')!;
    const septicShockRoute = routeFor('/pediatrics/scenario/pediatric-septic-shock')!;
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
    expect(statusAsthmaticusRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric status asthmaticus after initial care',
      structuredData: ['LearningResource'] });
    expect(statusAsthmaticusRoute.description.length).toBeGreaterThanOrEqual(110);
    expect(statusAsthmaticusRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(statusAsthmaticusRoute.path))
      .toBe('https://opensimlab.com/pediatrics/scenario/pediatric-status-asthmaticus');
    expect(sepsisRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric sepsis without shock', structuredData: ['LearningResource'] });
    expect(sepsisRoute.description.length).toBeGreaterThanOrEqual(110);
    expect(sepsisRoute.description.length).toBeLessThanOrEqual(160);
    expect(sepsisRoute.description).toBe(
      'A 6-year-old boy for calm pediatric sepsis recognition without shock, qualified-care reconciliation, serial reassessment, and active-risk handoff.',
    );
    expect(canonicalUrl(sepsisRoute.path))
      .toBe('https://opensimlab.com/pediatrics/scenario/pediatric-sepsis');
    expect(septicShockRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric septic shock', structuredData: ['LearningResource'] });
    expect(septicShockRoute.description.length).toBeGreaterThanOrEqual(110);
    expect(septicShockRoute.description.length).toBeLessThanOrEqual(160);
    expect(septicShockRoute.description).not.toMatch(/\.\.\.$/);
    expect(canonicalUrl(septicShockRoute.path))
      .toBe('https://opensimlab.com/pediatrics/scenario/pediatric-septic-shock');
  });

  it('publishes exact completion, quality, maturity, and report records', () => {
    const completion = json('public/catalog/pediatrics-completion-audit.json');
    const quality = json('public/catalog/pediatrics-quality-audit.json');
    const maturity = json('public/catalog/pediatrics-maturity.json');
    const reports = json('public/catalog/scenario-report-catalog.json');
    expect(completion).toMatchObject({ moduleId: 'pediatrics', scenarioCount: 6 });
    expect(quality).toMatchObject({ scenarioCount: 6 });
    expect(maturity).toMatchObject({ recordCount: 6 });
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
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-status-asthmaticus',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-sepsis',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-septic-shock',
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
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-status-asthmaticus', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-sepsis', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-septic-shock', domains: ['pediatrics'],
    }));
  });
});

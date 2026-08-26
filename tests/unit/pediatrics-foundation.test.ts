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
  it('registers sixteen available, bounded labs behind an exact module contract', () => {
    expect(getModule('pediatrics')).toMatchObject({
      route: 'pediatrics', displayName: 'Pediatrics', status: 'available',
    });
    expect(PEDIATRICS_SCENARIOS).toHaveLength(16);
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
    const dehydrationRoute = routeFor(
      '/pediatrics/scenario/pediatric-dehydration-with-hypovolemia')!;
    const dkaRoute = routeFor('/pediatrics/scenario/pediatric-diabetic-ketoacidosis')!;
    const hypoglycemicSeizureRoute = routeFor(
      '/pediatrics/scenario/pediatric-hypoglycemic-seizure')!;
    const febrileSeizureRoute = routeFor(
      '/pediatrics/scenario/pediatric-febrile-seizure')!;
    const statusEpilepticusRoute = routeFor(
      '/pediatrics/scenario/pediatric-status-epilepticus')!;
    const anaphylaxisRoute = routeFor('/pediatrics/scenario/pediatric-anaphylaxis')!;
    const svtRoute = routeFor(
      '/pediatrics/scenario/pediatric-supraventricular-tachycardia')!;
    const bradycardicArrestRoute = routeFor(
      '/pediatrics/scenario/pediatric-bradycardic-arrest')!;
    const foreignBodyAirwayObstructionRoute = routeFor(
      '/pediatrics/scenario/pediatric-foreign-body-airway-obstruction')!;
    const safeguardingRoute = routeFor(
      '/pediatrics/scenario/pediatric-injury-safeguarding-escalation')!;
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
    expect(dehydrationRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric dehydration with hypovolemia',
      structuredData: ['LearningResource'] });
    expect(dehydrationRoute.description).toBe(
      'A 2-year-old girl for calm pediatric dehydration and hypovolemia recognition, qualified rehydration coordination, serial reassessment, and active-risk handoff.',
    );
    expect(dehydrationRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(dehydrationRoute.path)).toBe(
      'https://opensimlab.com/pediatrics/scenario/pediatric-dehydration-with-hypovolemia');
    expect(dkaRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric diabetic ketoacidosis', structuredData: ['LearningResource'] });
    expect(dkaRoute.description).toBe(
      'A 9-year-old girl for calm pediatric diabetic ketoacidosis recognition, qualified escalation, serial safety reassessment, and active-risk handoff.',
    );
    expect(dkaRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(dkaRoute.path)).toBe(
      'https://opensimlab.com/pediatrics/scenario/pediatric-diabetic-ketoacidosis');
    expect(hypoglycemicSeizureRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric hypoglycemic seizure', structuredData: ['LearningResource'] });
    expect(hypoglycemicSeizureRoute.description).toBe(
      'A 5-year-old boy for calm pediatric hypoglycemic seizure recognition, qualified rescue coordination, serial reassessment, and active-risk handoff.',
    );
    expect(hypoglycemicSeizureRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(hypoglycemicSeizureRoute.path)).toBe(
      'https://opensimlab.com/pediatrics/scenario/pediatric-hypoglycemic-seizure');
    expect(febrileSeizureRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric febrile seizure', structuredData: ['LearningResource'] });
    expect(febrileSeizureRoute.description).toBe(
      'A 2-year-old boy for calm pediatric febrile seizure recognition, recovery reassessment, red-flag review, and caregiver-centered handoff.',
    );
    expect(febrileSeizureRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(febrileSeizureRoute.path)).toBe(
      'https://opensimlab.com/pediatrics/scenario/pediatric-febrile-seizure');
    expect(statusEpilepticusRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric status epilepticus after first-line care',
      structuredData: ['LearningResource'] });
    expect(statusEpilepticusRoute.description).toBe(
      'A 6-year-old girl for calm pediatric convulsive status recognition after first-line care, qualified escalation, serial reassessment, and active-risk handoff.',
    );
    expect(statusEpilepticusRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(statusEpilepticusRoute.path)).toBe(
      'https://opensimlab.com/pediatrics/scenario/pediatric-status-epilepticus');
    expect(anaphylaxisRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric anaphylaxis after first-line care',
      structuredData: ['LearningResource'] });
    expect(anaphylaxisRoute.description).toBe(
      'A 6-year-old boy for calm pediatric anaphylaxis recognition after first-line care, qualified escalation, reassessment, and caregiver handoff.',
    );
    expect(anaphylaxisRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(anaphylaxisRoute.path)).toBe(
      'https://opensimlab.com/pediatrics/scenario/pediatric-anaphylaxis');
    expect(svtRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric supraventricular tachycardia with perfusion compromise',
      structuredData: ['LearningResource'] });
    expect(svtRoute.description).toBe(
      'A 6-year-old boy for calm pediatric rhythm and whole-child recognition, qualified escalation, serial reassessment, and caregiver-centered handoff.',
    );
    expect(svtRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(svtRoute.path)).toBe(
      'https://opensimlab.com/pediatrics/scenario/pediatric-supraventricular-tachycardia');
    expect(bradycardicArrestRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric bradycardic arrest transition',
      structuredData: ['LearningResource'] });
    expect(bradycardicArrestRoute.description).toBe(
      'A 6-year-old girl for calm pediatric bradycardia-to-arrest recognition, qualified resuscitation ownership, and active-risk handoff.',
    );
    expect(bradycardicArrestRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(bradycardicArrestRoute.path)).toBe(
      'https://opensimlab.com/pediatrics/scenario/pediatric-bradycardic-arrest');
    expect(foreignBodyAirwayObstructionRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric foreign-body airway obstruction',
      structuredData: ['LearningResource'] });
    expect(foreignBodyAirwayObstructionRoute.description).toBe(
      'A 6-year-old boy for calm pediatric choking recognition, cough-effectiveness reassessment, qualified escalation, and active-risk handoff.',
    );
    expect(foreignBodyAirwayObstructionRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(foreignBodyAirwayObstructionRoute.path)).toBe(
      'https://opensimlab.com/pediatrics/scenario/pediatric-foreign-body-airway-obstruction');
    expect(safeguardingRoute).toMatchObject({ indexable: true,
      heading: 'Pediatric safeguarding concern', structuredData: ['LearningResource'] });
    expect(safeguardingRoute.description).toBe(
      'A 2-year-old girl for calm injury-history reconciliation, safeguarding concern recognition, qualified escalation, and protected handoff.',
    );
    expect(safeguardingRoute.description.length).toBeLessThanOrEqual(160);
    expect(canonicalUrl(safeguardingRoute.path)).toBe(
      'https://opensimlab.com/pediatrics/scenario/pediatric-injury-safeguarding-escalation');
  });

  it('publishes exact completion, quality, maturity, and report records', () => {
    const completion = json('public/catalog/pediatrics-completion-audit.json');
    const quality = json('public/catalog/pediatrics-quality-audit.json');
    const maturity = json('public/catalog/pediatrics-maturity.json');
    const reports = json('public/catalog/scenario-report-catalog.json');
    expect(completion).toMatchObject({ moduleId: 'pediatrics', scenarioCount: 16 });
    expect(quality).toMatchObject({ scenarioCount: 16 });
    expect(maturity).toMatchObject({ recordCount: 16 });
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
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-dehydration-with-hypovolemia',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-diabetic-ketoacidosis',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-hypoglycemic-seizure',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-febrile-seizure',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-status-epilepticus',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-anaphylaxis',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-supraventricular-tachycardia',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-bradycardic-arrest',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-foreign-body-airway-obstruction',
      contentVersion: '0.1.0', maturity: 'draft',
    }));
    expect(reports.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-injury-safeguarding-escalation',
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
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-dehydration-with-hypovolemia', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-diabetic-ketoacidosis', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-hypoglycemic-seizure', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-febrile-seizure', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-status-epilepticus', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-anaphylaxis', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-supraventricular-tachycardia', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-bradycardic-arrest', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-foreign-body-airway-obstruction', domains: ['pediatrics'],
    }));
    expect(reviewableItems()).toContainEqual(expect.objectContaining({
      id: 'pediatric-injury-safeguarding-escalation', domains: ['pediatrics'],
    }));
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getModule } from '@platform/modules/registry';
import { routeFor } from '@routes/routes';
import { reviewableItems } from '@platform/governance/records';
import { structuredDataFor } from '@platform/docs/structured-data';
import { DEFAULT_ENDOCRINE_METABOLIC_SCENARIO_ID, ENDOCRINE_METABOLIC_SCENARIOS, getEndocrineMetabolicScenario } from '../../src/modules/endocrine-metabolic/scenarios';
const json = (path: string) => JSON.parse(readFileSync(join(process.cwd(), path), 'utf8'));

describe('Endocrine and Metabolic Medicine module foundation', () => {
  it('registers eight bounded previews and exact discoverable routes', () => {
    expect(getModule('endocrine-metabolic')).toMatchObject({ route: 'endocrine-metabolic', status: 'available' });
    expect(ENDOCRINE_METABOLIC_SCENARIOS).toHaveLength(8);
    expect(DEFAULT_ENDOCRINE_METABOLIC_SCENARIO_ID).toBe('dka-resolution-transition');
    expect(getEndocrineMetabolicScenario('missing')).toBeUndefined();
    expect(routeFor('/endocrine-metabolic')).toMatchObject({ indexable: true, structuredData: ['SoftwareApplication'] });
    for (const scenario of ENDOCRINE_METABOLIC_SCENARIOS) {
      expect(getEndocrineMetabolicScenario(scenario.metadata.id)).toBe(scenario);
      const path = `/endocrine-metabolic/scenario/${scenario.metadata.id}`;
      expect(routeFor(path)).toMatchObject({ indexable: true, structuredData: ['LearningResource'] });
      expect(structuredDataFor(['LearningResource'], path)[0]).toMatchObject({ url: `https://opensimlab.com${path}`, name: scenario.metadata.title,
        timeRequired: `PT${scenario.metadata.estimatedMinutes}M` });
    }
    expect(structuredDataFor(['LearningResource'], '/endocrine-metabolic/scenario/hypercalcemic-crisis-volume-and-bridge')[0])
      .toMatchObject({ timeRequired: 'PT240M' });
  });
  it.each([
    ['thyroid-storm-hemodynamic-risk', 'PT180M'],
    ['myxedema-coma-ventilation-and-steroid-sequence', 'PT60M'],
    ['hypocalcemic-tetany-rescue-and-recurrence', 'PT60M'],
  ])('publishes the full modeled observation duration for %s in search metadata', (id, timeRequired) => {
    expect(structuredDataFor(['LearningResource'], `/endocrine-metabolic/scenario/${id}`)[0])
      .toMatchObject({ timeRequired });
  });
  it('publishes exact review, completion, maturity, and secure-report records', () => {
    const completion = json('public/catalog/endocrine-metabolic-completion-audit.json');
    const maturity = json('public/catalog/endocrine-metabolic-maturity.json');
    const reports = json('workers/reports/src/report-catalog.generated.json');
    expect(completion.scenarios).toHaveLength(8);
    expect(maturity.recordCount).toBe(8);
    for (const { metadata } of ENDOCRINE_METABOLIC_SCENARIOS) {
      expect(reviewableItems()).toContainEqual(expect.objectContaining({ id: metadata.id, domains: ['endocrine-metabolic'] }));
      expect(completion.scenarios).toContainEqual(expect.objectContaining({ scenarioId: metadata.id, moduleId: 'endocrine-metabolic', maturity: 'preview' }));
      expect(maturity.records).toContainEqual(expect.objectContaining({ subjectId: metadata.id, status: 'preview' }));
      expect(reports.scenarios).toContainEqual(expect.objectContaining({ scenarioId: metadata.id, moduleId: 'endocrine-metabolic', contentVersion: metadata.version }));
    }
  });
});

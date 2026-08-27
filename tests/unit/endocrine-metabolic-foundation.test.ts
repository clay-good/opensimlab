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
  it('registers one bounded preview and exact discoverable routes', () => { expect(getModule('endocrine-metabolic')).toMatchObject({ route: 'endocrine-metabolic', status: 'available' }); expect(ENDOCRINE_METABOLIC_SCENARIOS).toHaveLength(1); expect(DEFAULT_ENDOCRINE_METABOLIC_SCENARIO_ID).toBe('dka-resolution-transition'); expect(getEndocrineMetabolicScenario(DEFAULT_ENDOCRINE_METABOLIC_SCENARIO_ID)).toBe(ENDOCRINE_METABOLIC_SCENARIOS[0]); expect(getEndocrineMetabolicScenario('missing')).toBeUndefined(); expect(routeFor('/endocrine-metabolic')).toMatchObject({ indexable: true, structuredData: ['SoftwareApplication'] }); const path = '/endocrine-metabolic/scenario/dka-resolution-transition'; expect(routeFor(path)).toMatchObject({ indexable: true, structuredData: ['LearningResource'] }); expect(structuredDataFor(['LearningResource'], path)[0]).toMatchObject({ url: `https://opensimlab.com${path}`, name: 'DKA resolution: glucose is not the finish line' }); });
  it('publishes exact review, completion, maturity, and secure-report records', () => { expect(reviewableItems()).toContainEqual(expect.objectContaining({ id: 'dka-resolution-transition', domains: ['endocrine-metabolic'] })); const completion = json('public/catalog/endocrine-metabolic-completion-audit.json'); expect(completion.scenarios).toHaveLength(1); expect(completion.scenarios[0]).toMatchObject({ scenarioId: 'dka-resolution-transition', moduleId: 'endocrine-metabolic', maturity: 'preview' }); const maturity = json('public/catalog/endocrine-metabolic-maturity.json'); expect(maturity.recordCount).toBe(1); expect(maturity.records[0]).toMatchObject({ subjectId: 'dka-resolution-transition', status: 'preview' }); const reports = json('workers/reports/src/report-catalog.generated.json'); expect(reports.scenarios).toContainEqual(expect.objectContaining({ scenarioId: 'dka-resolution-transition', moduleId: 'endocrine-metabolic', contentVersion: '0.1.0' })); });
});

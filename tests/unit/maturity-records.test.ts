import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import { buildAnesthesiaCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { buildScenarioQualityCatalog } from '@platform/catalog/scenario-quality';
import {
  buildScenarioMaturityCatalog, MATURITY_RECORD_SCHEMA, MATURITY_STATUSES,
  maturityFor, validateMaturityCatalog,
} from '@platform/catalog/maturity';

const completion = buildAnesthesiaCompletionCatalog(SCENARIOS, ENGINE_VERSION);
const quality = buildScenarioQualityCatalog(completion);
const catalog = buildScenarioMaturityCatalog(completion, quality);

describe('exact-version maturity records', () => {
  it('supports the complete public vocabulary and records every current scenario honestly', () => {
    expect(MATURITY_STATUSES).toEqual([
      'draft', 'preview', 'source_checked', 'clinically_reviewed',
      'institution_endorsed', 'withdrawn',
    ]);
    expect(validateMaturityCatalog(catalog)).toEqual([]);
    expect(catalog.recordCount).toBe(SCENARIOS.length);
    expect(catalog.records.every((record) => record.status === 'draft')).toBe(true);
  });

  it('never applies a record to a different content version', () => {
    const current = SCENARIOS[0]!;
    expect(maturityFor(
      catalog, 'scenario', current.metadata.id, current.metadata.version,
    )?.status).toBe('draft');
    expect(maturityFor(catalog, 'scenario', current.metadata.id, '99.0.0')).toBeUndefined();
    expect(() => buildScenarioMaturityCatalog(completion, {
      ...quality, scenarios: quality.scenarios.slice(1),
    })).toThrow(`No exact-version quality audit for ${current.metadata.id} ${current.metadata.version}.`);
  });

  it('rejects duplicate subjects, unknown statuses, and dishonest counts', () => {
    const hostile = structuredClone(catalog) as unknown as {
      recordCount: number;
      records: Array<{
        recordId: string; subjectKind: string; subjectId: string;
        contentVersion: string; status: string;
      }>;
    };
    hostile.recordCount += 1;
    hostile.records[1]!.recordId = hostile.records[0]!.recordId;
    hostile.records[1]!.subjectKind = hostile.records[0]!.subjectKind;
    hostile.records[1]!.subjectId = hostile.records[0]!.subjectId;
    hostile.records[1]!.contentVersion = hostile.records[0]!.contentVersion;
    hostile.records[1]!.status = 'approved';
    const errors = validateMaturityCatalog(hostile);
    expect(errors).toContain('/recordCount: does not match records length');
    expect(errors.some((error) => error.includes('duplicate'))).toBe(true);
    expect(errors).toContain('/records/1/status: unsupported value');
  });

  it('publishes the schema and generated exact-version records', () => {
    const publicCatalog = join(process.cwd(), 'public', 'catalog');
    expect(JSON.parse(readFileSync(join(publicCatalog, 'maturity-record.schema.json'), 'utf8')))
      .toEqual(MATURITY_RECORD_SCHEMA);
    expect(JSON.parse(readFileSync(join(publicCatalog, 'anesthesia-maturity.json'), 'utf8')))
      .toEqual(catalog);
  });
});

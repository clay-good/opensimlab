import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import { buildAnesthesiaCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import {
  COMPLETION_REQUIREMENTS, SCENARIO_COMPLETION_SCHEMA, validateCompletionCatalog,
} from '@platform/catalog/scenario-completion';

const catalog = buildAnesthesiaCompletionCatalog(SCENARIOS, ENGINE_VERSION);

describe('machine-readable scenario completion contract', () => {
  it('audits every current anesthesia scenario without counting missing evidence as complete', () => {
    expect(validateCompletionCatalog(catalog)).toEqual([]);
    expect(catalog.scenarioCount).toBe(SCENARIOS.length);
    expect(catalog.scenarios.map((record) => record.scenarioId))
      .toEqual(SCENARIOS.map((scenario) => scenario.metadata.id));
    expect(catalog.completeScenarioCount).toBe(0);
    for (const record of catalog.scenarios) {
      expect(record.requirements).toHaveLength(COMPLETION_REQUIREMENTS.length);
      expect(record.requirements.some((entry) => entry.status === 'missing')).toBe(true);
      expect(record.complete).toBe(false);
    }
  });

  it('names concrete legacy gaps instead of fabricating fixtures or report coverage', () => {
    const routine = catalog.scenarios.find((record) => record.scenarioId === 'routine-induction')!;
    expect(routine.requirements.find((entry) => entry.id === 'reference-transcripts')?.status)
      .toBe('missing');
    expect(routine.requirements.find((entry) => entry.id === 'report-control-coverage')?.evidence[0])
      .toContain('not yet implemented');
    expect(routine.maturity).toBe('preview');
  });

  it('rejects duplicate ids, missing requirements, dishonest counts, and unknown enums', () => {
    const hostile = structuredClone(catalog) as unknown as {
      scenarioCount: number;
      completeScenarioCount: number;
      scenarios: Array<{
        scenarioId: string;
        environment: string;
        complete: boolean;
        requirements: Array<{ id: string; status: string; evidence: string[] }>;
      }>;
    };
    hostile.scenarioCount += 1;
    hostile.completeScenarioCount = 1;
    hostile.scenarios[1]!.scenarioId = hostile.scenarios[0]!.scenarioId;
    hostile.scenarios[0]!.environment = 'spaceship';
    hostile.scenarios[0]!.requirements.pop();
    hostile.scenarios[0]!.complete = true;
    const errors = validateCompletionCatalog(hostile);
    expect(errors).toEqual(expect.arrayContaining([
      '/scenarioCount: does not match scenarios length',
      '/completeScenarioCount: does not match complete records',
    ]));
    expect(errors.some((error) => error.includes('duplicate'))).toBe(true);
    expect(errors.some((error) => error.includes('unsupported value'))).toBe(true);
    expect(errors.some((error) => error.includes('missing report-control-coverage'))).toBe(true);
    expect(errors.some((error) => error.includes('/complete: does not match'))).toBe(true);
  });

  it('publishes deterministic schema and audit JSON from the same source of truth', () => {
    const root = process.cwd();
    const publishedSchema = JSON.parse(readFileSync(
      join(root, 'public/catalog/scenario-completion.schema.json'), 'utf8',
    ));
    const publishedCatalog = JSON.parse(readFileSync(
      join(root, 'public/catalog/anesthesia-completion-audit.json'), 'utf8',
    ));
    expect(publishedSchema).toEqual(SCENARIO_COMPLETION_SCHEMA);
    expect(publishedCatalog).toEqual(catalog);
  });
});

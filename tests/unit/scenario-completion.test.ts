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

  // A test stood here that took whichever anesthesia scenario was still legacy
  // and checked the shared audit invented nothing for it. Its own comment said
  // to delete it once every anesthesia lab had reference transcripts, because
  // there would be no legacy scenario left to make the point with. That is now
  // the case -- all thirty-nine are bound -- so it is gone rather than left
  // asserting against an empty find. The test below makes the other half of the
  // point and still has a lab to make it with.

  it('lets a sidecar upgrade a requirement, and only the ones it evidences', () => {
    // The other direction, now that one anesthesia lab has evidence: what the
    // audit reports for routine-induction has to come from its sidecar rather
    // than from the shared legacy text, and the two requirements the sidecar
    // does not claim have to stay missing.
    const routine = catalog.scenarios.find((record) => record.scenarioId === 'routine-induction')!;
    expect(routine.requirements.find((entry) => entry.id === 'reference-transcripts'))
      .toMatchObject({ status: 'satisfied' });
    expect(routine.requirements.find((entry) => entry.id === 'reference-transcripts')?.evidence[0])
      .toContain('routine-induction-fixtures.ts');
    expect(routine.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(routine.complete).toBe(false);
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

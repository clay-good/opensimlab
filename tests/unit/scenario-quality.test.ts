import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import { buildAnesthesiaCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import {
  buildScenarioQualityCatalog, QUALITY_RECORD_KINDS, QUALITY_SCHEMAS,
  validateScenarioQualityCatalog,
} from '@platform/catalog/scenario-quality';

const quality = buildScenarioQualityCatalog(
  buildAnesthesiaCompletionCatalog(SCENARIOS, ENGINE_VERSION),
);

describe('machine-readable scenario quality contracts', () => {
  it('audits all scenarios and counts none playable while four records are absent', () => {
    expect(validateScenarioQualityCatalog(quality)).toEqual([]);
    expect(quality.scenarioCount).toBe(27);
    expect(quality.playableScenarioCount).toBe(0);
    for (const scenario of quality.scenarios) {
      expect(scenario.qualityRecords.map((record) => record.kind)).toEqual(QUALITY_RECORD_KINDS);
      expect(scenario.qualityRecords.every((record) => record.status === 'missing')).toBe(true);
      expect(scenario.playable).toBe(false);
    }
  });

  it('requires completion and every quality record before playable status', () => {
    const hostile = structuredClone(quality);
    const first = hostile.scenarios[0]!;
    (first as { completionComplete: boolean }).completionComplete = true;
    (first as { playable: boolean }).playable = true;
    (hostile as { playableScenarioCount: number }).playableScenarioCount = 1;
    const errors = validateScenarioQualityCatalog(hostile);
    expect(errors).toContain('/scenarios/0/playable: does not match completion and quality evidence');
    expect(errors).toContain('/playableScenarioCount: does not match playable records');
  });

  it('rejects duplicate, missing, and unknown quality gates', () => {
    const hostile = structuredClone(quality);
    const gates = hostile.scenarios[0]!.qualityRecords as unknown as Array<{ kind: string }>;
    gates[1]!.kind = gates[0]!.kind;
    gates.pop();
    const errors = validateScenarioQualityCatalog(hostile);
    expect(errors.some((error) => error.includes('duplicate training-value'))).toBe(true);
    expect(errors.some((error) => error.includes('missing authored-defaults'))).toBe(true);
    expect(errors.some((error) => error.includes('missing state-space-verification'))).toBe(true);
  });

  it('publishes every schema and the deterministic quality audit', () => {
    for (const [name, schema] of Object.entries(QUALITY_SCHEMAS)) {
      const published = JSON.parse(readFileSync(join(process.cwd(), `public/catalog/${name}.schema.json`), 'utf8'));
      expect(published).toEqual(schema);
    }
    const published = JSON.parse(readFileSync(
      join(process.cwd(), 'public/catalog/anesthesia-quality-audit.json'), 'utf8',
    ));
    expect(published).toEqual(quality);
    const hazardProperties = QUALITY_SCHEMAS['scenario-hazard'].properties as unknown as {
      hazards: { allOf: unknown[] };
    };
    const stateSpaceProperties = QUALITY_SCHEMAS['state-space-verification'].properties as unknown as {
      cases: { allOf: unknown[] };
    };
    expect(hazardProperties.hazards.allOf).toHaveLength(10);
    expect(stateSpaceProperties.cases.allOf).toHaveLength(17);
  });
});

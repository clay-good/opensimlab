import { readFileSync } from 'node:fs';
import type * as FileSystem from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScenarioCompletionCatalog } from '@platform/catalog/scenario-completion';
import type { ScenarioQualityCatalog } from '@platform/catalog/scenario-quality';
import type * as Quality from '@platform/catalog/scenario-quality';
import type * as QualityRecords from '../../scripts/quality-records';

const harness = vi.hoisted(() => ({
  records: [] as unknown,
  writes: new Map<string, string>(),
  mkdir: vi.fn(),
  dependencies: vi.fn(),
  calls: [] as { completions: readonly ScenarioCompletionCatalog[]; inputs: unknown;
    result?: ReadonlyMap<string, ScenarioQualityCatalog> }[],
}));

// Execute both real consumers and the real record validator. Dependency receipts
// are checked separately with the real verifier in quality-dependency-consumers.
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof FileSystem>();
  return { ...actual, mkdirSync: harness.mkdir,
    writeFileSync: (path: unknown, data: unknown) => { harness.writes.set(String(path), String(data)); } };
});
vi.mock('../../scripts/quality-records', () => ({
  get QUALITY_RECORDS() { return harness.records; }, QUALITY_DEPENDENCY_RECEIPTS: [],
}));
vi.mock('../../scripts/quality-dependencies', () => ({ assertQualityDependencies: harness.dependencies }));
vi.mock('@platform/catalog/scenario-quality', async (importOriginal) => {
  const actual = await importOriginal<typeof Quality>();
  return { ...actual, buildScenarioQualityCatalogs: (completions: readonly ScenarioCompletionCatalog[], inputs: unknown) => {
    const call: typeof harness.calls[number] = { completions, inputs }; harness.calls.push(call);
    call.result = actual.buildScenarioQualityCatalogs(completions, inputs);
    return call.result;
  } };
});

const MODULES = ['anesthesia', 'emergency-medicine', 'critical-care', 'cardiology', 'respiratory-medicine',
  'pediatrics', 'neurology', 'toxicology', 'obstetrics', 'neonatology', 'endocrine-metabolic'];
const suppliedRecord = () => ({ moduleId: 'endocrine-metabolic', kind: 'training-value', record: {
  schemaVersion: 1, scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', contentVersion: '0.1.0',
  fictionalTimeEvolvingState: true, incompleteInformation: true, learnerAction: true, consequence: true,
  reassessment: true, causalDebrief: true, staticOutputSubstitute: false,
  evidence: ['Synthetic consumer test evidence; not a production validation record.'],
} });

async function consume(consumer: 'build' | 'gate') {
  if (consumer === 'build') await import('../../scripts/build-completion-catalog');
  else (await import('../../scripts/check-review-gate')).main();
}

describe('Build and release consume the same fail-closed quality registry', () => {
  let argv: string[];
  beforeEach(() => {
    vi.resetModules(); harness.records = []; harness.writes.clear(); harness.mkdir.mockClear(); harness.calls.length = 0;
    harness.dependencies.mockClear();
    argv = process.argv; process.argv = [process.execPath, 'quality-record-consumers.test.ts'];
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });
  afterEach(() => { process.argv = argv; vi.restoreAllMocks(); });

  it('keeps empty-input outputs equivalent across all eleven build and release catalogs', async () => {
    const actualQuality = await vi.importActual<typeof Quality>('@platform/catalog/scenario-quality');
    await consume('build');
    expect(harness.calls).toHaveLength(1);
    const build = harness.calls[0]!;
    expect(build.inputs).toBe(harness.records);
    expect(build.completions.map(({ moduleId }) => moduleId)).toEqual(MODULES);
    expect(build.result?.size).toBe(11);
    const expected = actualQuality.buildScenarioQualityCatalogs(build.completions, []);
    expect(build.result).toEqual(expected);
    const written = [...harness.writes].filter(([path]) => path.endsWith('-quality-audit.json'));
    expect(written).toHaveLength(11);
    for (const [, text] of written) {
      const actual = JSON.parse(text) as ScenarioQualityCatalog;
      expect(actual).toEqual(expected.get(actual.moduleId));
      expect(actual.playableScenarioCount).toBe(0);
      expect(actual.scenarios.every((scenario) => scenario.qualityRecords.every((record) => record.status === 'missing'))).toBe(true);
    }
    await consume('gate');
    expect(harness.calls).toHaveLength(2);
    const gate = harness.calls[1]!;
    expect(gate.inputs).toBe(harness.records);
    expect(gate.completions.map(({ moduleId }) => moduleId)).toEqual(MODULES);
    expect(gate.result).toEqual(build.result);
    expect(harness.dependencies).toHaveBeenCalledTimes(2);
    expect(harness.dependencies).toHaveBeenLastCalledWith(harness.records, [], expect.any(String));
    // Preserve the existing consumer-specific cardiology setting; this change
    // does not silently normalize unrelated completion data.
    const cardiacSetting = (catalogs: readonly ScenarioCompletionCatalog[]) => catalogs.find(({ moduleId }) => moduleId === 'cardiology')!
      .scenarios.find(({ scenarioId }) => scenarioId === 'post-infarction-cardiogenic-shock-escalation')!.environment;
    expect(cardiacSetting(build.completions)).toBe('icu');
    expect(cardiacSetting(gate.completions)).toBe('clinic');
  });

  it('publishes all three endocrine evidence sets identically without claiming playable status', async () => {
    const production = await vi.importActual<typeof QualityRecords>('../../scripts/quality-records');
    expect(production.QUALITY_RECORDS).toHaveLength(9);
    expect(production.QUALITY_RECORDS.map(({ kind }) => kind).sort())
      .toEqual(['authored-defaults', 'authored-defaults', 'authored-defaults',
        'scenario-hazard', 'scenario-hazard', 'scenario-hazard', 'training-value', 'training-value', 'training-value']);
    expect(production.QUALITY_RECORDS.every(({ moduleId }) => moduleId === 'endocrine-metabolic')).toBe(true);
    harness.records = production.QUALITY_RECORDS;
    await consume('build'); await consume('gate');
    expect(harness.calls).toHaveLength(2);
    expect(harness.calls[0]!.result).toEqual(harness.calls[1]!.result);
    for (const call of harness.calls) {
      expect(call.inputs).toBe(production.QUALITY_RECORDS);
      expect(call.completions.map(({ moduleId }) => moduleId)).toEqual(MODULES);
      const scenarios = [...call.result!.values()].flatMap(({ scenarios }) => scenarios);
      const targets = ['hypocalcemic-tetany-rescue-and-recurrence', 'hyponatremia-aquaresis-and-overcorrection',
        'hypernatremic-dehydration-avp-deficiency'];
      for (const scenarioId of targets) {
        const target = scenarios.find((scenario) => scenario.scenarioId === scenarioId)!;
        expect(target.contentVersion).toBe(scenarioId === 'hypernatremic-dehydration-avp-deficiency' ? '0.1.1' : '0.1.0');
        expect(target.qualityRecords.filter(({ status }) => status === 'present')).toHaveLength(3);
        expect(target.qualityRecords.filter(({ status }) => status === 'missing').map(({ kind }) => kind))
          .toEqual(['state-space-verification']);
        expect(target.completionComplete).toBe(false);
        const records = production.QUALITY_RECORDS.filter(({ record }) => (record as { scenarioId: string }).scenarioId === scenarioId);
        for (const input of records) {
          expect(target.qualityRecords.find(({ kind }) => kind === input.kind)?.record).toEqual(input.record);
        }
      }
      expect(scenarios.every(({ playable }) => !playable)).toBe(true);
      expect(scenarios.filter(({ scenarioId }) => !targets.includes(scenarioId))
        .every(({ qualityRecords }) => qualityRecords.every(({ status }) => status === 'missing'))).toBe(true);
    }
    const written = [...harness.writes].filter(([path]) => path.endsWith('-quality-audit.json'));
    expect(written).toHaveLength(11);
    for (const [path, text] of written) {
      const generated = JSON.parse(text) as ScenarioQualityCatalog;
      expect(generated).toEqual(harness.calls[0]!.result!.get(generated.moduleId));
      expect(generated).toEqual(JSON.parse(readFileSync(path, 'utf8')));
      expect(generated.playableScenarioCount).toBe(0);
    }
  });

  it('passes supplied exact-version evidence to both real consumers without promoting completion or unrelated scenarios', async () => {
    const input = suppliedRecord(); harness.records = [input];
    await consume('build'); await consume('gate');
    expect(harness.calls).toHaveLength(2);
    expect(harness.calls[0]!.result).toEqual(harness.calls[1]!.result);
    const written = [...harness.writes].find(([path]) => path.endsWith('/endocrine-metabolic-quality-audit.json'))!;
    expect(JSON.parse(written[1])).toEqual(harness.calls[0]!.result!.get(input.moduleId));
    for (const call of harness.calls) {
      expect(call.inputs).toBe(harness.records);
      expect(call.completions).toHaveLength(11);
      const catalog = call.result!.get(input.moduleId)!;
      const target = catalog.scenarios.find(({ scenarioId }) => scenarioId === input.record.scenarioId)!;
      expect(target.qualityRecords.find(({ kind }) => kind === input.kind)).toMatchObject({
        status: 'present', record: input.record,
        evidence: [expect.stringContaining('structural validity does not establish independent review')],
      });
      expect(target.playable).toBe(false); expect(target.completionComplete).toBe(false);
      expect(target.qualityRecords.filter(({ status }) => status === 'missing')).toHaveLength(3);
      expect([...call.result!.values()].reduce((total, module) => total + module.playableScenarioCount, 0)).toBe(0);
      expect(catalog.scenarios.filter(({ scenarioId }) => scenarioId !== input.record.scenarioId)
        .every((scenario) => scenario.qualityRecords.every(({ status }) => status === 'missing'))).toBe(true);
    }
  });

  const invalidRecords = [
    { label: 'non-array registry', input: () => ({}) },
    { label: 'unknown module', input: () => [{ ...suppliedRecord(), moduleId: 'unknown-module' }] },
    { label: 'unknown scenario', input: () => [{ ...suppliedRecord(), record: { ...suppliedRecord().record, scenarioId: 'unknown-scenario' } }] },
    { label: 'stale version', input: () => [{ ...suppliedRecord(), record: { ...suppliedRecord().record, contentVersion: '99.0.0' } }] },
    { label: 'malformed evidence', input: () => [{ ...suppliedRecord(), record: { ...suppliedRecord().record, evidence: [] } }] },
    { label: 'unexpected envelope property', input: () => [{ ...suppliedRecord(), approved: true }] },
    { label: 'duplicate exact-kind record', input: () => [suppliedRecord(), suppliedRecord()] },
  ];
  for (const consumer of ['build', 'gate'] as const) {
    it.each(invalidRecords)(`${consumer} rejects $label before filesystem writes or development-gate continuation`, async ({ input }) => {
      harness.records = input();
      await expect(consume(consumer)).rejects.toThrow();
      expect(harness.calls).toHaveLength(1);
      expect(harness.calls[0]!.inputs).toBe(harness.records);
      expect(harness.calls[0]!.completions.map(({ moduleId }) => moduleId)).toEqual(MODULES);
      expect(harness.calls[0]!.result).toBeUndefined();
      expect(harness.dependencies).not.toHaveBeenCalled();
      expect(harness.writes.size).toBe(0); expect(harness.mkdir).not.toHaveBeenCalled();
      expect(process.stdout.write).not.toHaveBeenCalled(); expect(process.stderr.write).not.toHaveBeenCalled();
    });
  }
});

import { describe, expect, it } from 'vitest';
import { COMPLETION_REQUIREMENTS, type ScenarioCompletionCatalog } from '@platform/catalog/scenario-completion';
import {
  buildScenarioQualityCatalog, buildScenarioQualityCatalogs, HAZARD_CATEGORIES, QUALITY_RECORD_KINDS,
  STATE_SPACE_CASES, validateScenarioQualityCatalog, validateScenarioQualityRecord, type QualityRecordKind,
} from '@platform/catalog/scenario-quality';

// Synthetic validator fixtures only: none of this evidence describes a shipped lesson,
// a human review, clinical validation, or an actual accessibility verification run.
const EVIDENCE = 'Synthetic unit-test evidence; not a production verification claim.';
const MODULE = 'synthetic-module';
const ID = 'synthetic-scenario';
const VERSION = '0.1.0';
type ObjectRecord = Record<string, unknown>;

function completion(moduleId = MODULE, complete = true): ScenarioCompletionCatalog {
  return {
    schemaVersion: 1, moduleId, capabilityVersion: 'synthetic-capability', scenarioCount: 1,
    completeScenarioCount: complete ? 1 : 0,
    scenarios: [{ scenarioId: ID, title: 'Synthetic unit-test scenario', moduleId, environment: 'ward',
      estimatedMinutes: 1, difficulty: 'introductory', prerequisites: [], practiceRegions: ['US'],
      fidelityClass: 'state_transition', contentVersion: VERSION, capabilityVersion: 'synthetic-capability',
      maturity: 'preview', complete,
      requirements: COMPLETION_REQUIREMENTS.map((id) => ({ id, status: complete ? 'satisfied' : 'missing', evidence: [EVIDENCE] })),
    }],
  };
}

function records(): Record<QualityRecordKind, ObjectRecord> {
  const identity = { schemaVersion: 1, scenarioId: ID, contentVersion: VERSION };
  return {
    'training-value': { ...identity, fictionalTimeEvolvingState: true, incompleteInformation: true,
      learnerAction: true, consequence: true, reassessment: true, causalDebrief: true,
      staticOutputSubstitute: false, evidence: [EVIDENCE] },
    'authored-defaults': { ...identity, defaults: [{ id: 'synthetic-clock', category: 'time-scale', value: 1,
      sourceRefs: [EVIDENCE], rationale: EVIDENCE, practiceRegions: ['US'], applicability: EVIDENCE,
      educationalEffect: EVIDENCE }] },
    'scenario-hazard': { ...identity, hazards: HAZARD_CATEGORIES.map((category) => ({ category,
      description: EVIDENCE, disposition: 'accepted-with-rationale', evidence: [EVIDENCE] })) },
    'state-space-verification': { ...identity, cases: STATE_SPACE_CASES.map((caseName) => ({ case: caseName,
      status: 'passed', evidence: [EVIDENCE] })) },
  };
}

function inputs(moduleId = MODULE) {
  const values = records();
  return QUALITY_RECORD_KINDS.map((kind) => ({ moduleId, kind, record: values[kind] }));
}

const items = (record: ObjectRecord, field: string) => record[field] as ObjectRecord[];
const errorsFor = (kind: QualityRecordKind, mutate: (record: ObjectRecord) => void) => {
  const record = records()[kind]; mutate(record);
  return validateScenarioQualityRecord(kind, record);
};

describe('synthetic exact-version quality-record ingestion', () => {
  it.each(QUALITY_RECORD_KINDS)('accepts the complete synthetic %s schema payload', (kind) => {
    expect(validateScenarioQualityRecord(kind, records()[kind])).toEqual([]);
  });

  it('keeps omitted evidence missing without changing the existing audit shape', () => {
    const result = buildScenarioQualityCatalog(completion());
    expect(result).toEqual(buildScenarioQualityCatalog(completion(), []));
    expect(result.playableScenarioCount).toBe(0);
    expect(result.scenarios[0]!.qualityRecords).toEqual(QUALITY_RECORD_KINDS.map((kind) => ({
      kind, status: 'missing', evidence: [`No version-bound ${kind} record exists for ${ID} ${VERSION}.`],
    })));
    expect(validateScenarioQualityCatalog(result)).toEqual([]);
  });

  it('exposes a partial valid record without counting the scenario playable', () => {
    const result = buildScenarioQualityCatalog(completion(), inputs().slice(0, 1));
    expect(result.playableScenarioCount).toBe(0);
    expect(result.scenarios[0]!.qualityRecords[0]).toMatchObject({ status: 'present', record: records()['training-value'] });
    expect(result.scenarios[0]!.qualityRecords.slice(1).every((gate) => gate.status === 'missing')).toBe(true);
    expect(validateScenarioQualityCatalog(result)).toEqual([]);
  });

  it.each([false, true])('requires completion in addition to all four records: complete=%s', (complete) => {
    const source = completion(MODULE, complete);
    const result = buildScenarioQualityCatalog(source, inputs());
    expect(result.playableScenarioCount).toBe(complete ? 1 : 0);
    expect(result.scenarios[0]).toMatchObject({ completionComplete: complete, playable: complete });
    for (const gate of result.scenarios[0]!.qualityRecords) {
      expect(gate).toMatchObject({ status: 'present', record: records()[gate.kind] });
      expect(gate.evidence.length).toBeGreaterThan(0);
    }
    expect(validateScenarioQualityCatalog(result)).toEqual([]);
    expect(source.scenarios[0]!.maturity).toBe('preview');
    expect(result.scenarios[0]).not.toHaveProperty('maturity');
  });

  it.each([null, {}, 'records', 1, true])('rejects a non-array input registry: %j', (value) => {
    expect(() => buildScenarioQualityCatalog(completion(), value)).toThrow();
  });

  it.each([null, [], {}, { moduleId: MODULE, kind: 'unknown', record: {} },
    { ...inputs()[0], extra: 'not allowed' }, { ...inputs()[0], record: null }].map((value) => [value]))('rejects a malformed envelope: %j', (value) => {
    expect(() => buildScenarioQualityCatalog(completion(), [value])).toThrow();
  });

  it.each(['module', 'scenario', 'version'] as const)('rejects a record with a mismatched %s identity', (field) => {
    const input = inputs()[0]!;
    if (field === 'module') input.moduleId = 'unknown-module';
    if (field === 'scenario') input.record.scenarioId = 'unknown-scenario';
    if (field === 'version') input.record.contentVersion = '0.0.9';
    expect(() => buildScenarioQualityCatalog(completion(), [input])).toThrow();
  });

  it.each([false, true])('rejects duplicate exact records even when identical: conflicting=%s', (conflicting) => {
    const input = inputs()[0]!; const duplicate = structuredClone(input);
    if (conflicting) duplicate.record.evidence = ['Different synthetic evidence.'];
    expect(() => buildScenarioQualityCatalog(completion(), [input, duplicate])).toThrow();
  });

  it('rejects mixed valid and invalid duplicate payloads in either order', () => {
    const valid = inputs()[0]!; const invalid = structuredClone(valid); invalid.record.evidence = [];
    expect(() => buildScenarioQualityCatalog(completion(), [valid, invalid])).toThrow();
    expect(() => buildScenarioQualityCatalog(completion(), [invalid, valid])).toThrow();
  });

  it('rejects sparse registries rather than treating holes as missing evidence', () => {
    const sparse = new Array(1);
    expect(() => buildScenarioQualityCatalog(completion(), sparse)).toThrow();
  });

  it('rejects duplicate module catalogs and duplicate scenario identities', () => {
    expect(() => buildScenarioQualityCatalogs([completion(), completion()])).toThrow();
    const source = completion();
    const duplicate = { ...source, scenarioCount: 2, completeScenarioCount: 2,
      scenarios: [source.scenarios[0]!, structuredClone(source.scenarios[0]!)] };
    expect(() => buildScenarioQualityCatalogs([duplicate])).toThrow();
  });

  it('allows the same scenario ID in different modules without cross-credit', () => {
    const second = 'synthetic-second-module';
    const result = buildScenarioQualityCatalogs([completion(), completion(second)], inputs());
    expect(result.get(MODULE)?.playableScenarioCount).toBe(1);
    expect(result.get(second)?.playableScenarioCount).toBe(0);
    const both = buildScenarioQualityCatalogs([completion(), completion(second)], [...inputs(), ...inputs(second)]);
    expect([...both.values()].map((entry) => entry.playableScenarioCount)).toEqual([1, 1]);
  });

  it('does not return a partially accepted registry when a later module contains invalid evidence', () => {
    const bad = inputs('synthetic-second-module'); bad[3]!.record.cases = [];
    expect(() => buildScenarioQualityCatalogs([completion(), completion('synthetic-second-module')], [...inputs(), ...bad])).toThrow();
  });

  it('is deterministic across envelope order and does not mutate its inputs', () => {
    const source = completion(); const input = inputs();
    const before = structuredClone({ source, input });
    const first = buildScenarioQualityCatalog(source, input);
    const second = buildScenarioQualityCatalog(source, [...input].reverse());
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect({ source, input }).toEqual(before);
  });

  it('returns detached nested record payloads so callers cannot change source evidence', () => {
    const input = inputs(); const before = structuredClone(input);
    const result = buildScenarioQualityCatalog(completion(), input);
    const gate = result.scenarios[0]!.qualityRecords[1] as unknown as { record: ObjectRecord };
    const returnedDefault = items(gate.record, 'defaults')[0]!;
    expect(returnedDefault).not.toBe(items(input[1]!.record, 'defaults')[0]);
    (items(input[1]!.record, 'defaults')[0]!.sourceRefs as string[]).push('Changed after build.');
    expect(returnedDefault.sourceRefs).toEqual(items(before[1]!.record, 'defaults')[0]!.sourceRefs);
    (returnedDefault.practiceRegions as string[]).push('GB');
    expect(items(input[1]!.record, 'defaults')[0]!.practiceRegions).toEqual(['US']);
  });
});

describe('strict quality payload schema boundaries', () => {
  it.each(QUALITY_RECORD_KINDS)('rejects malformed %s identities and additional fields', (kind) => {
    for (const value of [null, [], 1, 'record', true]) expect(validateScenarioQualityRecord(kind, value).length).toBeGreaterThan(0);
    for (const [field, value] of [['schemaVersion', 2], ['scenarioId', 'Not Valid'], ['contentVersion', '0.1'], ['extra', true]]) {
      expect(errorsFor(kind, (record) => { record[field as string] = value; }).length).toBeGreaterThan(0);
    }
    expect(errorsFor(kind, (record) => { delete record.scenarioId; }).length).toBeGreaterThan(0);
  });

  it('requires all training-value assertions and nonempty evidence', () => {
    for (const field of ['fictionalTimeEvolvingState', 'incompleteInformation', 'learnerAction', 'consequence', 'reassessment', 'causalDebrief']) {
      expect(errorsFor('training-value', (record) => { record[field] = false; }).length).toBeGreaterThan(0);
    }
    expect(errorsFor('training-value', (record) => { record.staticOutputSubstitute = true; }).length).toBeGreaterThan(0);
    for (const evidence of [[], [''], [1], 'evidence']) {
      expect(errorsFor('training-value', (record) => { record.evidence = evidence; }).length).toBeGreaterThan(0);
    }
  });

  it.each([null, true, false, 0, 1.25, 'synthetic'])('accepts the declared finite default scalar %j', (value) => {
    expect(errorsFor('authored-defaults', (record) => { items(record, 'defaults')[0]!.value = value; })).toEqual([]);
  });

  it.each([NaN, Infinity, -Infinity, {}, [], undefined].map((value) => [value]))('rejects a non-JSON default scalar %s', (value) => {
    expect(errorsFor('authored-defaults', (record) => { items(record, 'defaults')[0]!.value = value; }).length).toBeGreaterThan(0);
  });

  it('requires complete authored-default metadata and rejects nested extra fields', () => {
    expect(errorsFor('authored-defaults', (record) => { record.defaults = []; }).length).toBeGreaterThan(0);
    for (const field of ['id', 'category', 'value', 'sourceRefs', 'rationale', 'practiceRegions', 'applicability', 'educationalEffect']) {
      expect(errorsFor('authored-defaults', (record) => { delete items(record, 'defaults')[0]![field]; }).length).toBeGreaterThan(0);
    }
    for (const [field, value] of [['category', 'unsupported'], ['sourceRefs', []], ['practiceRegions', ['']], ['extra', true]]) {
      expect(errorsFor('authored-defaults', (record) => { items(record, 'defaults')[0]![field as string] = value; }).length).toBeGreaterThan(0);
    }
  });

  it.each([['scenario-hazard', 'hazards', 'category'], ['state-space-verification', 'cases', 'case']] as const)(
    'requires every %s category exactly once', (kind, field, discriminator) => {
      expect(errorsFor(kind, (record) => { items(record, field).pop(); }).length).toBeGreaterThan(0);
      expect(errorsFor(kind, (record) => { items(record, field).push({ ...items(record, field)[0]! }); }).length).toBeGreaterThan(0);
      expect(errorsFor(kind, (record) => { items(record, field)[1]![discriminator] = items(record, field)[0]![discriminator]; }).length).toBeGreaterThan(0);
      expect(errorsFor(kind, (record) => { items(record, field)[0]![discriminator] = 'unsupported'; }).length).toBeGreaterThan(0);
      expect(errorsFor(kind, (record) => { items(record, field)[0]!.evidence = []; }).length).toBeGreaterThan(0);
      expect(errorsFor(kind, (record) => { items(record, field)[0]!.extra = true; }).length).toBeGreaterThan(0);
    });

  it('never accepts pending, failed, or missing matrix status as passed evidence', () => {
    for (const status of ['pending', 'failed', null, true]) {
      expect(errorsFor('state-space-verification', (record) => { items(record, 'cases')[0]!.status = status; }).length).toBeGreaterThan(0);
    }
    expect(errorsFor('state-space-verification', (record) => { delete items(record, 'cases')[0]!.status; }).length).toBeGreaterThan(0);
    expect(errorsFor('scenario-hazard', (record) => { items(record, 'hazards')[0]!.disposition = 'passed'; }).length).toBeGreaterThan(0);
  });

  it('rejects inherited required fields and unexpected own prototype-related keys', () => {
    expect(validateScenarioQualityRecord('training-value', Object.create(records()['training-value'])).length).toBeGreaterThan(0);
    for (const key of ['constructor', '__proto__', 'toString']) {
      expect(errorsFor('training-value', (record) => {
        Object.defineProperty(record, key, { value: 'unexpected', enumerable: true });
      }).length).toBeGreaterThan(0);
    }
  });

  it('rejects sparse record and evidence arrays, including a missing required matrix case', () => {
    expect(errorsFor('training-value', (record) => { record.evidence = new Array(1); }).length).toBeGreaterThan(0);
    expect(errorsFor('authored-defaults', (record) => { record.defaults = new Array(1); }).length).toBeGreaterThan(0);
    expect(errorsFor('state-space-verification', (record) => { delete items(record, 'cases')[0]; }).length).toBeGreaterThan(0);
  });
});

describe('imported quality audits cannot claim presence without matching valid evidence', () => {
  it.each(['absent', 'malformed', 'scenario', 'version'] as const)('rejects a present payload that is %s', (problem) => {
    const audit = structuredClone(buildScenarioQualityCatalog(completion(), inputs()));
    const gate = audit.scenarios[0]!.qualityRecords[0] as unknown as ObjectRecord;
    if (problem === 'absent') delete gate.record;
    if (problem === 'malformed') gate.record = {};
    if (problem === 'scenario') (gate.record as ObjectRecord).scenarioId = 'other-scenario';
    if (problem === 'version') (gate.record as ObjectRecord).contentVersion = '0.0.9';
    expect(validateScenarioQualityCatalog(audit).length).toBeGreaterThan(0);
  });

  it('rejects a payload attached to a missing gate', () => {
    const audit = buildScenarioQualityCatalog(completion());
    const gate = audit.scenarios[0]!.qualityRecords[0] as unknown as ObjectRecord;
    gate.record = records()['training-value'];
    expect(validateScenarioQualityCatalog(audit).length).toBeGreaterThan(0);
  });
});

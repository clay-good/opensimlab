import { describe, expect, it, vi } from 'vitest';
import { COMPLETION_REQUIREMENTS, type ScenarioCompletionCatalog } from '@platform/catalog/scenario-completion';
import {
  buildScenarioQualityCatalog, HAZARD_CATEGORIES, STATE_SPACE_CASES, QUALITY_SCHEMAS,
  validateScenarioQualityCatalog, validateScenarioQualityRecord,
} from '@platform/catalog/scenario-quality';

// Synthetic transport/validator fixtures, never evidence for a shipped lesson.
const evidence = 'Synthetic JSON-boundary test only; no verification or clinical claim.';
const identity = { schemaVersion: 1, scenarioId: 'synthetic-json-boundary', contentVersion: '0.1.0' };
const moduleId = 'synthetic-json-module';
const completion = (): ScenarioCompletionCatalog => ({
  schemaVersion: 1, moduleId, capabilityVersion: 'synthetic', scenarioCount: 1, completeScenarioCount: 0,
  scenarios: [{ scenarioId: identity.scenarioId, contentVersion: identity.contentVersion, moduleId,
    title: 'Synthetic JSON boundary', environment: 'ward', estimatedMinutes: 1, difficulty: 'introductory',
    prerequisites: [], practiceRegions: ['US'], fidelityClass: 'state_transition', capabilityVersion: 'synthetic',
    maturity: 'preview', complete: false,
    requirements: COMPLETION_REQUIREMENTS.map((id) => ({ id, status: 'missing', evidence: [evidence] })),
  }],
});
const defaults = () => ({ ...identity, defaults: [{ id: 'synthetic-value', category: 'time-scale', value: 0,
  sourceRefs: ['second synthetic reference', 'first synthetic reference'], rationale: evidence,
  practiceRegions: ['US'], applicability: evidence, educationalEffect: evidence }] });

class ForgedArray<T> extends Array<T> {
  override some(): boolean { return true; }
}

describe('quality evidence accepts JSON data rather than executable array behavior', () => {
  it('rejects an Array subclass that forges coverage for ten copies of one hazard', () => {
    const hazard = { category: 'premature-closure', description: evidence, disposition: 'tested', evidence: [evidence] };
    const hazards = new ForgedArray(...Array.from({ length: HAZARD_CATEGORIES.length }, () => ({ ...hazard })));
    expect(hazards.some()).toBe(true);
    expect(validateScenarioQualityRecord('scenario-hazard', { ...identity, hazards }).length).toBeGreaterThan(0);
  });

  it('rejects an Array subclass that forges the full matrix using only expert cases', () => {
    const cases = new ForgedArray(...Array.from({ length: STATE_SPACE_CASES.length }, () => ({ case: 'expert', status: 'passed', evidence: [evidence] })));
    expect(validateScenarioQualityRecord('state-space-verification', { ...identity, cases }).length).toBeGreaterThan(0);
  });

  it('rejects sparse and subclassed imported audit arrays instead of skipping their entries', () => {
    const audit = buildScenarioQualityCatalog(completion());
    expect(validateScenarioQualityCatalog({ ...audit, scenarios: new Array(1) }).length).toBeGreaterThan(0);
    expect(validateScenarioQualityCatalog({ ...audit, scenarios: new ForgedArray(...audit.scenarios) }).length).toBeGreaterThan(0);
    const scenario = audit.scenarios[0]!;
    expect(validateScenarioQualityCatalog({ ...audit, scenarios: [{ ...scenario,
      qualityRecords: new Array(4),
    }] }).length).toBeGreaterThan(0);
    expect(validateScenarioQualityCatalog({ ...audit, scenarios: [{ ...scenario,
      qualityRecords: scenario.qualityRecords.map((gate) => ({ ...gate, evidence: new Array(1) })),
    }] }).length).toBeGreaterThan(0);
  });

  it('rejects payload and envelope getters without invoking them', () => {
    const record = defaults(); const payloadGetter = vi.fn(() => 0);
    Object.defineProperty(record.defaults[0], 'value', { enumerable: true, get: payloadGetter });
    expect(validateScenarioQualityRecord('authored-defaults', record).length).toBeGreaterThan(0);
    expect(payloadGetter).not.toHaveBeenCalled();
    const envelopeGetter = vi.fn(defaults);
    const envelope = { moduleId, kind: 'authored-defaults' };
    Object.defineProperty(envelope, 'record', { enumerable: true, get: envelopeGetter });
    expect(() => buildScenarioQualityCatalog(completion(), [envelope])).toThrow();
    expect(envelopeGetter).not.toHaveBeenCalled();
  });

  it.each(['catalog', 'scenario', 'gate'] as const)('rejects an imported %s getter without executing it', (level) => {
    const audit = buildScenarioQualityCatalog(completion());
    const getter = vi.fn(() => level === 'catalog' ? audit.scenarios : level === 'scenario' ? identity.scenarioId : 'missing');
    const target = level === 'catalog' ? audit : level === 'scenario' ? audit.scenarios[0]! : audit.scenarios[0]!.qualityRecords[0]!;
    const key = level === 'catalog' ? 'scenarios' : level === 'scenario' ? 'scenarioId' : 'status';
    Object.defineProperty(target, key, { enumerable: true, get: getter });
    expect(validateScenarioQualityCatalog(audit).length).toBeGreaterThan(0);
    expect(getter).not.toHaveBeenCalled();
  });

  it('rejects duplicate default IDs even when their authored values disagree', () => {
    const record = defaults(); record.defaults.push({ ...record.defaults[0]!, value: 1 });
    expect(validateScenarioQualityRecord('authored-defaults', record)).toContain('/defaults/1/id: duplicate default');
  });

  it('copies nested records in deterministic key order without sorting evidence arrays', () => {
    const original = defaults();
    const reordered = Object.fromEntries(Object.entries({ ...original,
      defaults: original.defaults.map((item) => Object.fromEntries(Object.entries(item).reverse())),
    }).reverse());
    const first = buildScenarioQualityCatalog(completion(), [{ moduleId, kind: 'authored-defaults', record: original }]);
    const second = buildScenarioQualityCatalog(completion(), [{ moduleId, kind: 'authored-defaults', record: reordered }]);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    const accepted = first.scenarios[0]!.qualityRecords.find((gate) => gate.kind === 'authored-defaults')!.record!;
    expect(accepted).not.toBe(original);
    expect(Object.keys(accepted)).toEqual(Object.keys(accepted).sort());
    const nested = (accepted.defaults as Array<Record<string, unknown>>)[0]!;
    expect(Object.keys(nested)).toEqual(Object.keys(nested).sort());
    expect(nested.sourceRefs).toEqual(original.defaults[0]!.sourceRefs);
  });

  it('fails closed when a bundled schema introduces an unsupported validation keyword', () => {
    const properties = QUALITY_SCHEMAS['authored-defaults'].properties as unknown as {
      defaults: { items: { properties: { value: Record<string, unknown> } } };
    };
    const node = properties.defaults.items.properties.value;
    const before = Object.getOwnPropertyDescriptor(node, 'minimum');
    try {
      Object.defineProperty(node, 'minimum', { value: 0, enumerable: true, configurable: true });
      expect(() => validateScenarioQualityRecord('authored-defaults', defaults()))
        .toThrow('Unsupported quality schema keyword: minimum');
    } finally {
      if (before) Object.defineProperty(node, 'minimum', before);
      else Reflect.deleteProperty(node, 'minimum');
    }
    expect(validateScenarioQualityRecord('authored-defaults', defaults())).toEqual([]);
  });
});

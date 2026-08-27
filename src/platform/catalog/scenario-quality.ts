import type { ScenarioCompletionCatalog } from './scenario-completion';

export const QUALITY_SCHEMA_VERSION = 1;
export const QUALITY_RECORD_KINDS = [
  'training-value', 'authored-defaults', 'scenario-hazard', 'state-space-verification',
] as const;
export type QualityRecordKind = typeof QUALITY_RECORD_KINDS[number];

export interface QualityRecordEnvelope {
  readonly moduleId: string;
  readonly kind: QualityRecordKind;
  readonly record: unknown;
}

export interface QualityRecord extends Readonly<Record<string, unknown>> {
  readonly schemaVersion: 1;
  readonly scenarioId: string;
  readonly contentVersion: string;
}

export interface QualityGateAudit {
  readonly kind: QualityRecordKind;
  readonly status: 'present' | 'missing';
  readonly evidence: readonly string[];
  readonly record?: QualityRecord;
}

export interface ScenarioQualityAudit {
  readonly scenarioId: string;
  readonly contentVersion: string;
  readonly completionComplete: boolean;
  readonly qualityRecords: readonly QualityGateAudit[];
  readonly playable: boolean;
}

export interface ScenarioQualityCatalog {
  readonly schemaVersion: 1;
  readonly moduleId: string;
  readonly scenarioCount: number;
  readonly playableScenarioCount: number;
  readonly scenarios: readonly ScenarioQualityAudit[];
}

const schema = (name: string, properties: Record<string, unknown>, required: string[]) => ({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: `https://opensimlab.com/catalog/${name}.schema.json`,
  title: `Open Sim Lab ${name} record`,
  type: 'object', additionalProperties: false,
  required: ['schemaVersion', 'scenarioId', 'contentVersion', ...required],
  properties: {
    schemaVersion: { const: QUALITY_SCHEMA_VERSION },
    scenarioId: { type: 'string', pattern: '^[a-z0-9-]+$' },
    contentVersion: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    ...properties,
  },
} as const);

const strings = { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } } as const;

export const TRAINING_VALUE_SCHEMA = schema('training-value', {
  fictionalTimeEvolvingState: { const: true }, incompleteInformation: { const: true },
  learnerAction: { const: true }, consequence: { const: true }, reassessment: { const: true },
  causalDebrief: { const: true }, staticOutputSubstitute: { const: false }, evidence: strings,
}, ['fictionalTimeEvolvingState', 'incompleteInformation', 'learnerAction', 'consequence',
  'reassessment', 'causalDebrief', 'staticOutputSubstitute', 'evidence']);

export const AUTHORED_DEFAULTS_SCHEMA = schema('authored-defaults', {
  defaults: {
    type: 'array', minItems: 1, items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'category', 'value', 'sourceRefs', 'rationale', 'practiceRegions',
        'applicability', 'educationalEffect'],
      properties: {
        id: { type: 'string', minLength: 1 },
        category: { enum: ['starting-setting', 'preselected-action', 'stocked-action',
          'hidden-trait', 'scripted-delay', 'time-scale', 'randomization-range', 'tutor-threshold'] },
        value: { type: ['string', 'number', 'boolean', 'null'] }, sourceRefs: strings,
        rationale: { type: 'string', minLength: 1 }, practiceRegions: strings,
        applicability: { type: 'string', minLength: 1 },
        educationalEffect: { type: 'string', minLength: 1 },
      },
    },
  },
}, ['defaults']);

export const HAZARD_CATEGORIES = [
  'premature-closure', 'cue-leakage', 'negative-transfer', 'unsupported-precision',
  'omitted-alternatives', 'invalid-actions', 'model-boundary-crossing',
  'catastrophic-outcome-framing', 'accessibility-misunderstanding', 'regional-variation',
] as const;
export const SCENARIO_HAZARD_SCHEMA = schema('scenario-hazard', {
  hazards: {
    type: 'array', minItems: HAZARD_CATEGORIES.length, maxItems: HAZARD_CATEGORIES.length,
    allOf: HAZARD_CATEGORIES.map((category) => ({ contains: { properties: { category: { const: category } }, required: ['category'] } })),
    items: {
      type: 'object', additionalProperties: false,
      required: ['category', 'description', 'disposition', 'evidence'],
      properties: {
        category: { enum: [...HAZARD_CATEGORIES] }, description: { type: 'string', minLength: 1 },
        disposition: { enum: ['mitigated', 'limited', 'tested', 'accepted-with-rationale'] },
        evidence: strings,
      },
    },
  },
}, ['hazards']);

export const STATE_SPACE_CASES = [
  'expert', 'common-error', 'recovery', 'no-action', 'unsafe-or-refused', 'boundary-timing',
  'supported-regions', 'minimum-seed', 'maximum-seed', 'guidance-levels', 'keyboard-only',
  'screen-reader', 'reduced-motion', 'phone', 'offline', 'resume-and-replay', 'report-context',
] as const;
export const STATE_SPACE_VERIFICATION_SCHEMA = schema('state-space-verification', {
  cases: {
    type: 'array', minItems: STATE_SPACE_CASES.length, maxItems: STATE_SPACE_CASES.length,
    allOf: STATE_SPACE_CASES.map((caseName) => ({ contains: { properties: { case: { const: caseName } }, required: ['case'] } })),
    items: {
      type: 'object', additionalProperties: false, required: ['case', 'status', 'evidence'],
      properties: {
        case: { enum: [...STATE_SPACE_CASES] }, status: { const: 'passed' }, evidence: strings,
      },
    },
  },
}, ['cases']);

export const QUALITY_SCHEMAS = {
  'training-value': TRAINING_VALUE_SCHEMA,
  'authored-defaults': AUTHORED_DEFAULTS_SCHEMA,
  'scenario-hazard': SCENARIO_HAZARD_SCHEMA,
  'state-space-verification': STATE_SPACE_VERIFICATION_SCHEMA,
} as const;

type QualitySchemaNode = {
  readonly type?: string | readonly string[];
  readonly const?: unknown;
  readonly enum?: readonly unknown[];
  readonly properties?: Readonly<Record<string, QualitySchemaNode>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
  readonly items?: QualitySchemaNode;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly minLength?: number;
  readonly pattern?: string;
  readonly allOf?: readonly QualitySchemaNode[];
  readonly contains?: QualitySchemaNode;
};
const qualityKeywords = new Set(['$schema', '$id', 'title', 'type', 'const', 'enum', 'properties',
  'required', 'additionalProperties', 'items', 'minItems', 'maxItems', 'minLength', 'pattern', 'allOf', 'contains']);
const pointerKey = (key: string) => key.replace(/~/g, '~0').replace(/\//g, '~1');
const isObject = (value: unknown): value is Record<string, unknown> => value !== null
  && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const isJsonObject = (value: unknown): value is Record<string, unknown> => isObject(value)
  && Reflect.ownKeys(value).every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    return typeof key === 'string' && descriptor.enumerable && Object.hasOwn(descriptor, 'value');
  });
const isJsonArray = (value: unknown): value is unknown[] => {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return false;
  const keys = Reflect.ownKeys(value).filter((key) => key !== 'length');
  return keys.length === value.length && keys.every((key, index) => key === String(index)
    && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key)!, 'value'));
};

/** Only the vocabulary used by the four bundled schemas; never an external-schema interpreter. */
function validateQualityNode(node: QualitySchemaNode, value: unknown, pointer: string, errors: string[]): void {
  for (const key of Object.keys(node)) {
    if (!qualityKeywords.has(key)) throw new Error(`Unsupported quality schema keyword: ${key}`);
  }
  const fail = (message: string) => { errors.push(`${pointer || '/'}: ${message}`); };
  if (node.type) {
    const types = typeof node.type === 'string' ? [node.type] : node.type;
    const matches = types.some((type) => type === 'null' ? value === null
      : type === 'object' ? isObject(value) : type === 'array' ? isJsonArray(value)
        : type === 'number' ? typeof value === 'number' && Number.isFinite(value)
          : typeof value === type);
    if (!matches) { fail(`expected ${types.join(' or ')}`); return; }
  }
  if (Object.hasOwn(node, 'const') && value !== node.const) fail(`expected ${JSON.stringify(node.const)}`);
  if (node.enum && !node.enum.includes(value)) fail('unsupported value');
  if (typeof value === 'string') {
    if (node.minLength !== undefined && [...value].length < node.minLength) fail('expected non-empty string');
    if (node.pattern && !new RegExp(node.pattern).test(value)) fail('does not match required pattern');
  }
  if (isObject(value)) {
    for (const key of node.required ?? []) {
      if (!Object.hasOwn(value, key)) errors.push(`${pointer}/${pointerKey(key)}: required`);
    }
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') { fail('expected JSON string keys'); continue; }
      const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
        errors.push(`${pointer}/${pointerKey(key)}: expected enumerable JSON data`); continue;
      }
      if (node.properties && Object.hasOwn(node.properties, key)) {
        validateQualityNode(node.properties[key]!, descriptor.value, `${pointer}/${pointerKey(key)}`, errors);
      } else if (node.additionalProperties === false) errors.push(`${pointer}/${pointerKey(key)}: unexpected property`);
    }
  }
  if (Array.isArray(value)) {
    if (node.minItems !== undefined && value.length < node.minItems) fail(`expected at least ${node.minItems} items`);
    if (node.maxItems !== undefined && value.length > node.maxItems) fail(`expected at most ${node.maxItems} items`);
    if (!isJsonArray(value)) {
      fail('expected a dense JSON array without extra properties'); return;
    }
    if (node.items) for (let index = 0; index < value.length; index += 1) {
      validateQualityNode(node.items, value[index], `${pointer}/${index}`, errors);
    }
    if (node.contains && !value.some((item) => {
      const itemErrors: string[] = []; validateQualityNode(node.contains!, item, pointer, itemErrors);
      return itemErrors.length === 0;
    })) fail('missing required member');
  }
  for (const condition of node.allOf ?? []) validateQualityNode(condition, value, pointer, errors);
}

export function validateScenarioQualityRecord(kind: QualityRecordKind, value: unknown): string[] {
  if (!Object.hasOwn(QUALITY_SCHEMAS, kind)) return ['/kind: unsupported value'];
  const errors: string[] = [];
  validateQualityNode(QUALITY_SCHEMAS[kind], value, '', errors);
  if (errors.length === 0 && kind === 'authored-defaults') {
    const ids = new Set<string>();
    (value as { defaults: Array<{ id: string }> }).defaults.forEach((entry, index) => {
      if (ids.has(entry.id)) errors.push(`/defaults/${index}/id: duplicate default`);
      ids.add(entry.id);
    });
  }
  return errors;
}

// Detach accepted evidence from callers and make object-key ordering reproducible.
function copyQualityRecord(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(copyQualityRecord);
  if (isObject(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, copyQualityRecord(value[key])]));
  return value;
}

function qualityCatalog(completion: ScenarioCompletionCatalog, inputs: readonly QualityRecordEnvelope[]): ScenarioQualityCatalog {
  const scenarios = completion.scenarios.map((record): ScenarioQualityAudit => {
    const qualityRecords = QUALITY_RECORD_KINDS.map((kind): QualityGateAudit => {
      const supplied = inputs.find((input) => input.moduleId === completion.moduleId && input.kind === kind
        && (input.record as QualityRecord).scenarioId === record.scenarioId);
      return supplied ? {
        kind, status: 'present', record: copyQualityRecord(supplied.record) as QualityRecord,
        evidence: [`Validated version-bound ${kind} record for ${record.scenarioId} ${record.contentVersion}; structural validity does not establish independent review.`],
      } : {
        kind, status: 'missing',
        evidence: [`No version-bound ${kind} record exists for ${record.scenarioId} ${record.contentVersion}.`],
      };
    });
    return {
      scenarioId: record.scenarioId, contentVersion: record.contentVersion,
      completionComplete: record.complete, qualityRecords,
      playable: record.complete && qualityRecords.every((entry) => entry.status === 'present'),
    };
  });
  return {
    schemaVersion: QUALITY_SCHEMA_VERSION, moduleId: completion.moduleId,
    scenarioCount: scenarios.length,
    playableScenarioCount: scenarios.filter((record) => record.playable).length,
    scenarios,
  };
}

/**
 * Completion catalogs come from the trusted authored-scenario builders. Validate
 * the entire evidence registry before a module can discard an unknown or stale entry.
 */
export function buildScenarioQualityCatalogs(
  completions: readonly ScenarioCompletionCatalog[], inputs: unknown = [],
): ReadonlyMap<string, ScenarioQualityCatalog> {
  const current = new Map<string, string>();
  const modules = new Set<string>();
  for (const completion of completions) {
    if (modules.has(completion.moduleId)) throw new Error(`quality records: duplicate module ${completion.moduleId}`);
    modules.add(completion.moduleId);
    for (const scenario of completion.scenarios) {
      const key = `${completion.moduleId}:${scenario.scenarioId}`;
      if (current.has(key)) throw new Error(`quality records: duplicate scenario ${key}`);
      current.set(key, scenario.contentVersion);
    }
  }
  if (!Array.isArray(inputs)) throw new Error('quality records /: expected array');
  const errors: string[] = [];
  validateQualityNode({ type: 'array', items: { type: 'object', required: ['moduleId', 'kind', 'record'], additionalProperties: false,
    properties: { moduleId: { type: 'string', pattern: '^[a-z0-9-]+$' },
      kind: { enum: QUALITY_RECORD_KINDS }, record: { type: 'object' } } } }, inputs, '', errors);
  if (errors.length > 0) throw new Error(`quality records invalid:\n${errors.join('\n')}`);
  const keys = new Set<string>();
  for (let index = 0; index < inputs.length; index += 1) {
    const input = inputs[index] as QualityRecordEnvelope; const pointer = `/${index}`;
    const recordErrors = validateScenarioQualityRecord(input.kind, input.record);
    errors.push(...recordErrors.map((error) => `${pointer}/record${error}`));
    if (recordErrors.length > 0) continue;
    const record = input.record as QualityRecord;
    const currentVersion = current.get(`${input.moduleId}:${record.scenarioId}`);
    if (currentVersion === undefined) errors.push(`${pointer}/record: unknown module/scenario identity`);
    else if (record.contentVersion !== currentVersion) errors.push(`${pointer}/record/contentVersion: stale or unknown version; expected ${currentVersion}`);
    const key = `${input.moduleId}:${record.scenarioId}@${record.contentVersion}:${String(input.kind)}`;
    if (keys.has(key)) errors.push(`${pointer}: duplicate quality record ${key}`);
    keys.add(key);
  }
  if (errors.length > 0) throw new Error(`quality records invalid:\n${errors.join('\n')}`);
  return new Map(completions.map((completion) => [completion.moduleId, qualityCatalog(completion, inputs as QualityRecordEnvelope[])]));
}

export function buildScenarioQualityCatalog(completion: ScenarioCompletionCatalog, inputs: unknown = []): ScenarioQualityCatalog {
  return buildScenarioQualityCatalogs([completion], inputs).get(completion.moduleId)!;
}

export function validateScenarioQualityCatalog(value: unknown): string[] {
  if (!isJsonObject(value)) return ['/: expected JSON object'];
  const catalog = value as Record<string, unknown>;
  const errors: string[] = [];
  if (catalog.schemaVersion !== QUALITY_SCHEMA_VERSION) errors.push('/schemaVersion: expected 1');
  if (typeof catalog.moduleId !== 'string' || catalog.moduleId.length === 0) errors.push('/moduleId: expected non-empty string');
  if (!isJsonArray(catalog.scenarios)) return [...errors, '/scenarios: expected dense JSON array'];
  if (catalog.scenarioCount !== catalog.scenarios.length) errors.push('/scenarioCount: does not match scenarios length');
  const ids = new Set<string>();
  let playableCount = 0;
  catalog.scenarios.forEach((raw, index) => {
    const pointer = `/scenarios/${index}`;
    if (!isJsonObject(raw)) { errors.push(`${pointer}: expected JSON object`); return; }
    const record = raw as Record<string, unknown>;
    if (typeof record.scenarioId !== 'string') errors.push(`${pointer}/scenarioId: expected string`);
    else if (ids.has(record.scenarioId)) errors.push(`${pointer}/scenarioId: duplicate ${record.scenarioId}`);
    else ids.add(record.scenarioId);
    if (typeof record.contentVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(record.contentVersion)) {
      errors.push(`${pointer}/contentVersion: expected semantic version`);
    }
    if (typeof record.completionComplete !== 'boolean') {
      errors.push(`${pointer}/completionComplete: expected boolean`);
    }
    if (!isJsonArray(record.qualityRecords)) { errors.push(`${pointer}/qualityRecords: expected dense JSON array`); return; }
    const kinds = new Set<unknown>();
    let validPresentRecords = 0;
    record.qualityRecords.forEach((rawGate, gateIndex) => {
      if (!isJsonObject(rawGate)) return errors.push(`${pointer}/qualityRecords/${gateIndex}: expected JSON object`);
      const gate = rawGate as Record<string, unknown>;
      const errorsBefore = errors.length;
      if (!QUALITY_RECORD_KINDS.includes(gate.kind as QualityRecordKind)) errors.push(`${pointer}/qualityRecords/${gateIndex}/kind: unsupported value`);
      else if (kinds.has(gate.kind)) errors.push(`${pointer}/qualityRecords/${gateIndex}/kind: duplicate ${String(gate.kind)}`);
      else kinds.add(gate.kind);
      if (gate.status !== 'present' && gate.status !== 'missing') errors.push(`${pointer}/qualityRecords/${gateIndex}/status: unsupported value`);
      if (!isJsonArray(gate.evidence) || gate.evidence.length === 0
        || gate.evidence.some((entry) => typeof entry !== 'string' || entry.length === 0)) {
        errors.push(`${pointer}/qualityRecords/${gateIndex}/evidence: expected non-empty strings`);
      }
      if (gate.status === 'present' && QUALITY_RECORD_KINDS.includes(gate.kind as QualityRecordKind)) {
        errors.push(...validateScenarioQualityRecord(gate.kind as QualityRecordKind, gate.record)
          .map((error) => `${pointer}/qualityRecords/${gateIndex}/record${error}`));
        if (isJsonObject(gate.record) && (gate.record.scenarioId !== record.scenarioId
          || gate.record.contentVersion !== record.contentVersion)) {
          errors.push(`${pointer}/qualityRecords/${gateIndex}/record: scenario/version identity mismatch`);
        }
        if (errors.length === errorsBefore) validPresentRecords += 1;
      } else if (Object.hasOwn(gate, 'record')) {
        errors.push(`${pointer}/qualityRecords/${gateIndex}/record: missing gate cannot carry a record`);
      }
    });
    for (const kind of QUALITY_RECORD_KINDS) if (!kinds.has(kind)) errors.push(`${pointer}/qualityRecords: missing ${kind}`);
    const derivedPlayable = record.completionComplete === true
      && record.qualityRecords.length === QUALITY_RECORD_KINDS.length
      && validPresentRecords === QUALITY_RECORD_KINDS.length;
    if (record.playable !== derivedPlayable) errors.push(`${pointer}/playable: does not match completion and quality evidence`);
    if (derivedPlayable) playableCount += 1;
  });
  if (catalog.playableScenarioCount !== playableCount) errors.push('/playableScenarioCount: does not match playable records');
  return errors;
}

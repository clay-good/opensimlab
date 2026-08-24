import type { ScenarioCompletionCatalog } from './scenario-completion';

export const QUALITY_SCHEMA_VERSION = 1;
export const QUALITY_RECORD_KINDS = [
  'training-value', 'authored-defaults', 'scenario-hazard', 'state-space-verification',
] as const;
export type QualityRecordKind = typeof QUALITY_RECORD_KINDS[number];

export interface QualityGateAudit {
  readonly kind: QualityRecordKind;
  readonly status: 'present' | 'missing';
  readonly evidence: readonly string[];
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

export function buildScenarioQualityCatalog(completion: ScenarioCompletionCatalog): ScenarioQualityCatalog {
  const scenarios = completion.scenarios.map((record): ScenarioQualityAudit => {
    const qualityRecords = QUALITY_RECORD_KINDS.map((kind): QualityGateAudit => ({
      kind, status: 'missing',
      evidence: [`No version-bound ${kind} record exists for ${record.scenarioId} ${record.contentVersion}.`],
    }));
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

export function validateScenarioQualityCatalog(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['/: expected object'];
  const catalog = value as Record<string, unknown>;
  const errors: string[] = [];
  if (catalog.schemaVersion !== QUALITY_SCHEMA_VERSION) errors.push('/schemaVersion: expected 1');
  if (typeof catalog.moduleId !== 'string' || catalog.moduleId.length === 0) errors.push('/moduleId: expected non-empty string');
  if (!Array.isArray(catalog.scenarios)) return [...errors, '/scenarios: expected array'];
  if (catalog.scenarioCount !== catalog.scenarios.length) errors.push('/scenarioCount: does not match scenarios length');
  const ids = new Set<string>();
  let playableCount = 0;
  catalog.scenarios.forEach((raw, index) => {
    const pointer = `/scenarios/${index}`;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { errors.push(`${pointer}: expected object`); return; }
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
    if (!Array.isArray(record.qualityRecords)) { errors.push(`${pointer}/qualityRecords: expected array`); return; }
    const kinds = new Set<unknown>();
    record.qualityRecords.forEach((rawGate, gateIndex) => {
      if (!rawGate || typeof rawGate !== 'object' || Array.isArray(rawGate)) return errors.push(`${pointer}/qualityRecords/${gateIndex}: expected object`);
      const gate = rawGate as Record<string, unknown>;
      if (!QUALITY_RECORD_KINDS.includes(gate.kind as QualityRecordKind)) errors.push(`${pointer}/qualityRecords/${gateIndex}/kind: unsupported value`);
      else if (kinds.has(gate.kind)) errors.push(`${pointer}/qualityRecords/${gateIndex}/kind: duplicate ${String(gate.kind)}`);
      else kinds.add(gate.kind);
      if (gate.status !== 'present' && gate.status !== 'missing') errors.push(`${pointer}/qualityRecords/${gateIndex}/status: unsupported value`);
      if (!Array.isArray(gate.evidence) || gate.evidence.length === 0
        || gate.evidence.some((entry) => typeof entry !== 'string' || entry.length === 0)) {
        errors.push(`${pointer}/qualityRecords/${gateIndex}/evidence: expected non-empty strings`);
      }
    });
    for (const kind of QUALITY_RECORD_KINDS) if (!kinds.has(kind)) errors.push(`${pointer}/qualityRecords: missing ${kind}`);
    const derivedPlayable = record.completionComplete === true
      && record.qualityRecords.length === QUALITY_RECORD_KINDS.length
      && record.qualityRecords.every((gate) => gate && typeof gate === 'object'
        && (gate as Record<string, unknown>).status === 'present');
    if (record.playable !== derivedPlayable) errors.push(`${pointer}/playable: does not match completion and quality evidence`);
    if (derivedPlayable) playableCount += 1;
  });
  if (catalog.playableScenarioCount !== playableCount) errors.push('/playableScenarioCount: does not match playable records');
  return errors;
}

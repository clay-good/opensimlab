/**
 * Machine-readable scenario completion contract.
 *
 * A record can be structurally valid while still incomplete. That distinction is
 * deliberate: the catalog must name missing evidence without turning a title or
 * a partly built scenario into a playable-count claim.
 */

export const COMPLETION_SCHEMA_VERSION = 1;

export const COMPLETION_REQUIREMENTS = [
  'identity-and-versions',
  'bounded-fictional-patient',
  'observable-objectives',
  'deterministic-seed-policy',
  'meaningful-progression',
  'meaningful-actions-and-choices',
  'shared-capability-consequences',
  'bounded-stop-condition',
  'guidance-and-demonstration',
  'debrief-and-counterfactual',
  'source-provenance',
  'scenario-specific-limitations',
  'reference-transcripts',
  'inclusive-runtime-verification',
  'report-control-coverage',
] as const;

export type CompletionRequirementId = typeof COMPLETION_REQUIREMENTS[number];
export type CompletionStatus = 'satisfied' | 'missing';
export type ScenarioEnvironment =
  | 'operating-room' | 'emergency-department' | 'icu' | 'ward'
  | 'delivery-room' | 'neonatal-unit' | 'clinic' | 'prehospital';
export type FidelityClass =
  | 'closed_loop_physiology' | 'state_transition' | 'branching_encounter';
export type ContentMaturity =
  | 'draft' | 'preview' | 'source_checked' | 'clinically_reviewed'
  | 'institution_endorsed' | 'withdrawn';

export interface CompletionRequirementAudit {
  readonly id: CompletionRequirementId;
  readonly status: CompletionStatus;
  readonly evidence: readonly string[];
}

export interface ScenarioCompletionAudit {
  readonly scenarioId: string;
  readonly title: string;
  readonly moduleId: string;
  readonly environment: ScenarioEnvironment;
  readonly estimatedMinutes: number;
  readonly difficulty: 'introductory' | 'intermediate' | 'advanced';
  readonly prerequisites: readonly string[];
  readonly practiceRegions: readonly string[];
  readonly fidelityClass: FidelityClass;
  readonly contentVersion: string;
  readonly capabilityVersion: string;
  readonly maturity: ContentMaturity;
  readonly complete: boolean;
  readonly requirements: readonly CompletionRequirementAudit[];
}

export interface ScenarioCompletionCatalog {
  readonly schemaVersion: 1;
  readonly moduleId: string;
  readonly capabilityVersion: string;
  readonly scenarioCount: number;
  readonly completeScenarioCount: number;
  readonly scenarios: readonly ScenarioCompletionAudit[];
}

/** Minimal, dependency-free structural validation for generated and imported audits. */
export function validateCompletionCatalog(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['/: expected object'];
  const catalog = value as Record<string, unknown>;
  const errors: string[] = [];
  if (catalog.schemaVersion !== COMPLETION_SCHEMA_VERSION) errors.push('/schemaVersion: expected 1');
  if (typeof catalog.moduleId !== 'string' || catalog.moduleId.length === 0) errors.push('/moduleId: expected non-empty string');
  if (typeof catalog.capabilityVersion !== 'string' || catalog.capabilityVersion.length === 0) errors.push('/capabilityVersion: expected non-empty string');
  if (!Array.isArray(catalog.scenarios)) return [...errors, '/scenarios: expected array'];
  if (catalog.scenarioCount !== catalog.scenarios.length) errors.push('/scenarioCount: does not match scenarios length');
  const ids = new Set<string>();
  const environments = new Set(['operating-room', 'emergency-department', 'icu', 'ward', 'delivery-room', 'neonatal-unit', 'clinic', 'prehospital']);
  const fidelities = new Set(['closed_loop_physiology', 'state_transition', 'branching_encounter']);
  const maturities = new Set(['draft', 'preview', 'source_checked', 'clinically_reviewed', 'institution_endorsed', 'withdrawn']);
  const difficulties = new Set(['introductory', 'intermediate', 'advanced']);
  catalog.scenarios.forEach((raw, index) => {
    const pointer = `/scenarios/${index}`;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push(`${pointer}: expected object`);
      return;
    }
    const record = raw as Record<string, unknown>;
    if (typeof record.scenarioId !== 'string' || !/^[a-z0-9-]+$/.test(record.scenarioId)) {
      errors.push(`${pointer}/scenarioId: expected stable lowercase identifier`);
    } else if (ids.has(record.scenarioId)) {
      errors.push(`${pointer}/scenarioId: duplicate ${record.scenarioId}`);
    } else ids.add(record.scenarioId);
    for (const field of ['title', 'moduleId', 'contentVersion', 'capabilityVersion']) {
      if (typeof record[field] !== 'string' || record[field].length === 0) {
        errors.push(`${pointer}/${field}: expected non-empty string`);
      }
    }
    if (!environments.has(String(record.environment))) errors.push(`${pointer}/environment: unsupported value`);
    if (!fidelities.has(String(record.fidelityClass))) errors.push(`${pointer}/fidelityClass: unsupported value`);
    if (!maturities.has(String(record.maturity))) errors.push(`${pointer}/maturity: unsupported value`);
    if (!difficulties.has(String(record.difficulty))) errors.push(`${pointer}/difficulty: unsupported value`);
    if (typeof record.estimatedMinutes !== 'number' || record.estimatedMinutes < 1) {
      errors.push(`${pointer}/estimatedMinutes: expected positive number`);
    }
    if (!Array.isArray(record.prerequisites)) errors.push(`${pointer}/prerequisites: expected array`);
    if (!Array.isArray(record.practiceRegions) || record.practiceRegions.length === 0) {
      errors.push(`${pointer}/practiceRegions: expected non-empty array`);
    }
    if (!Array.isArray(record.requirements)) {
      errors.push(`${pointer}/requirements: expected array`);
      return;
    }
    const requirementIds = new Set<unknown>();
    record.requirements.forEach((entry, requirementIndex) => {
      const requirementPointer = `${pointer}/requirements/${requirementIndex}`;
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        errors.push(`${requirementPointer}: expected object`);
        return;
      }
      const item = entry as Record<string, unknown>;
      if (!COMPLETION_REQUIREMENTS.includes(item.id as CompletionRequirementId)) {
        errors.push(`${requirementPointer}/id: unsupported value`);
      } else if (requirementIds.has(item.id)) {
        errors.push(`${requirementPointer}/id: duplicate ${String(item.id)}`);
      } else requirementIds.add(item.id);
      if (item.status !== 'satisfied' && item.status !== 'missing') {
        errors.push(`${requirementPointer}/status: expected satisfied or missing`);
      }
      if (!Array.isArray(item.evidence) || item.evidence.length === 0
        || item.evidence.some((evidence) => typeof evidence !== 'string' || evidence.length === 0)) {
        errors.push(`${requirementPointer}/evidence: expected non-empty strings`);
      }
    });
    for (const id of COMPLETION_REQUIREMENTS) {
      if (!requirementIds.has(id)) errors.push(`${pointer}/requirements: missing ${id}`);
    }
    const derivedComplete = record.requirements.every((entry) => entry && typeof entry === 'object'
      && (entry as Record<string, unknown>).status === 'satisfied');
    if (record.complete !== derivedComplete) errors.push(`${pointer}/complete: does not match requirement evidence`);
  });
  const completeCount = catalog.scenarios.filter((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
    const requirements = (entry as Record<string, unknown>).requirements;
    return Array.isArray(requirements) && requirements.length === COMPLETION_REQUIREMENTS.length
      && requirements.every((requirement) => requirement && typeof requirement === 'object'
        && (requirement as Record<string, unknown>).status === 'satisfied');
  }).length;
  if (catalog.completeScenarioCount !== completeCount) {
    errors.push('/completeScenarioCount: does not match complete records');
  }
  return errors;
}

/** JSON Schema published with the deterministic audit artifact. */
export const SCENARIO_COMPLETION_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://opensimlab.com/catalog/scenario-completion.schema.json',
  title: 'Open Sim Lab scenario completion audit',
  type: 'object',
  additionalProperties: false,
  required: [
    'schemaVersion', 'moduleId', 'capabilityVersion', 'scenarioCount',
    'completeScenarioCount', 'scenarios',
  ],
  properties: {
    schemaVersion: { const: COMPLETION_SCHEMA_VERSION },
    moduleId: { type: 'string', minLength: 1 },
    capabilityVersion: { type: 'string', minLength: 1 },
    scenarioCount: { type: 'integer', minimum: 0 },
    completeScenarioCount: { type: 'integer', minimum: 0 },
    scenarios: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'scenarioId', 'title', 'moduleId', 'environment', 'estimatedMinutes', 'difficulty',
          'prerequisites', 'practiceRegions', 'fidelityClass', 'contentVersion',
          'capabilityVersion', 'maturity', 'complete', 'requirements',
        ],
        properties: {
          scenarioId: { type: 'string', pattern: '^[a-z0-9-]+$' },
          title: { type: 'string', minLength: 3 },
          moduleId: { type: 'string', minLength: 1 },
          environment: { enum: ['operating-room', 'emergency-department', 'icu', 'ward', 'delivery-room', 'neonatal-unit', 'clinic', 'prehospital'] },
          estimatedMinutes: { type: 'number', minimum: 1 },
          difficulty: { enum: ['introductory', 'intermediate', 'advanced'] },
          prerequisites: { type: 'array', items: { type: 'string' } },
          practiceRegions: { type: 'array', minItems: 1, items: { type: 'string' } },
          fidelityClass: { enum: ['closed_loop_physiology', 'state_transition', 'branching_encounter'] },
          contentVersion: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
          capabilityVersion: { type: 'string', minLength: 1 },
          maturity: { enum: ['draft', 'preview', 'source_checked', 'clinically_reviewed', 'institution_endorsed', 'withdrawn'] },
          complete: { type: 'boolean' },
          requirements: {
            type: 'array', minItems: COMPLETION_REQUIREMENTS.length, maxItems: COMPLETION_REQUIREMENTS.length,
            items: {
              type: 'object', additionalProperties: false,
              required: ['id', 'status', 'evidence'],
              properties: {
                id: { enum: [...COMPLETION_REQUIREMENTS] },
                status: { enum: ['satisfied', 'missing'] },
                evidence: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
              },
            },
          },
        },
      },
    },
  },
} as const;

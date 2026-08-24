import type { ScenarioCompletionCatalog } from './scenario-completion';
import type { ScenarioQualityCatalog } from './scenario-quality';

export const MATURITY_SCHEMA_VERSION = 1;
export const MATURITY_STATUSES = [
  'draft', 'preview', 'source_checked', 'clinically_reviewed',
  'institution_endorsed', 'withdrawn',
] as const;
export type ContentMaturity = typeof MATURITY_STATUSES[number];

export const MATURITY_SUBJECT_KINDS = [
  'scenario', 'capability', 'protocol', 'drug-card', 'tutor-rule',
  'explanation', 'debrief-rule', 'alarm-threshold', 'normal-range',
] as const;
export type MaturitySubjectKind = typeof MATURITY_SUBJECT_KINDS[number];

/** Current status for one exact content item and version. */
export interface MaturityRecord {
  readonly recordId: string;
  readonly subjectKind: MaturitySubjectKind;
  readonly subjectId: string;
  readonly contentVersion: string;
  readonly status: ContentMaturity;
  readonly evidence: readonly string[];
}

export interface MaturityCatalog {
  readonly schemaVersion: 1;
  readonly moduleId: string;
  readonly recordCount: number;
  readonly records: readonly MaturityRecord[];
}

export const MATURITY_RECORD_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://opensimlab.com/catalog/maturity-record.schema.json',
  title: 'Open Sim Lab exact-version maturity record',
  type: 'object', additionalProperties: false,
  required: ['recordId', 'subjectKind', 'subjectId', 'contentVersion', 'status', 'evidence'],
  properties: {
    recordId: { type: 'string', pattern: '^[a-z0-9][a-z0-9:._@-]+$' },
    subjectKind: { enum: [...MATURITY_SUBJECT_KINDS] },
    subjectId: { type: 'string', pattern: '^[a-z0-9-]+$' },
    contentVersion: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    status: { enum: [...MATURITY_STATUSES] },
    evidence: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
  },
} as const;

/** Resolve authority only when both the stable identity and content version match. */
export function maturityFor(
  catalog: MaturityCatalog,
  subjectKind: MaturitySubjectKind,
  subjectId: string,
  contentVersion: string,
): MaturityRecord | undefined {
  return catalog.records.find((record) => record.subjectKind === subjectKind
    && record.subjectId === subjectId
    && record.contentVersion === contentVersion);
}

export function buildScenarioMaturityCatalog(
  completion: ScenarioCompletionCatalog,
  quality: ScenarioQualityCatalog,
): MaturityCatalog {
  const records = completion.scenarios.map((scenario): MaturityRecord => {
    const qualityRecord = quality.scenarios.find((entry) => entry.scenarioId === scenario.scenarioId
      && entry.contentVersion === scenario.contentVersion);
    if (!qualityRecord) {
      throw new Error(`No exact-version quality audit for ${scenario.scenarioId} ${scenario.contentVersion}.`);
    }
    return {
      recordId: `scenario:${scenario.scenarioId}@${scenario.contentVersion}`,
      subjectKind: 'scenario', subjectId: scenario.scenarioId,
      contentVersion: scenario.contentVersion, status: scenario.maturity,
      evidence: [
        `/catalog/anesthesia-completion-audit.json#${scenario.scenarioId}@${scenario.contentVersion}`,
        `/catalog/anesthesia-quality-audit.json#${scenario.scenarioId}@${scenario.contentVersion}`,
      ],
    };
  });
  return {
    schemaVersion: MATURITY_SCHEMA_VERSION, moduleId: completion.moduleId,
    recordCount: records.length, records,
  };
}

export function validateMaturityCatalog(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['/: expected object'];
  const catalog = value as Record<string, unknown>;
  const errors: string[] = [];
  if (catalog.schemaVersion !== MATURITY_SCHEMA_VERSION) errors.push('/schemaVersion: expected 1');
  if (typeof catalog.moduleId !== 'string' || catalog.moduleId.length === 0) {
    errors.push('/moduleId: expected non-empty string');
  }
  if (!Array.isArray(catalog.records)) return [...errors, '/records: expected array'];
  if (catalog.recordCount !== catalog.records.length) errors.push('/recordCount: does not match records length');

  const recordIds = new Set<string>();
  const subjects = new Set<string>();
  catalog.records.forEach((raw, index) => {
    const pointer = `/records/${index}`;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push(`${pointer}: expected object`);
      return;
    }
    const record = raw as Record<string, unknown>;
    if (typeof record.recordId !== 'string' || !/^[a-z0-9][a-z0-9:._@-]+$/.test(record.recordId)) {
      errors.push(`${pointer}/recordId: expected stable lowercase identifier`);
    } else if (recordIds.has(record.recordId)) errors.push(`${pointer}/recordId: duplicate ${record.recordId}`);
    else recordIds.add(record.recordId);
    if (!MATURITY_SUBJECT_KINDS.includes(record.subjectKind as MaturitySubjectKind)) {
      errors.push(`${pointer}/subjectKind: unsupported value`);
    }
    if (typeof record.subjectId !== 'string' || !/^[a-z0-9-]+$/.test(record.subjectId)) {
      errors.push(`${pointer}/subjectId: expected stable lowercase identifier`);
    }
    if (typeof record.contentVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(record.contentVersion)) {
      errors.push(`${pointer}/contentVersion: expected semantic version`);
    }
    if (!MATURITY_STATUSES.includes(record.status as ContentMaturity)) {
      errors.push(`${pointer}/status: unsupported value`);
    }
    if (!Array.isArray(record.evidence) || record.evidence.length === 0
      || record.evidence.some((entry) => typeof entry !== 'string' || entry.length === 0)) {
      errors.push(`${pointer}/evidence: expected non-empty strings`);
    }
    const subjectVersion = `${String(record.subjectKind)}:${String(record.subjectId)}@${String(record.contentVersion)}`;
    if (subjects.has(subjectVersion)) errors.push(`${pointer}: duplicate exact-version subject ${subjectVersion}`);
    else subjects.add(subjectVersion);
  });
  return errors;
}

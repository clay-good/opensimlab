import type { Scenario } from '@anesthesia/engine';
import { scenarioSearchText } from './query';
import type { ScenarioCompletionCatalog } from '@platform/catalog/scenario-completion';
import type { ContentMaturity } from '@platform/catalog/maturity';

export const SCENARIO_CATALOG_SCHEMA_VERSION = 1;

export interface PublicScenarioCatalogEntry {
  readonly id: string;
  readonly path: string;
  readonly title: string;
  readonly contentVersion: string;
  readonly estimatedMinutes: number;
  readonly difficulty: 'introductory' | 'intermediate' | 'advanced';
  readonly maturity: ContentMaturity;
  readonly environment: string;
  readonly practiceRegions: readonly string[];
  readonly fidelityClass: string;
  readonly objectives: readonly string[];
  readonly searchText: string;
}

export interface PublicScenarioCatalog {
  readonly schemaVersion: 1;
  readonly moduleId: string;
  readonly scenarioCount: number;
  readonly scenarios: readonly PublicScenarioCatalogEntry[];
}

const strings = { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } } as const;

export const SCENARIO_CATALOG_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://opensimlab.com/catalog/scenario-catalog.schema.json',
  title: 'Open Sim Lab public scenario catalog and search index',
  type: 'object', additionalProperties: false,
  required: ['schemaVersion', 'moduleId', 'scenarioCount', 'scenarios'],
  properties: {
    schemaVersion: { const: SCENARIO_CATALOG_SCHEMA_VERSION },
    moduleId: { type: 'string', minLength: 1 },
    scenarioCount: { type: 'integer', minimum: 0 },
    scenarios: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: [
          'id', 'path', 'title', 'contentVersion', 'estimatedMinutes', 'difficulty',
          'maturity', 'environment', 'practiceRegions', 'fidelityClass', 'objectives', 'searchText',
        ],
        properties: {
          id: { type: 'string', pattern: '^[a-z0-9-]+$' },
          path: { type: 'string', pattern: '^/anesthesia/scenario/[a-z0-9-]+$' },
          title: { type: 'string', minLength: 1 },
          contentVersion: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
          estimatedMinutes: { type: 'integer', minimum: 1 },
          difficulty: { enum: ['introductory', 'intermediate', 'advanced'] },
          maturity: {
            enum: ['draft', 'preview', 'source_checked', 'clinically_reviewed',
              'institution_endorsed', 'withdrawn'],
          },
          environment: { type: 'string', minLength: 1 },
          practiceRegions: strings,
          fidelityClass: { type: 'string', minLength: 1 },
          objectives: strings,
          searchText: { type: 'string', minLength: 1 },
        },
      },
    },
  },
} as const;

export function buildPublicScenarioCatalog(
  scenarios: readonly Scenario[],
  completion: ScenarioCompletionCatalog,
): PublicScenarioCatalog {
  const entries = scenarios.map((scenario): PublicScenarioCatalogEntry => {
    const audit = completion.scenarios.find((candidate) => (
      candidate.scenarioId === scenario.metadata.id
      && candidate.contentVersion === scenario.metadata.version
    ));
    if (!audit) {
      throw new Error(
        `No exact-version completion audit for ${scenario.metadata.id} ${scenario.metadata.version}.`,
      );
    }
    return {
      id: scenario.metadata.id,
      path: `/anesthesia/scenario/${scenario.metadata.id}`,
      title: scenario.metadata.title,
      contentVersion: scenario.metadata.version,
      estimatedMinutes: scenario.metadata.estimatedMinutes,
      difficulty: scenario.metadata.difficulty,
      maturity: scenario.metadata.maturity,
      environment: audit.environment,
      practiceRegions: audit.practiceRegions,
      fidelityClass: audit.fidelityClass,
      objectives: scenario.metadata.objectives.map((objective) => objective.statement),
      searchText: scenarioSearchText(scenario),
    };
  });
  return {
    schemaVersion: SCENARIO_CATALOG_SCHEMA_VERSION,
    moduleId: completion.moduleId,
    scenarioCount: entries.length,
    scenarios: entries,
  };
}

export function validatePublicScenarioCatalog(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['/: expected object'];
  const catalog = value as Record<string, unknown>;
  const errors: string[] = [];
  if (catalog.schemaVersion !== SCENARIO_CATALOG_SCHEMA_VERSION) {
    errors.push('/schemaVersion: expected 1');
  }
  if (!Array.isArray(catalog.scenarios)) return [...errors, '/scenarios: expected array'];
  if (catalog.scenarioCount !== catalog.scenarios.length) {
    errors.push('/scenarioCount: does not match scenarios length');
  }
  const ids = new Set<string>();
  catalog.scenarios.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push(`/scenarios/${index}: expected object`);
      return;
    }
    const entry = raw as Record<string, unknown>;
    if (typeof entry.id !== 'string' || !/^[a-z0-9-]+$/.test(entry.id)) {
      errors.push(`/scenarios/${index}/id: expected stable id`);
    } else if (ids.has(entry.id)) errors.push(`/scenarios/${index}/id: duplicate ${entry.id}`);
    else ids.add(entry.id);
    if (entry.path !== `/anesthesia/scenario/${String(entry.id)}`) {
      errors.push(`/scenarios/${index}/path: does not match id`);
    }
    if (typeof entry.searchText !== 'string' || entry.searchText.length === 0) {
      errors.push(`/scenarios/${index}/searchText: expected non-empty search index`);
    }
  });
  return errors;
}

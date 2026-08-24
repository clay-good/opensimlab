import type { Scenario } from '@anesthesia/engine';
import type { ContentMaturity } from '@platform/catalog/maturity';

export type CatalogDifficulty = Scenario['metadata']['difficulty'] | 'all';
export type CatalogDuration = 'all' | 'under-10' | '10-plus';
export type CatalogMaturity = ContentMaturity | 'all';

export interface CatalogQuery {
  readonly q: string;
  readonly difficulty: CatalogDifficulty;
  readonly duration: CatalogDuration;
  readonly maturity: CatalogMaturity;
}

export const EMPTY_CATALOG_QUERY: CatalogQuery = {
  q: '', difficulty: 'all', duration: 'all', maturity: 'all',
};

const DIFFICULTIES: readonly CatalogDifficulty[] = [
  'all', 'introductory', 'intermediate', 'advanced',
];
const DURATIONS: readonly CatalogDuration[] = ['all', 'under-10', '10-plus'];
const MATURITIES: readonly CatalogMaturity[] = [
  'all', 'draft', 'preview', 'source_checked', 'clinically_reviewed',
  'institution_endorsed', 'withdrawn',
];

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.find((candidate) => candidate === value) ?? fallback;
}

/** Read only known, bounded values from an untrusted URL. */
export function readCatalogQuery(search: string): CatalogQuery {
  const params = new URLSearchParams(search);
  return {
    q: (params.get('q') ?? '').trim().slice(0, 80),
    difficulty: oneOf(params.get('difficulty'), DIFFICULTIES, 'all'),
    duration: oneOf(params.get('duration'), DURATIONS, 'all'),
    maturity: oneOf(params.get('maturity'), MATURITIES, 'all'),
  };
}

/** Keep shared catalog links short: defaults never appear in the URL. */
export function catalogQueryString(query: CatalogQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.difficulty !== 'all') params.set('difficulty', query.difficulty);
  if (query.duration !== 'all') params.set('duration', query.duration);
  if (query.maturity !== 'all') params.set('maturity', query.maturity);
  const value = params.toString();
  return value ? `?${value}` : '';
}

function searchableText(scenario: Scenario): string {
  return [
    scenario.metadata.id,
    scenario.metadata.title,
    scenario.patient.diagnosis,
    scenario.patient.procedure,
    ...scenario.metadata.objectives.flatMap((objective) => [objective.statement, objective.measure]),
  ].join(' ').toLocaleLowerCase();
}

/** Deterministic client-side filtering over the same registry used by prerendering. */
export function filterCatalog(
  scenarios: readonly Scenario[],
  query: CatalogQuery,
): Scenario[] {
  const terms = query.q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return scenarios.filter((scenario) => {
    if (query.difficulty !== 'all' && scenario.metadata.difficulty !== query.difficulty) return false;
    if (query.duration === 'under-10' && scenario.metadata.estimatedMinutes >= 10) return false;
    if (query.duration === '10-plus' && scenario.metadata.estimatedMinutes < 10) return false;
    if (query.maturity !== 'all' && scenario.metadata.maturity !== query.maturity) return false;
    const text = searchableText(scenario);
    return terms.every((term) => text.includes(term));
  });
}

export function hasCatalogFilters(query: CatalogQuery): boolean {
  return catalogQueryString(query) !== '';
}

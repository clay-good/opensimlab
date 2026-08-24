import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '@anesthesia/scenarios';
import {
  EMPTY_CATALOG_QUERY,
  catalogQueryString,
  filterCatalog,
  readCatalogQuery,
} from '@anesthesia/catalog/query';

describe('scenario catalog query', () => {
  it('searches patient problems, procedures, and learning objectives without word-order tricks', () => {
    expect(filterCatalog(SCENARIOS, { ...EMPTY_CATALOG_QUERY, q: 'pediatric induction' })
      .map((scenario) => scenario.metadata.id)).toContain('routine-pediatric-iv-induction');
    expect(filterCatalog(SCENARIOS, { ...EMPTY_CATALOG_QUERY, q: 'malignant temperature' })
      .map((scenario) => scenario.metadata.id)).toContain(
        'early-malignant-hyperthermia-during-volatile-anesthesia',
      );
  });

  it('combines difficulty, duration, and maturity filters', () => {
    const matches = filterCatalog(SCENARIOS, {
      q: '', difficulty: 'advanced', duration: 'under-10', maturity: 'draft',
    });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((scenario) => scenario.metadata.difficulty === 'advanced')).toBe(true);
    expect(matches.every((scenario) => scenario.metadata.estimatedMinutes < 10)).toBe(true);
    expect(matches.every((scenario) => scenario.metadata.maturity === 'draft')).toBe(true);
  });

  it('round-trips known URL state and omits defaults', () => {
    const search = '?q=airway&difficulty=advanced&duration=10-plus&maturity=draft';
    expect(catalogQueryString(readCatalogQuery(search))).toBe(search);
    expect(catalogQueryString(EMPTY_CATALOG_QUERY)).toBe('');
  });

  it('bounds search text and drops hostile or unknown filter values', () => {
    const parsed = readCatalogQuery(
      `?q=${'x'.repeat(200)}&difficulty=expert&duration=forever&maturity=approved`,
    );
    expect(parsed.q).toHaveLength(80);
    expect(parsed.difficulty).toBe('all');
    expect(parsed.duration).toBe('all');
    expect(parsed.maturity).toBe('all');
  });
});

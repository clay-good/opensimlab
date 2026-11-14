/**
 * The committed return index against the real catalogues.
 *
 * `src/platform/catalog/return-index.generated.ts` is written by
 * `npm run return-index`. It is committed so that the dev server and the tests
 * work on a fresh checkout, which means it can go stale: a renamed lesson or a
 * reworded objective would leave the spaced-return suggestion naming a lesson
 * by words the catalogue no longer uses. This is what refuses that.
 */
import { describe, expect, it } from 'vitest';
import { buildReturnIndex } from '@platform/catalog/return-index';
import { RETURN_INDEX } from '@platform/catalog/return-index.generated';
import { MODULES } from '@platform/modules/registry';
import { RETURN_INDEX_INPUT } from '../../scripts/return-index-input';

describe('the return index', () => {
  it('matches every available module\'s scenarios exactly', () => {
    expect(RETURN_INDEX).toEqual(buildReturnIndex(RETURN_INDEX_INPUT));
  });

  it('covers every available module, and only registered modules', () => {
    const available = MODULES.filter((module) => module.status === 'available');
    expect([...new Set(RETURN_INDEX.map((entry) => entry.moduleId))])
      .toEqual(available.map((module) => module.id));
    for (const module of available) {
      expect([module.id, RETURN_INDEX.filter((entry) => entry.moduleId === module.id).length])
        .toEqual([module.id, module.scenarioCount]);
    }
  });

  it('carries the words a suggestion needs and nothing more', () => {
    for (const entry of RETURN_INDEX) {
      expect(Object.keys(entry).sort())
        .toEqual(['estimatedMinutes', 'moduleId', 'objectives', 'scenarioId', 'title']);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.estimatedMinutes).toBeGreaterThan(0);
      expect(entry.objectives.length).toBeGreaterThan(0);
      for (const objective of entry.objectives) {
        expect(Object.keys(objective).sort()).toEqual(['id', 'statement']);
      }
    }
  });

  it('identifies every lesson uniquely by module and scenario together', () => {
    const keys = RETURN_INDEX.map((entry) => `${entry.moduleId}:${entry.scenarioId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

import { describe, expect, it } from 'vitest';
import { blindBriefing, blindDraw, type PoolEntry } from '@anesthesia/catalog/blind-draw';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { MODULES } from '@platform/modules/registry';
import type { PracticeAttempt } from '@anesthesia/catalog/practice-history';

const pool: readonly PoolEntry[] = FACILITATED_SCENARIOS.map((entry) => ({ moduleId: entry.moduleRoute, scenario: entry.scenario }));
const attempt = (entry: PoolEntry): PracticeAttempt => ({
  schemaVersion: 2, moduleId: entry.moduleId, scenarioId: entry.scenario.metadata.id, contentVersion: entry.scenario.metadata.version,
  goalId: null, completedAt: '2026-11-01T00:00:00.000Z', simulatedSeconds: 60, objectives: [],
});

describe('the blind draw', () => {
  it('is reproducible from the seed and pool a transcript records, whatever order the pool came in', () => {
    const first = blindDraw(pool, 424242, [])!;
    const shuffled = [...pool].reverse();
    expect(blindDraw(shuffled, 424242, [])!.entry).toBe(first.entry);
    // Rebuilding the pool from the record alone gives the same draw.
    const fromRecord = first.record.pool.map((key) => pool.find((entry) => `${entry.moduleId}:${entry.scenario.metadata.id}` === key)!);
    expect(blindDraw(fromRecord, first.record.seed, [], { unseenOnly: first.record.unseenOnly })!.entry).toBe(first.entry);
    expect(first.record.pool).toHaveLength(pool.length);
  });

  it('draws across the whole pool rather than favouring its start', () => {
    const small = pool.slice(0, 4);
    const counts = new Map<string, number>();
    for (let seed = 1; seed <= 4000; seed += 1) {
      const id = blindDraw(small, seed, [])!.entry.scenario.metadata.id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    expect(counts.size).toBe(4);
    for (const count of counts.values()) expect(count).toBeGreaterThan(850);
  });

  it('leaves out what this device has practised, by default, and says so when nothing is left', () => {
    const small = pool.slice(0, 3);
    const history = small.slice(0, 2).map(attempt);
    for (let seed = 1; seed <= 50; seed += 1) {
      expect(blindDraw(small, seed, history)!.entry).toBe(small[2]);
    }
    expect(blindDraw(small, 7, small.map(attempt))).toBeNull();
    expect(blindDraw(small, 7, small.map(attempt), { unseenOnly: false })).not.toBeNull();
  });

  it('distinguishes two modules\' lessons that share an id', () => {
    const shared = pool.filter((entry) => pool.filter((other) => other.scenario.metadata.id === entry.scenario.metadata.id).length > 1);
    if (shared.length < 2) return;
    const [one, two] = shared;
    expect(blindDraw([one!, two!], 1, [attempt(one!)])!.entry).toBe(two);
  });
});

describe('the pre-start briefing', () => {
  /**
   * The design's withheld set is the title, the module name, the card summary,
   * the competency tags and the search terms. The briefing is built from an
   * allow-list, so this holds it there over every lesson: none of the withheld
   * text appears in what a learner would see before starting.
   */
  it.each(pool.map((entry) => [`${entry.moduleId}:${entry.scenario.metadata.id}`, entry] as const))('withholds what %s is', (_, entry) => {
    const briefing = blindBriefing(entry.scenario);
    expect(Object.keys(briefing).sort()).toEqual(['contentNote', 'estimatedMinutes', 'maturity']);
    const shown = JSON.stringify(briefing).toLowerCase();
    expect(shown).not.toContain(entry.scenario.metadata.title.toLowerCase());
    expect(shown).not.toContain(entry.scenario.metadata.id);
    expect(shown).not.toContain(entry.scenario.patient.diagnosis.toLowerCase());
    for (const objective of entry.scenario.metadata.objectives) expect(shown).not.toContain(objective.statement.toLowerCase());
    const module = MODULES.find((candidate) => candidate.route === entry.moduleId)!;
    expect(shown).not.toContain(module.displayName.toLowerCase());
  });
});

import { describe, expect, it } from 'vitest';
import {
  appendPracticeAttempt,
  completedScenarioIds,
  importPracticeHistory,
  loadPracticeHistory,
  objectiveChanges,
  practiceHistoryExport,
  PRACTICE_HISTORY_LIMIT,
  type PracticeAttempt,
} from '@anesthesia/catalog/practice-history';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

const attempt = (index = 0): PracticeAttempt => ({
  schemaVersion: 1,
  scenarioId: index % 2 === 0 ? 'routine-induction' : 'rapid-desaturation',
  contentVersion: '0.1.0', goalId: 'first-lab',
  completedAt: new Date(Date.UTC(2026, 7, 24, 12, 0, index)).toISOString(),
  simulatedSeconds: 60 + index,
  objectives: [{ objectiveId: 'preoxygenate', outcome: index % 2 === 0 ? 'partly-met' : 'met' }],
});

describe('bounded private practice history', () => {
  it('stores only the declared summary and keeps the newest 50 attempts', () => {
    const storage = memoryStorage();
    for (let index = 0; index < PRACTICE_HISTORY_LIMIT + 5; index += 1) {
      appendPracticeAttempt(attempt(index), storage);
    }
    const history = loadPracticeHistory(storage);
    expect(history).toHaveLength(PRACTICE_HISTORY_LIMIT);
    expect(history[0]?.simulatedSeconds).toBe(65);
    expect(JSON.stringify(history)).not.toMatch(/reflection|actions|historySample|patient|identity/i);
  });

  it('derives completed scenarios and behavior-specific changes without a score', () => {
    const first = attempt();
    expect([...completedScenarioIds([first])]).toEqual(['routine-induction']);
    expect(objectiveChanges(first, [{ objectiveId: 'preoxygenate', outcome: 'met' }]))
      .toEqual([{ objectiveId: 'preoxygenate', previous: 'partly-met', current: 'met' }]);
    expect(Object.keys(objectiveChanges(first, [{ objectiveId: 'preoxygenate', outcome: 'met' }])[0]!))
      .not.toContain('score');
  });

  it('round-trips an explicit export/import and rejects hostile records atomically', () => {
    const source = memoryStorage();
    appendPracticeAttempt(attempt(), source);
    const target = memoryStorage();
    expect(importPracticeHistory(practiceHistoryExport(loadPracticeHistory(source)), target))
      .toEqual([attempt()]);
    const recordWithExtraData = { ...attempt(1), identity: 'must-not-survive' };
    expect(importPracticeHistory(JSON.stringify({
      schemaVersion: 1, attempts: [recordWithExtraData],
    }), target)[1]).toEqual(attempt(1));
    expect(() => importPracticeHistory('{"schemaVersion":1,"attempts":[{"scenarioId":"../../x"}]}', target))
      .toThrow('Invalid practice history file.');
    expect(JSON.stringify(loadPracticeHistory(target))).not.toContain('must-not-survive');
  });

  it('ignores malformed local storage instead of breaking the tutor', () => {
    const storage = memoryStorage();
    storage.setItem('opensimlab.practice-history', '[{"schemaVersion":99}]');
    expect(loadPracticeHistory(storage)).toEqual([]);
  });

  it('rejects oversized and over-count imports before changing storage', () => {
    const storage = memoryStorage();
    appendPracticeAttempt(attempt(), storage);
    expect(() => importPracticeHistory('x'.repeat(100_001), storage)).toThrow('too large');
    expect(() => importPracticeHistory(JSON.stringify({
      schemaVersion: 1,
      attempts: Array.from({ length: PRACTICE_HISTORY_LIMIT + 1 }, () => attempt()),
    }), storage)).toThrow('Invalid practice history file.');
    expect(loadPracticeHistory(storage)).toEqual([attempt()]);
  });
});

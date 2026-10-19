import { describe, expect, it } from 'vitest';
import {
  appendPracticeAttempt,
  completedScenarioIds,
  importPracticeHistory,
  importProgressFile,
  objectiveStatus,
  SIMULATED_PRACTICE_NOT_CLINICAL_TIME,
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
    // The file keeps the calendar day and drops the time of day.
    expect(importPracticeHistory(practiceHistoryExport(loadPracticeHistory(source)), target))
      .toEqual([{ ...attempt(), completedAt: '2026-08-24T00:00:00.000Z' }]);
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

  describe('the progress file', () => {
    const later = (index: number, outcome: PracticeAttempt['objectives'][number]['outcome'], day: number): PracticeAttempt => ({
      ...attempt(index), objectives: [{ objectiveId: 'preoxygenate', outcome }],
      completedAt: new Date(Date.UTC(2026, 8, day, 9, 30)).toISOString(),
    });

    it('carries both statements and no identifier, device field, or sub-day timestamp', () => {
      const text = practiceHistoryExport([attempt(0), attempt(1)]);
      const file = JSON.parse(text) as Record<string, unknown>;
      expect(file.simulatedPracticeNotClinicalTime).toBe(SIMULATED_PRACTICE_NOT_CLINICAL_TIME);
      expect(file.notForClinicalUse).toBeTruthy();
      expect(text).not.toMatch(/T\d{2}:\d{2}|\d{2}:\d{2}:\d{2}|completedAt/);
      expect(text).not.toMatch(/"(?:id|uuid|device|userAgent|platform|identity|email|name)"\s*:/i);
      expect(text).toContain('"completedOn": "2026-08-24"');
    });

    it('round-trips every objective status losslessly between devices', () => {
      const source = memoryStorage();
      for (const entry of [attempt(0), attempt(1), later(2, 'met', 3)]) appendPracticeAttempt(entry, source);
      const target = memoryStorage();
      importProgressFile(practiceHistoryExport(loadPracticeHistory(source)), 'replace', target);
      expect(objectiveStatus(loadPracticeHistory(target))).toEqual(objectiveStatus(loadPracticeHistory(source)));
    });

    it('merges without double-counting an attempt this device already holds', () => {
      const storage = memoryStorage();
      appendPracticeAttempt(attempt(0), storage);
      const file = practiceHistoryExport([attempt(0), later(2, 'met', 3)]);
      const result = importProgressFile(file, 'merge', storage);
      expect(result).toMatchObject({ added: 1, duplicates: 1 });
      expect(result.history).toHaveLength(2);
      expect(importProgressFile(file, 'merge', storage)).toMatchObject({ added: 0, duplicates: 2, changes: [] });
    });

    it('replaces on request and reports every status that changed, and from what', () => {
      const storage = memoryStorage();
      appendPracticeAttempt(later(0, 'not-met', 1), storage);
      const result = importProgressFile(practiceHistoryExport([later(2, 'met', 3)]), 'replace', storage);
      expect(result.history).toHaveLength(1);
      expect(result.changes).toEqual([{ scenarioId: 'routine-induction', objectiveId: 'preoxygenate',
        previous: 'not-met', current: 'met' }]);
    });

    it('still reads a version 1 file, and refuses an unknown version atomically', () => {
      const storage = memoryStorage();
      const v1 = JSON.stringify({ schemaVersion: 1, attempts: [attempt(0)] });
      expect(importProgressFile(v1, 'merge', storage).history).toEqual([attempt(0)]);
      expect(() => importProgressFile(JSON.stringify({ schemaVersion: 3, attempts: [] }), 'replace', storage))
        .toThrow('Invalid practice history file.');
      expect(loadPracticeHistory(storage)).toEqual([attempt(0)]);
      const badDay = JSON.stringify({ schemaVersion: 2, attempts: [{ ...attempt(0), completedOn: '2026-08-24T10:00' }] });
      expect(() => importProgressFile(badDay, 'merge', storage)).toThrow('Invalid practice history file.');
    });
  });
});

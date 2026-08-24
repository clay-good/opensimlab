import type { ObjectiveFinding } from '@anesthesia/debrief/analysis';
import type { PreparationPathId } from './preparation-paths';
import { PREPARATION_PATH_IDS } from './preparation-paths';

export const PRACTICE_HISTORY_SCHEMA_VERSION = 1;
export const PRACTICE_HISTORY_LIMIT = 50;
export const PRACTICE_HISTORY_KEY = 'opensimlab.practice-history';

export type PracticeOutcome = ObjectiveFinding['outcome'];

export interface PracticeAttempt {
  readonly schemaVersion: 1;
  readonly scenarioId: string;
  readonly contentVersion: string;
  readonly goalId: PreparationPathId | null;
  readonly completedAt: string;
  readonly simulatedSeconds: number;
  readonly objectives: readonly {
    readonly objectiveId: string;
    readonly outcome: PracticeOutcome;
  }[];
}

export interface ObjectiveChange {
  readonly objectiveId: string;
  readonly previous: PracticeOutcome;
  readonly current: PracticeOutcome;
}

const OUTCOMES: readonly PracticeOutcome[] = ['met', 'partly-met', 'not-met', 'not-exercised'];

function validIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString() === value;
}

function validAttempt(value: unknown): value is PracticeAttempt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.schemaVersion === PRACTICE_HISTORY_SCHEMA_VERSION
    && typeof record.scenarioId === 'string' && /^[a-z0-9-]+$/.test(record.scenarioId)
    && typeof record.contentVersion === 'string' && /^\d+\.\d+\.\d+$/.test(record.contentVersion)
    && (record.goalId === null || PREPARATION_PATH_IDS.includes(record.goalId as PreparationPathId))
    && validIsoTimestamp(record.completedAt)
    && typeof record.simulatedSeconds === 'number' && Number.isFinite(record.simulatedSeconds)
    && record.simulatedSeconds >= 0
    && Array.isArray(record.objectives) && record.objectives.length > 0
    && record.objectives.every((objective) => {
      if (!objective || typeof objective !== 'object' || Array.isArray(objective)) return false;
      const entry = objective as Record<string, unknown>;
      return typeof entry.objectiveId === 'string' && /^[a-z0-9-]+$/.test(entry.objectiveId)
        && OUTCOMES.includes(entry.outcome as PracticeOutcome);
    });
}

function normalizedAttempt(value: unknown): PracticeAttempt | undefined {
  if (!validAttempt(value)) return undefined;
  return {
    schemaVersion: PRACTICE_HISTORY_SCHEMA_VERSION,
    scenarioId: value.scenarioId,
    contentVersion: value.contentVersion,
    goalId: value.goalId,
    completedAt: value.completedAt,
    simulatedSeconds: value.simulatedSeconds,
    objectives: value.objectives.map(({ objectiveId, outcome }) => ({ objectiveId, outcome })),
  };
}

function availableStorage(storage?: Storage): Storage | undefined {
  if (storage) return storage;
  try { return localStorage; } catch { return undefined; }
}

export function loadPracticeHistory(storage?: Storage): PracticeAttempt[] {
  const target = availableStorage(storage);
  if (!target) return [];
  try {
    const value: unknown = JSON.parse(target.getItem(PRACTICE_HISTORY_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.flatMap((attempt) => normalizedAttempt(attempt) ?? []).slice(-PRACTICE_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function appendPracticeAttempt(
  attempt: PracticeAttempt,
  storage?: Storage,
): PracticeAttempt[] {
  const normalized = normalizedAttempt(attempt);
  if (!normalized) throw new Error('Invalid bounded practice attempt.');
  const next = [...loadPracticeHistory(storage), normalized].slice(-PRACTICE_HISTORY_LIMIT);
  try { availableStorage(storage)?.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(next)); } catch { /* Local storage is optional. */ }
  return next;
}

export function completedScenarioIds(history: readonly PracticeAttempt[]): Set<string> {
  return new Set(history.map((attempt) => attempt.scenarioId));
}

export function previousScenarioAttempt(
  history: readonly PracticeAttempt[],
  scenarioId: string,
  contentVersion: string,
): PracticeAttempt | undefined {
  return [...history].reverse().find((attempt) => (
    attempt.scenarioId === scenarioId && attempt.contentVersion === contentVersion
  ));
}

export function objectiveChanges(
  previous: PracticeAttempt | undefined,
  current: readonly Pick<ObjectiveFinding, 'objectiveId' | 'outcome'>[],
): ObjectiveChange[] {
  if (!previous) return [];
  return current.flatMap((finding) => {
    const before = previous.objectives.find((objective) => objective.objectiveId === finding.objectiveId);
    return before && before.outcome !== finding.outcome
      ? [{ objectiveId: finding.objectiveId, previous: before.outcome, current: finding.outcome }]
      : [];
  });
}

export function practiceHistoryExport(history: readonly PracticeAttempt[]): string {
  return `${JSON.stringify({ schemaVersion: 1, attempts: history }, null, 2)}\n`;
}

export function importPracticeHistory(text: string, storage?: Storage): PracticeAttempt[] {
  if (text.length > 100_000) throw new Error('Practice history file is too large.');
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid practice history file.');
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== 1 || !Array.isArray(record.attempts)
    || record.attempts.length > PRACTICE_HISTORY_LIMIT) throw new Error('Invalid practice history file.');
  const imported = record.attempts.map(normalizedAttempt);
  if (imported.some((attempt) => !attempt)) throw new Error('Invalid practice history file.');
  const next = [...loadPracticeHistory(storage), ...imported as PracticeAttempt[]]
    .slice(-PRACTICE_HISTORY_LIMIT);
  availableStorage(storage)?.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(next));
  return next;
}

import type { ObjectiveFinding } from '@anesthesia/debrief/analysis';
import type { PreparationPathId } from './preparation-paths';
import { PREPARATION_PATH_IDS } from './preparation-paths';
import { NOT_CLINICALLY_REVIEWED, NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';

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

/**
 * The progress file says what it records: rehearsal in a simulator, which no
 * program may count as clinical experience.
 */
export const SIMULATED_PRACTICE_NOT_CLINICAL_TIME =
  'This file records simulated practice. It is not clinical time, a case log, or a procedure log, '
  + 'and it does not count toward any case requirement, clinical hour, or supervised experience.';

export const PROGRESS_FILE_SCHEMA_VERSION = 2;

/** The calendar day of an attempt; the progress file carries nothing finer. */
const dayOf = (timestamp: string) => timestamp.slice(0, 10);

/**
 * The progress file: the only way practice moves between devices. Version 2
 * keeps each attempt's calendar day and drops its time of day, so the file
 * cannot place a learner at a moment.
 */
export function practiceHistoryExport(history: readonly PracticeAttempt[]): string {
  return `${JSON.stringify({
    schemaVersion: PROGRESS_FILE_SCHEMA_VERSION,
    notForClinicalUse: NOT_FOR_CLINICAL_USE,
    notClinicallyReviewed: NOT_CLINICALLY_REVIEWED,
    simulatedPracticeNotClinicalTime: SIMULATED_PRACTICE_NOT_CLINICAL_TIME,
    attempts: history.map(({ completedAt, schemaVersion: _version, ...rest }) => ({
      ...rest, completedOn: dayOf(completedAt),
    })),
  }, null, 2)}\n`;
}

/** Read a version 1 (full timestamp) or version 2 (calendar day) attempt. */
function fileAttempt(value: unknown, fileVersion: number): PracticeAttempt | undefined {
  if (fileVersion === 1) return normalizedAttempt(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const { completedOn, ...rest } = value as Record<string, unknown>;
  if (typeof completedOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(completedOn)) return undefined;
  return normalizedAttempt({ ...rest, schemaVersion: PRACTICE_HISTORY_SCHEMA_VERSION,
    completedAt: `${completedOn}T00:00:00.000Z` });
}

function parseProgressFile(text: string): PracticeAttempt[] {
  if (text.length > 100_000) throw new Error('Practice history file is too large.');
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid practice history file.');
  const record = value as Record<string, unknown>;
  const version = record.schemaVersion;
  if ((version !== 1 && version !== PROGRESS_FILE_SCHEMA_VERSION) || !Array.isArray(record.attempts)
    || record.attempts.length > PRACTICE_HISTORY_LIMIT) throw new Error('Invalid practice history file.');
  const imported = record.attempts.map((attempt) => fileAttempt(attempt, version));
  if (imported.some((attempt) => !attempt)) throw new Error('Invalid practice history file.');
  return imported as PracticeAttempt[];
}

/** One attempt as the progress file sees it, so a re-import does not double-count. */
const attemptKey = (attempt: PracticeAttempt) => JSON.stringify([
  attempt.scenarioId, attempt.contentVersion, attempt.goalId, dayOf(attempt.completedAt),
  attempt.simulatedSeconds, attempt.objectives,
]);

/** The latest recorded outcome of every scenario objective. */
export function objectiveStatus(history: readonly PracticeAttempt[]): Map<string, PracticeOutcome> {
  const status = new Map<string, PracticeOutcome>();
  for (const attempt of [...history].sort((a, b) => a.completedAt.localeCompare(b.completedAt))) {
    for (const { objectiveId, outcome } of attempt.objectives) {
      status.set(`${attempt.scenarioId}:${objectiveId}`, outcome);
    }
  }
  return status;
}

export interface StatusChange {
  readonly scenarioId: string;
  readonly objectiveId: string;
  readonly previous: PracticeOutcome | null;
  readonly current: PracticeOutcome | null;
}

export interface ProgressImport {
  readonly history: PracticeAttempt[];
  readonly added: number;
  readonly duplicates: number;
  /** Every objective whose latest status differs after the import, and from what. */
  readonly changes: readonly StatusChange[];
}

/**
 * Import a progress file. `merge` adds attempts this device does not already
 * hold; `replace` discards this device's history first. Either way it is
 * atomic, and the learner is told every status that moved.
 */
export function importProgressFile(
  text: string, mode: 'merge' | 'replace', storage?: Storage,
): ProgressImport {
  const imported = parseProgressFile(text);
  const before = mode === 'replace' ? [] : loadPracticeHistory(storage);
  const previousStatus = objectiveStatus(loadPracticeHistory(storage));
  const seen = new Set(before.map(attemptKey));
  const fresh = imported.filter((attempt) => {
    const key = attemptKey(attempt);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const history = [...before, ...fresh]
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .slice(-PRACTICE_HISTORY_LIMIT);
  availableStorage(storage)?.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(history));
  const currentStatus = objectiveStatus(history);
  const keys = [...new Set([...previousStatus.keys(), ...currentStatus.keys()])].sort();
  const changes = keys.flatMap((key) => {
    const previous = previousStatus.get(key) ?? null;
    const current = currentStatus.get(key) ?? null;
    if (previous === current) return [];
    const [scenarioId, objectiveId] = key.split(':') as [string, string];
    return [{ scenarioId, objectiveId, previous, current }];
  });
  return { history, added: fresh.length, duplicates: imported.length - fresh.length, changes };
}

/** Merge a progress file into this device's history. */
export function importPracticeHistory(text: string, storage?: Storage): PracticeAttempt[] {
  return importProgressFile(text, 'merge', storage).history;
}

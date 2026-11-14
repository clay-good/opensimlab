import type { ObjectiveFinding } from '@anesthesia/debrief/analysis';
import type { PreparationPathId } from './preparation-paths';
import { PREPARATION_PATH_IDS } from './preparation-paths';
import { NOT_CLINICALLY_REVIEWED, NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { MODULES } from '@platform/modules/registry';

export const PRACTICE_HISTORY_SCHEMA_VERSION = 2;
export const PRACTICE_HISTORY_LIMIT = 50;
export const PRACTICE_HISTORY_KEY = 'opensimlab.practice-history';

/** Only a registered module may name itself in a record this device stores. */
const REGISTERED_MODULE_IDS: ReadonlySet<string> = new Set(MODULES.map((module) => module.id));

export type PracticeOutcome = ObjectiveFinding['outcome'];

export interface PracticeAttempt {
  readonly schemaVersion: 2;
  /**
   * The module whose lesson this was.
   *
   * Scenario ids are unique inside a module, not across the catalogue:
   * `status-epilepticus` is one lesson in emergency medicine and a different
   * one in critical care. Without this field an attempt names two patients, and
   * the history treated them as one — practising either marked both complete and
   * made both due for a spaced return.
   *
   * `null` means a record written before this field existed. Such a record is
   * still matched by scenario id alone, which is exactly what it used to do, so
   * an existing learner loses nothing on upgrade.
   */
  readonly moduleId: string | null;
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

/** A module field is absent (version 1), explicitly unknown, or a registered module. */
function validModuleId(value: unknown): boolean {
  return value === undefined || value === null
    || (typeof value === 'string' && REGISTERED_MODULE_IDS.has(value));
}

function validAttempt(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (record.schemaVersion === 1 || record.schemaVersion === PRACTICE_HISTORY_SCHEMA_VERSION)
    && validModuleId(record.moduleId)
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

/**
 * Read any accepted record into the current shape, dropping every field the
 * schema does not declare. A version 1 record simply has no module.
 */
function normalizedAttempt(value: unknown): PracticeAttempt | undefined {
  if (!validAttempt(value)) return undefined;
  const record = value as Omit<PracticeAttempt, 'schemaVersion' | 'moduleId'>
    & { readonly moduleId?: string | null };
  return {
    schemaVersion: PRACTICE_HISTORY_SCHEMA_VERSION,
    moduleId: record.moduleId ?? null,
    scenarioId: record.scenarioId,
    contentVersion: record.contentVersion,
    goalId: record.goalId,
    completedAt: record.completedAt,
    simulatedSeconds: record.simulatedSeconds,
    objectives: record.objectives.map(({ objectiveId, outcome }) => ({ objectiveId, outcome })),
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

/**
 * Does this attempt record practice of this lesson?
 *
 * A module-less record (version 1, or a caller that does not know its module)
 * matches by scenario id alone. That is the pre-module behaviour, kept so an
 * upgrade neither forgets a learner's practice nor invents a module for it.
 */
export function attemptIsOf(
  attempt: PracticeAttempt,
  moduleId: string | null,
  scenarioId: string,
): boolean {
  if (attempt.scenarioId !== scenarioId) return false;
  return moduleId === null || attempt.moduleId === null || attempt.moduleId === moduleId;
}

/** The scenarios of one module this device has practised. */
export function completedScenarioIds(
  history: readonly PracticeAttempt[],
  moduleId: string | null,
): Set<string> {
  return new Set(history
    .filter((attempt) => moduleId === null || attempt.moduleId === null || attempt.moduleId === moduleId)
    .map((attempt) => attempt.scenarioId));
}

export function previousScenarioAttempt(
  history: readonly PracticeAttempt[],
  moduleId: string | null,
  scenarioId: string,
  contentVersion: string,
): PracticeAttempt | undefined {
  return [...history].reverse().find((attempt) => (
    attemptIsOf(attempt, moduleId, scenarioId) && attempt.contentVersion === contentVersion
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

export const PROGRESS_FILE_SCHEMA_VERSION = 3;

/** Every progress-file version this build can read. */
const READABLE_PROGRESS_FILE_VERSIONS: readonly number[] = [1, 2, PROGRESS_FILE_SCHEMA_VERSION];

/** The calendar day of an attempt; the progress file carries nothing finer. */
const dayOf = (timestamp: string) => timestamp.slice(0, 10);

/**
 * The progress file: the only way practice moves between devices. Version 2
 * keeps each attempt's calendar day and drops its time of day, so the file
 * cannot place a learner at a moment. Version 3 adds the module each attempt
 * belongs to, so a scenario id that two modules share arrives on the other
 * device as the lesson it actually was.
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

/**
 * Read a version 1 (full timestamp) or version 2/3 (calendar day) attempt. A
 * version 2 file carries no module, which `normalizedAttempt` reads as unknown.
 */
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
  if (typeof version !== 'number' || !READABLE_PROGRESS_FILE_VERSIONS.includes(version)
    || !Array.isArray(record.attempts)
    || record.attempts.length > PRACTICE_HISTORY_LIMIT) throw new Error('Invalid practice history file.');
  const imported = record.attempts.map((attempt) => fileAttempt(attempt, version));
  if (imported.some((attempt) => !attempt)) throw new Error('Invalid practice history file.');
  return imported as PracticeAttempt[];
}

/**
 * One attempt as the progress file sees it, so a re-import does not
 * double-count.
 *
 * The module is deliberately not part of the key. A version 2 file carries no
 * module, and including one would make every record it holds look new beside
 * the same practice recorded here. Two different modules' attempts cannot
 * collide on this key anyway: their objective ids differ, and
 * `tests/unit/scenario-identity.test.ts` holds that across the whole catalogue.
 */
const attemptKey = (attempt: PracticeAttempt) => JSON.stringify([
  attempt.scenarioId, attempt.contentVersion, attempt.goalId, dayOf(attempt.completedAt),
  attempt.simulatedSeconds, attempt.objectives,
]);

/**
 * The latest recorded outcome of every scenario objective.
 *
 * Keyed by scenario and objective rather than by module: an objective id names
 * its own lesson, and no two lessons in the catalogue share a scenario-and-
 * objective pair even where they share a scenario id. Keying by module as well
 * would split a version 2 file's records from this device's own and report
 * every one of them as a status that moved.
 */
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

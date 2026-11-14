/**
 * Spaced return to weak areas (learning/curriculum → Spaced Return To Weak
 * Areas), computed on this device from the bounded practice history.
 *
 * A scenario comes due again after an interval that starts at 7 days after one
 * day of practice and doubles with each further separate day, capped at 56. That
 * schedule is an educational convention, not a measured forgetting curve, and
 * the suggestion says so. Of the scenarios that are due, the one with the
 * weakest latest evidence wins, and among equals the one practised longest ago.
 * At most one suggestion is ever returned, and nothing here measures competence.
 *
 * The ranking runs over the whole catalogue, not one module. The history is
 * what it ranks — module, scenario, objectives, outcomes and days are all in
 * it — and the return index is only how the winner gets its own words back.
 */
import type { PracticeAttempt, PracticeOutcome } from './practice-history';
import type { ReturnIndexEntry } from '@platform/catalog/return-index';
import { t, type MessageKey } from '@platform/i18n/messages';
import { SESSION_MESSAGES } from '@platform/i18n/messages-session';

/** The convention label, in English; the panel reads it from the catalog. */
export const SPACED_RETURN_CONVENTION = SESSION_MESSAGES['spaced.convention'].text;

const OUTCOME_RANK: Readonly<Record<PracticeOutcome, number>> = {
  'not-met': 0, 'partly-met': 1, 'not-exercised': 2, met: 3,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const dayNumber = (iso: string) => Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00.000Z`) / DAY_MS);

/** 7 days after one day of practice, doubling per further separate day, capped at 56. */
export function returnIntervalDays(separateDays: number): number {
  if (separateDays < 1) return 0;
  return Math.min(7 * 2 ** (separateDays - 1), 56);
}

export interface SpacedReturnSuggestion {
  readonly moduleId: string;
  readonly scenarioId: string;
  readonly title: string;
  readonly estimatedMinutes: number;
  /** The objectives with the weakest latest evidence, in the scenario's own words. */
  readonly practises: readonly string[];
  readonly daysSince: number;
  readonly intervalDays: number;
  readonly reason: string;
}

/**
 * Is this attempt practice of this lesson?
 *
 * The module decides it when the record names one. When it does not — a record
 * written before the module was recorded — the objectives decide instead: an
 * attempt that shares a scenario id with this lesson but declares none of its
 * objectives is the other module's lesson of the same name. That reads more of
 * an old record than the module field could, and it never reads it wrong.
 */
function isPracticeOf(
  attempt: PracticeAttempt, entry: ReturnIndexEntry, declared: ReadonlySet<string>,
): boolean {
  if (attempt.scenarioId !== entry.scenarioId) return false;
  if (attempt.moduleId !== null && attempt.moduleId !== entry.moduleId) return false;
  return attempt.objectives.some((objective) => declared.has(objective.objectiveId));
}

/**
 * At most one suggestion, ranked weakest-then-oldest across every module in the
 * index, or nothing when no practised lesson is past its interval.
 */
export function spacedReturnSuggestion(
  history: readonly PracticeAttempt[],
  index: readonly ReturnIndexEntry[],
  now: Date,
): SpacedReturnSuggestion | null {
  const today = dayNumber(now.toISOString());
  const candidates = index.flatMap((entry) => {
    const declared = new Set(entry.objectives.map((objective) => objective.id));
    const attempts = history
      .filter((attempt) => isPracticeOf(attempt, entry, declared))
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
    if (attempts.length === 0) return [];
    const latest = new Map<string, PracticeOutcome>();
    for (const attempt of attempts) {
      for (const { objectiveId, outcome } of attempt.objectives) {
        if (declared.has(objectiveId)) latest.set(objectiveId, outcome);
      }
    }
    const days = new Set(attempts.map((attempt) => dayNumber(attempt.completedAt)));
    const lastDay = Math.max(...days);
    const intervalDays = returnIntervalDays(days.size);
    const daysSince = today - lastDay;
    if (daysSince < intervalDays) return [];
    const weakest = Math.min(...[...latest.values()].map((outcome) => OUTCOME_RANK[outcome]));
    const weakOutcome = (Object.keys(OUTCOME_RANK) as PracticeOutcome[])
      .find((outcome) => OUTCOME_RANK[outcome] === weakest)!;
    const statements = new Map(entry.objectives.map((objective) => [objective.id, objective.statement]));
    const practises = [...latest].filter(([, outcome]) => OUTCOME_RANK[outcome] === weakest)
      .map(([id]) => statements.get(id)).filter((statement): statement is string => statement !== undefined);
    return [{ entry, practises, daysSince, intervalDays, weakest, lastDay, weakOutcome }];
  });
  candidates.sort((a, b) => a.weakest - b.weakest || a.lastDay - b.lastDay);
  const chosen = candidates[0];
  if (chosen === undefined) return null;
  return {
    moduleId: chosen.entry.moduleId,
    scenarioId: chosen.entry.scenarioId,
    title: chosen.entry.title,
    estimatedMinutes: chosen.entry.estimatedMinutes,
    practises: chosen.practises,
    daysSince: chosen.daysSince,
    intervalDays: chosen.intervalDays,
    reason: t('spaced.reason', { days: chosen.daysSince, interval: chosen.intervalDays,
      outcome: t(`outcome.${chosen.weakOutcome}` as MessageKey) }),
  };
}

const DISMISSAL_KEY = 'opensimlab.spaced-return-dismissed-until';
export const SPACED_RETURN_DISMISSAL_DAYS = 7;

export function spacedReturnDismissed(now: number, storage?: Storage): boolean {
  try {
    const until = Number((storage ?? localStorage).getItem(DISMISSAL_KEY));
    return Number.isFinite(until) && until > now;
  } catch {
    return false;
  }
}

export function dismissSpacedReturn(now: number, storage?: Storage): number {
  const until = now + SPACED_RETURN_DISMISSAL_DAYS * DAY_MS;
  try { (storage ?? localStorage).setItem(DISMISSAL_KEY, String(until)); } catch { /* Storage may be blocked. */ }
  return until;
}

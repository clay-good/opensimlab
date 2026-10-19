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
 */
import type { Scenario } from '../scenarios/types';
import type { PracticeAttempt, PracticeOutcome } from './practice-history';

export const SPACED_RETURN_CONVENTION =
  'Return intervals of 7, 14, 28, then 56 days are an educational convention, not a measure of '
  + 'what you remember.';

const OUTCOME_RANK: Readonly<Record<PracticeOutcome, number>> = {
  'not-met': 0, 'partly-met': 1, 'not-exercised': 2, met: 3,
};

const OUTCOME_WORDS: Readonly<Record<PracticeOutcome, string>> = {
  'not-met': 'not met', 'partly-met': 'partly met', 'not-exercised': 'not exercised', met: 'met',
};

const DAY_MS = 24 * 60 * 60 * 1000;
const dayNumber = (iso: string) => Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00.000Z`) / DAY_MS);

/** 7 days after one day of practice, doubling per further separate day, capped at 56. */
export function returnIntervalDays(separateDays: number): number {
  if (separateDays < 1) return 0;
  return Math.min(7 * 2 ** (separateDays - 1), 56);
}

export interface SpacedReturnSuggestion {
  readonly scenario: Scenario;
  /** The objectives with the weakest latest evidence, in the scenario's own words. */
  readonly practises: readonly string[];
  readonly daysSince: number;
  readonly intervalDays: number;
  readonly reason: string;
}

export function spacedReturnSuggestion(
  history: readonly PracticeAttempt[],
  scenarios: readonly Scenario[],
  now: Date,
): SpacedReturnSuggestion | null {
  const today = dayNumber(now.toISOString());
  const candidates = scenarios.flatMap((scenario) => {
    const attempts = history
      .filter((attempt) => attempt.scenarioId === scenario.metadata.id)
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
    if (attempts.length === 0) return [];
    const latest = new Map<string, PracticeOutcome>();
    for (const attempt of attempts) {
      for (const { objectiveId, outcome } of attempt.objectives) latest.set(objectiveId, outcome);
    }
    const days = new Set(attempts.map((attempt) => dayNumber(attempt.completedAt)));
    const lastDay = Math.max(...days);
    const intervalDays = returnIntervalDays(days.size);
    const daysSince = today - lastDay;
    if (daysSince < intervalDays) return [];
    const weakest = Math.min(...[...latest.values()].map((outcome) => OUTCOME_RANK[outcome]));
    const weakOutcome = (Object.keys(OUTCOME_RANK) as PracticeOutcome[])
      .find((outcome) => OUTCOME_RANK[outcome] === weakest)!;
    const statements = new Map(scenario.metadata.objectives.map((objective) => [objective.id, objective.statement]));
    const practises = [...latest].filter(([, outcome]) => OUTCOME_RANK[outcome] === weakest)
      .map(([id]) => statements.get(id)).filter((statement): statement is string => statement !== undefined);
    return [{ scenario, practises, daysSince, intervalDays, weakest, lastDay, weakOutcome }];
  });
  candidates.sort((a, b) => a.weakest - b.weakest || a.lastDay - b.lastDay);
  const chosen = candidates[0];
  if (chosen === undefined) return null;
  return {
    scenario: chosen.scenario,
    practises: chosen.practises,
    daysSince: chosen.daysSince,
    intervalDays: chosen.intervalDays,
    reason: `Last practised ${chosen.daysSince} ${chosen.daysSince === 1 ? 'day' : 'days'} ago, `
      + `past its ${chosen.intervalDays}-day return interval. Your weakest latest result in it was `
      + `${OUTCOME_WORDS[chosen.weakOutcome]}.`,
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

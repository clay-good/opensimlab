/**
 * The ratified count is a floor, not a ceiling (learning/catalog-growth).
 *
 * The catalog was ratified at 256 scenarios. Growing past that needs no
 * permission from this file: the playable count is whatever passes every gate,
 * with no upper bound. Shrinking below it does need one. A scenario may leave the
 * catalog only by a withdrawal recorded in the public corrections log, so the
 * count can never fall quietly.
 */
import type { CorrectionEntry } from '@platform/docs/corrections';

/** Recorded history: the count the multidomain catalog was ratified at, on 2026-09-25. */
export const RATIFIED_SCENARIO_COUNT = 256;

/**
 * A scenario is named by module and id together: two modules may hold different
 * lessons with the same id (status epilepticus is in both emergency medicine and
 * critical care), so an id alone would count them as one.
 */
export const scenarioKey = (moduleId: string, scenarioId: string) => `${moduleId}:${scenarioId}`;

/** Module-qualified scenario keys the corrections log records as withdrawn. */
export function recordedWithdrawals(corrections: readonly CorrectionEntry[]): readonly string[] {
  return corrections.flatMap((entry) => entry.withdrawal
    ? [scenarioKey(entry.withdrawal.moduleId, entry.withdrawal.scenarioId)] : []);
}

/** Why the catalog may not publish at this count, or nothing. */
export function catalogFloorBlockers(
  /** Module-qualified keys, from `scenarioKey`. */
  playableScenarioIds: readonly string[],
  corrections: readonly CorrectionEntry[],
  ratified = RATIFIED_SCENARIO_COUNT,
): string[] {
  const playable = new Set(playableScenarioIds);
  const withdrawn = [...new Set(recordedWithdrawals(corrections))];
  const blockers: string[] = [];
  for (const id of withdrawn) {
    if (playable.has(id)) blockers.push(`${id} is recorded as withdrawn in the corrections log but is still playable`);
  }
  const accounted = playable.size + withdrawn.filter((id) => !playable.has(id)).length;
  if (accounted < ratified) {
    blockers.push(`${playable.size} playable scenarios is ${ratified - accounted} below the ratified `
      + `${ratified} with no withdrawal recorded in the corrections log for the difference`);
  }
  return blockers;
}

/**
 * Pause points (facilitator-toolkit → pause points).
 *
 * A pause point fires at most once, the first time its tick is reached or its
 * one-comparison predicate holds, and only while classroom mode is on. It
 * pauses the clock and asks the room a question; it never changes the patient,
 * so a session paused at every point and one paused at none run the same.
 */
import type { ScenarioPausePoint } from '@anesthesia/scenarios/types';
import { evaluatePredicate, parsePredicate } from '@anesthesia/scenarios/predicate';

/** The first unfired pause point that is due now, or null. */
export function duePausePoint(
  points: readonly ScenarioPausePoint[] | undefined,
  tick: number,
  state: Readonly<Record<string, number>>,
  fired: ReadonlySet<string>,
): ScenarioPausePoint | null {
  for (const point of points ?? []) {
    if (fired.has(point.id)) continue;
    if (point.atTick !== undefined ? tick >= point.atTick
      : point.when !== undefined && evaluatePredicate(parsePredicate(point.when), state)) return point;
  }
  return null;
}

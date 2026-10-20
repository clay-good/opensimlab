/**
 * Rapid-cycle rehearsal (deliberate-practice-loop → rapid-cycle rehearsal).
 *
 * A cycle restores the exact state at a declared decision point through the
 * existing rehearsal branch, runs at ordinary speed with ordinary controls,
 * and ends one of two ways: the expected action lands inside the window, or
 * the window closes and the authored directive is shown. It is offered only
 * from the debrief, never starts itself, and is unavailable in Unassisted mode,
 * because a directive line is a direct intervention.
 */
import type { ScenarioRapidCycle } from '../scenarios/types';
import { EN_MESSAGES } from '@platform/i18n/messages';

/** The one sentence of evidence the rehearsal carries, and no more than the review claims. */
export const RAPID_CYCLE_EVIDENCE = EN_MESSAGES['rapid-cycle.evidence'].text;

export type RapidCycleStatus = 'waiting' | 'landed' | 'missed';

/** Whether the expected action has landed inside the window, is still possible, or was missed. */
export function rapidCycleStatus(
  point: ScenarioRapidCycle,
  actions: readonly { readonly tick: number; readonly type: string }[],
  tick: number,
): RapidCycleStatus {
  const closes = point.atTick + point.windowTicks;
  if (actions.some((action) => action.type === point.actionType
    && action.tick >= point.atTick && action.tick <= closes)) return 'landed';
  return tick > closes ? 'missed' : 'waiting';
}

/** Rapid cycle is never offered without guidance, and only for an objective not yet met. */
export function offeredRapidCycle(
  points: readonly ScenarioRapidCycle[] | undefined,
  unmetObjectives: ReadonlySet<string>,
  guidance: 'guided' | 'coached' | 'unassisted',
): ScenarioRapidCycle | undefined {
  if (guidance === 'unassisted') return undefined;
  return points?.find((point) => unmetObjectives.has(point.objectiveId));
}

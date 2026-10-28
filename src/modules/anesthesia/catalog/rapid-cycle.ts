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
import type { Scenario, ScenarioRapidCycle } from '../scenarios/types';
import type { MaturitySubjectInput } from '@platform/catalog/maturity';
import { SESSION_MESSAGES } from '@platform/i18n/messages-session';

/** The one sentence of evidence the rehearsal carries, and no more than the review claims. */
export const RAPID_CYCLE_EVIDENCE = SESSION_MESSAGES['rapid-cycle.evidence'].text;

export type RapidCycleStatus = 'waiting' | 'landed' | 'missed';

/** An action that is the declared step: its type, and every payload field declared with it. */
function isTheStep(
  point: ScenarioRapidCycle,
  action: { readonly type: string; readonly payload?: Readonly<Record<string, unknown>> },
): boolean {
  if (action.type !== point.actionType) return false;
  return Object.entries(point.actionPayload ?? {})
    .every(([field, value]) => action.payload?.[field] === value);
}

/** Whether the expected action has landed inside the window, is still possible, or was missed. */
export function rapidCycleStatus(
  point: ScenarioRapidCycle,
  actions: readonly {
    readonly tick: number; readonly type: string;
    readonly payload?: Readonly<Record<string, unknown>>;
  }[],
  tick: number,
): RapidCycleStatus {
  const closes = point.atTick + point.windowTicks;
  if (actions.some((action) => isTheStep(point, action)
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

/**
 * Each authored directive line, as a `tutor-rule` maturity subject.
 *
 * A directive tells a learner what to do, which makes it a tutor rule and not
 * scenario prose: it needs its own exact-version maturity record, so a reader
 * can see that the line carries the lesson's status and no more. The subject id
 * joins the lesson to the point, because a point id is unique only inside its
 * own lesson — three lessons declare `compressions-within-twenty-seconds`.
 *
 * The evidence is the lesson's published audit and the point's own locator,
 * both inert text. No source file path: a rename would then fail a record that
 * nothing about the content had changed.
 */
export function rapidCycleMaturitySubjects(
  scenarios: readonly Scenario[],
  moduleId: string,
): MaturitySubjectInput[] {
  return scenarios.flatMap((scenario) => (scenario.rapidCycle ?? []).map((point): MaturitySubjectInput => ({
    subjectKind: 'tutor-rule',
    subjectId: `${scenario.metadata.id}-${point.id}`,
    contentVersion: scenario.metadata.version,
    status: scenario.metadata.maturity,
    evidence: [
      `/catalog/${moduleId}-completion-audit.json#${scenario.metadata.id}@${scenario.metadata.version}`,
      point.sourceLocator,
    ],
  })));
}

import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { PERIOPERATIVE_DIABETES_ACTIONS, type PerioperativeDiabetesAction } from './perioperative-diabetes';

const outcomes: Record<PerioperativeDiabetesAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'restore-insulin': { accepted: ['insulin-restored'], refused: [] },
  'call-support': { accepted: ['support'], refused: [] },
  'review-context': { accepted: ['context-review'], refused: [] },
  'plan-fasting': { accepted: ['fasting-plan'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-glucose': { accepted: ['glucose-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'deterioration-reassessment', 'early-response-reassessment', 'response-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'omit-insulin': { accepted: [], refused: ['insulin-omission-refused'] },
  'cgm-only': { accepted: [], refused: ['cgm-only-refused'] },
  'clear-surgery': { accepted: [], refused: ['clearance-refused'] },
};

function choice(action: LearnerAction): PerioperativeDiabetesAction | undefined {
  if (action.type !== 'perioperative-diabetes-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return PERIOPERATIVE_DIABETES_ACTIONS.find((value) => value === descriptor.value);
}

/** Shared refusals, missing outcomes, and duplicate evidence are not attributable results. */
export function perioperativeDiabetesReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
  const counts = new Map<string, number>();
  for (const action of actions) {
    const selected = choice(action);
    if (selected === undefined) continue;
    const key = `${action.tick}:${selected}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return actions.slice(-REPORT_CONTEXT_ACTION_LIMIT).flatMap((action) => {
    const selected = choice(action);
    if (selected === undefined || counts.get(`${action.tick}:${selected}`) !== 1) return [];
    const expected = outcomes[selected];
    const id = (event: string) => `perioperative-diabetes-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

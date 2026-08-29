import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { LOST_CONTINGENCY_ACTIONS, type LostContingencyAction } from './lost-contingency';

const outcomes: Record<LostContingencyAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-what-was-said': { accepted: ['spoken-recorded'], refused: [] },
  'check-the-notes': { accepted: ['notes-check'], refused: [] },
  'record-the-gap-as-a-transmission-gap': { accepted: ['gap-recorded'], refused: ['gap-refused'] },
  'reconstruct-the-contingency': { accepted: ['reconstructed'], refused: ['reconstruct-refused'] },
  'record-what-the-gap-changes': { accepted: ['consequences-recorded'], refused: ['consequences-refused'] },
  'confirm-the-plan-with-the-team': { accepted: ['confirmation-requested'], refused: ['confirmation-refused'] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'confirmed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'nothing-said-means-nothing-applies': { accepted: [], refused: ['nothing-applies-refused'] },
  'ask-the-day-nurse-to-remember': { accepted: [], refused: ['memory-refused'] },
  'a-quiet-handover-means-a-stable-patient': { accepted: [], refused: ['quiet-refused'] },
  'write-a-plan-of-my-own': { accepted: [], refused: ['own-plan-refused'] },
};

function choice(action: LearnerAction): LostContingencyAction | undefined {
  if (action.type !== 'lost-contingency-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return LOST_CONTINGENCY_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function lostContingencyReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `lost-contingency-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

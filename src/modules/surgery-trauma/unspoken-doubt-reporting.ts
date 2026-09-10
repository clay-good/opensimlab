import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { UNSPOKEN_DOUBT_ACTIONS, type UnspokenDoubtAction } from './unspoken-doubt';

const outcomes: Record<UnspokenDoubtAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'state-what-you-have-noticed': { accepted: ['observation-recorded'], refused: [] },
  'state-what-would-make-you-wrong': { accepted: ['fallibility-recorded'], refused: [] },
  'state-the-cost-of-each-mistake': { accepted: ['asymmetry-recorded'], refused: [] },
  'say-it-before-the-incision': { accepted: ['spoken'], refused: [] },
  'record-bounded-team-intent': { accepted: ['team-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-checklist-record': { accepted: ['checklist-record-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'wait-until-someone-more-senior-notices': { accepted: [], refused: ['wait-for-senior-refused'] },
  'you-are-probably-misreading-it': { accepted: [], refused: ['self-doubt-refused'] },
  'mention-it-afterwards': { accepted: [], refused: ['afterwards-refused'] },
  'ask-a-colleague-quietly-first': { accepted: [], refused: ['quiet-ask-refused'] },
};

function choice(action: LearnerAction): UnspokenDoubtAction | undefined {
  if (action.type !== 'unspoken-doubt-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return UNSPOKEN_DOUBT_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function unspokenDoubtReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `unspoken-doubt-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

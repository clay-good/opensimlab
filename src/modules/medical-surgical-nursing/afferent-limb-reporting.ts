import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { AFFERENT_LIMB_ACTIONS, type AfferentLimbAction } from './afferent-limb';

const outcomes: Record<AfferentLimbAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-met-criteria': { accepted: ['criteria-recorded'], refused: [] },
  'record-the-obstacles': { accepted: ['obstacles-recorded'], refused: [] },
  'call-the-response-team': { accepted: ['team-called'], refused: [] },
  'state-the-concern-explicitly': { accepted: ['concern-stated'], refused: ['statement-refused'] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-criteria': { accepted: ['criteria-check'], refused: [] },
  'check-availability': { accepted: ['availability-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'attended-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'call-the-doctor-first': { accepted: [], refused: ['doctor-first-refused'] },
  'wait-for-the-ward-round': { accepted: [], refused: ['round-refused'] },
  'document-and-wait': { accepted: [], refused: ['documentation-refused'] },
  'ask-permission-to-call': { accepted: [], refused: ['permission-refused'] },
};

function choice(action: LearnerAction): AfferentLimbAction | undefined {
  if (action.type !== 'afferent-limb-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return AFFERENT_LIMB_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function afferentLimbReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `afferent-limb-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

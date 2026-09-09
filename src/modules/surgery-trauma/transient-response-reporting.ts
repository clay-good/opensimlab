import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { TRANSIENT_RESPONSE_ACTIONS, type TransientResponseAction } from './transient-response';

const outcomes: Record<TransientResponseAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-mechanism-and-the-clock': { accepted: ['mechanism-recorded'], refused: [] },
  'record-the-shape-of-the-response': { accepted: ['response-recorded'], refused: [] },
  'record-what-a-picture-cannot-do': { accepted: ['imaging-limits-recorded'], refused: [] },
  'escalate-to-the-theatre-team': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-operative-intent': { accepted: ['operative-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-response-record': { accepted: ['response-record-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'he-came-back-up-so-he-is-stable': { accepted: [], refused: ['stability-claim-refused'] },
  'send-him-for-a-scan-before-calling': { accepted: [], refused: ['scan-first-refused'] },
  'give-another-litre-and-see': { accepted: [], refused: ['another-litre-refused'] },
  'wait-for-the-cross-matched-blood-before-calling': { accepted: [], refused: ['wait-for-blood-refused'] },
};

function choice(action: LearnerAction): TransientResponseAction | undefined {
  if (action.type !== 'transient-response-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return TRANSIENT_RESPONSE_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function transientResponseReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `transient-response-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

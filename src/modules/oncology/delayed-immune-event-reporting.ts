import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { DELAYED_IMMUNE_EVENT_ACTIONS, type DelayedImmuneEventAction } from './delayed-immune-event';

const outcomes: Record<DelayedImmuneEventAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-completed-exposure': { accepted: ['exposure-recorded'], refused: [] },
  'record-the-symptom-course': { accepted: ['course-recorded'], refused: [] },
  'record-infection-evaluation-in-parallel': { accepted: ['infection-evaluation-recorded'], refused: [] },
  'escalate-to-the-treating-service': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-treatment-intent': { accepted: ['treatment-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-exposure-history': { accepted: ['exposure-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'stopped-months-ago-so-not-the-drug': { accepted: [], refused: ['attribution-refused'] },
  'slow-the-gut-and-review-tomorrow': { accepted: [], refused: ['motility-refused'] },
  'wait-for-stool-results-before-escalating': { accepted: [], refused: ['wait-refused'] },
  'discharge-with-oral-rehydration': { accepted: [], refused: ['discharge-refused'] },
};

function choice(action: LearnerAction): DelayedImmuneEventAction | undefined {
  if (action.type !== 'delayed-immune-event-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return DELAYED_IMMUNE_EVENT_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function delayedImmuneEventReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `delayed-immune-event-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

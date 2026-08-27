import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { RENAL_HYPOCALCEMIA_ACTIONS, type RenalHypocalcemiaAction } from './hypocalcemia';

const outcomes: Record<RenalHypocalcemiaAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'rescue-calcium': { accepted: ['calcium-rescue'], refused: [] },
  'continue-calcium': { accepted: ['calcium-continuation'], refused: ['continuing-review-refused'] },
  'call-support': { accepted: ['support'], refused: [] },
  'review-context': { accepted: ['context-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'coordinate-mineral-care': { accepted: ['mineral-care'], refused: [] },
  'arrange-follow-up': { accepted: ['follow-up'], refused: [] },
  'check-ionized': { accepted: ['ionized-check'], refused: [] },
  'check-symptoms': { accepted: ['symptom-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'rescue-reassessment', 'continuing-reassessment', 'recurrence-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'trust-adjusted-total': { accepted: [], refused: ['adjusted-reassurance-refused'] },
  'oral-only': { accepted: [], refused: ['oral-only-refused'] },
  'stop-after-relief': { accepted: [], refused: ['relief-stop-refused'] },
};

function choice(action: LearnerAction): RenalHypocalcemiaAction | undefined {
  if (action.type !== 'renal-hypocalcemia-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return RENAL_HYPOCALCEMIA_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function renalHypocalcemiaReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `renal-hypocalcemia-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

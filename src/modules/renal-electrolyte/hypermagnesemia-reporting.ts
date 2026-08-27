import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { RENAL_HYPERMAGNESEMIA_ACTIONS, type RenalHypermagnesemiaAction } from './hypermagnesemia';

const outcomes: Record<RenalHypermagnesemiaAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'stop-magnesium': { accepted: ['magnesium-stopped'], refused: [] },
  'support-breathing': { accepted: ['breathing-support'], refused: [] },
  calcium: { accepted: ['calcium-antagonism'], refused: [] },
  'call-support': { accepted: ['support'], refused: [] },
  'review-context': { accepted: ['context-review'], refused: [] },
  'deliver-removal': { accepted: ['removal-care'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-magnesium': { accepted: ['magnesium-check'], refused: [] },
  'check-neuromuscular': { accepted: ['neuromuscular-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'calcium-reassessment', 'recurrence-reassessment', 'removal-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'calcium-means-clearance': { accepted: [], refused: ['calcium-clearance-refused'] },
  'routine-diuresis': { accepted: [], refused: ['routine-diuresis-refused'] },
};

function choice(action: LearnerAction): RenalHypermagnesemiaAction | undefined {
  if (action.type !== 'renal-hypermagnesemia-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return RENAL_HYPERMAGNESEMIA_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function renalHypermagnesemiaReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `renal-hypermagnesemia-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

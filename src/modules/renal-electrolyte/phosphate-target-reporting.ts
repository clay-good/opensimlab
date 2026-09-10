import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { RENAL_PHOSPHATE_ACTIONS, type RenalPhosphateAction } from './phosphate-target';

const outcomes: Record<RenalPhosphateAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'review-surrogate': { accepted: ['surrogate-review'], refused: [] },
  'review-trial': { accepted: ['trial-review'], refused: [] },
  'review-intake': { accepted: ['intake-review'], refused: [] },
  'own-decision': { accepted: ['decision-owned'], refused: [] },
  'call-support': { accepted: ['support'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-phosphate': { accepted: ['phosphate-check'], refused: [] },
  'check-nutrition': { accepted: ['nutrition-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'unexamined-reassessment', 'records-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'treat-the-number': { accepted: [], refused: ['treat-the-number-refused'] },
  'restrict-further': { accepted: [], refused: ['restrict-further-refused'] },
};

function choice(action: LearnerAction): RenalPhosphateAction | undefined {
  if (action.type !== 'renal-phosphate-target-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return RENAL_PHOSPHATE_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function renalPhosphateTargetReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `renal-phosphate-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

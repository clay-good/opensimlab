import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { RENAL_ESTIMATE_ACTIONS, type RenalEstimateAction } from './estimated-filtration';

const outcomes: Record<RenalEstimateAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'review-precision': { accepted: ['precision-review'], refused: [] },
  'review-generation': { accepted: ['generation-review'], refused: [] },
  'request-second-marker': { accepted: ['second-marker-requested'], refused: [] },
  'review-discordance': { accepted: ['discordance-review'], refused: ['discordance-early'] },
  'own-medicine-decision': { accepted: ['medicine-owned'], refused: [] },
  'call-support': { accepted: ['support'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-creatinine': { accepted: ['creatinine-check'], refused: [] },
  'check-second-marker': { accepted: ['second-marker-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'unreviewed-reassessment', 'discordant-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'dose-on-estimate': { accepted: [], refused: ['dose-refused'] },
  'take-the-convenient-number': { accepted: [], refused: ['convenient-number-refused'] },
};

function choice(action: LearnerAction): RenalEstimateAction | undefined {
  if (action.type !== 'renal-estimated-filtration-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return RENAL_ESTIMATE_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function renalEstimatedFiltrationReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `renal-estimate-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { QUIET_CHEST_ACTIONS, type QuietChestAction } from './quiet-chest';

const outcomes: Record<QuietChestAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-fall-and-what-was-broken': { accepted: ['injury-recorded'], refused: [] },
  'record-what-comfortable-at-rest-measures': { accepted: ['comfort-limits-recorded'], refused: [] },
  'record-what-the-count-predicts': { accepted: ['count-recorded'], refused: [] },
  'escalate-to-the-admitting-team': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-admission-intent': { accepted: ['admission-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-chest-record': { accepted: ['chest-record-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'her-numbers-are-normal-so-she-can-go-home': { accepted: [], refused: ['normal-numbers-refused'] },
  'there-is-no-pneumothorax-on-the-film': { accepted: [], refused: ['film-claim-refused'] },
  'she-says-the-pain-is-manageable': { accepted: [], refused: ['pain-report-refused'] },
  'send-her-home-with-tablets-and-review-in-a-week': { accepted: [], refused: ['discharge-refused'] },
};

function choice(action: LearnerAction): QuietChestAction | undefined {
  if (action.type !== 'quiet-chest-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return QUIET_CHEST_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function quietChestReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `quiet-chest-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { UNOWNED_DELAY_ACTIONS, type UnownedDelayAction } from './unowned-delay';

const outcomes: Record<UnownedDelayAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-fracture-and-the-clock': { accepted: ['fracture-recorded'], refused: [] },
  'record-what-each-delay-was-for': { accepted: ['delay-reasons-recorded'], refused: [] },
  'record-what-is-still-being-waited-for': { accepted: ['pending-recorded'], refused: [] },
  'escalate-to-the-team-that-owns-the-list': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-scheduling-intent': { accepted: ['scheduling-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-delay-record': { accepted: ['delay-record-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'she-is-not-fit-until-the-echo-is-done': { accepted: [], refused: ['echo-gate-refused'] },
  'the-list-is-full-so-it-is-out-of-our-hands': { accepted: [], refused: ['list-full-refused'] },
  'one-more-night-will-not-make-a-difference': { accepted: [], refused: ['one-more-night-refused'] },
  'keep-her-fasted-in-case-a-slot-appears': { accepted: [], refused: ['keep-fasted-refused'] },
};

function choice(action: LearnerAction): UnownedDelayAction | undefined {
  if (action.type !== 'unowned-delay-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return UNOWNED_DELAY_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function unownedDelayReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `unowned-delay-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

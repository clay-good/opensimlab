import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { THIRD_ATTENDANCE_ACTIONS, type ThirdAttendanceAction } from './third-attendance';

const outcomes: Record<ThirdAttendanceAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-attendances-and-what-each-found': { accepted: ['attendances-recorded'], refused: [] },
  'record-what-a-previous-assessment-can-say': { accepted: ['prior-limits-recorded'], refused: [] },
  'record-what-has-changed-since-the-last-visit': { accepted: ['change-recorded'], refused: [] },
  'escalate-to-the-surgical-team': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-assessment-intent': { accepted: ['assessment-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-attendance-record': { accepted: ['attendance-record-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'she-has-been-seen-twice-already': { accepted: [], refused: ['seen-twice-refused'] },
  'the-notes-say-it-was-settling': { accepted: [], refused: ['settling-claim-refused'] },
  'she-is-anxious-and-keeps-coming-back': { accepted: [], refused: ['anxious-claim-refused'] },
  'discharge-her-with-the-same-advice-again': { accepted: [], refused: ['same-advice-refused'] },
};

function choice(action: LearnerAction): ThirdAttendanceAction | undefined {
  if (action.type !== 'third-attendance-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return THIRD_ATTENDANCE_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function thirdAttendanceReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `third-attendance-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

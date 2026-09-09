import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { NEGATIVE_SCAN_ACTIONS, type NegativeScanAction } from './negative-scan';

const outcomes: Record<NegativeScanAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-operative-course': { accepted: ['operative-course-recorded'], refused: [] },
  'record-the-failure-to-progress': { accepted: ['progress-recorded'], refused: [] },
  'record-what-the-scan-excludes': { accepted: ['scan-limits-recorded'], refused: [] },
  'escalate-to-the-operating-team': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-surgical-intent': { accepted: ['surgical-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-operative-record': { accepted: ['operative-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'the-scan-was-negative-so-it-is-not-a-leak': { accepted: [], refused: ['scan-exclusion-refused'] },
  'abnormal-vitals-are-routine-after-bowel-surgery': { accepted: [], refused: ['routine-dismissal-refused'] },
  'repeat-the-scan-tomorrow-and-review-then': { accepted: [], refused: ['rescan-deferral-refused'] },
  'treat-the-numbers-and-watch-overnight': { accepted: [], refused: ['treat-the-numbers-refused'] },
};

function choice(action: LearnerAction): NegativeScanAction | undefined {
  if (action.type !== 'negative-scan-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return NEGATIVE_SCAN_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function negativeScanReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `negative-scan-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { COUNTED_RATE_ACTIONS, type CountedRateAction } from './counted-rate';

const outcomes: Record<CountedRateAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'review-the-charted-trend': { accepted: ['trend-reviewed'], refused: [] },
  'count-for-a-full-minute': { accepted: ['counted'], refused: [] },
  'record-the-discrepancy': { accepted: ['discrepancy-recorded'], refused: ['discrepancy-refused'] },
  'escalate-on-the-counted-value': { accepted: ['escalation-requested'], refused: ['escalation-refused'] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-chart': { accepted: ['chart-check'], refused: [] },
  'check-patient': { accepted: ['patient-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'trust-the-flat-trend': { accepted: [], refused: ['trend-refused'] },
  'chart-the-monitor-value': { accepted: [], refused: ['monitor-refused'] },
  'round-to-the-previous-entry': { accepted: [], refused: ['rounding-refused'] },
  'correct-the-earlier-entries': { accepted: [], refused: ['retrospective-edit-refused'] },
};

function choice(action: LearnerAction): CountedRateAction | undefined {
  if (action.type !== 'counted-rate-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return COUNTED_RATE_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function countedRateReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `counted-rate-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

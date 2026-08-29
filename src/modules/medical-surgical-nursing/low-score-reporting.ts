import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { LOW_SCORE_ACTIONS, type LowScoreAction } from './low-score';

const outcomes: Record<LowScoreAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-observations-and-score': { accepted: ['observations-recorded'], refused: [] },
  'record-what-the-score-excludes': { accepted: ['exclusions-recorded'], refused: [] },
  'record-the-family-report': { accepted: ['family-report-recorded'], refused: [] },
  'escalate-on-concern': { accepted: ['escalation-requested'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-context': { accepted: ['context-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'score-is-low-so-recheck-later': { accepted: [], refused: ['recheck-refused'] },
  'no-fever-so-not-infection': { accepted: [], refused: ['fever-refused'] },
  'use-qsofa-instead': { accepted: [], refused: ['qsofa-refused'] },
  'document-and-move-on': { accepted: [], refused: ['documentation-refused'] },
};

function choice(action: LearnerAction): LowScoreAction | undefined {
  if (action.type !== 'low-score-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return LOW_SCORE_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function lowScoreReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `low-score-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

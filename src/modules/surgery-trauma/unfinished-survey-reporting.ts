import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { UNFINISHED_SURVEY_ACTIONS, type UnfinishedSurveyAction } from './unfinished-survey';

const outcomes: Record<UnfinishedSurveyAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-why-he-could-not-be-examined': { accepted: ['examination-limits-recorded'], refused: [] },
  'record-what-the-injury-list-rests-on': { accepted: ['injury-list-recorded'], refused: [] },
  'record-that-the-third-survey-is-not-done': { accepted: ['survey-incomplete-recorded'], refused: [] },
  'escalate-to-the-trauma-team': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-survey-intent': { accepted: ['survey-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-injury-record': { accepted: ['injury-record-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'the-secondary-survey-is-documented-complete': { accepted: [], refused: ['documentation-claim-refused'] },
  'the-pan-scan-would-have-shown-it': { accepted: [], refused: ['imaging-claim-refused'] },
  'he-has-not-complained-of-anything': { accepted: [], refused: ['no-complaint-refused'] },
  'clear-him-now-and-review-if-something-appears': { accepted: [], refused: ['clear-now-refused'] },
};

function choice(action: LearnerAction): UnfinishedSurveyAction | undefined {
  if (action.type !== 'unfinished-survey-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return UNFINISHED_SURVEY_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function unfinishedSurveyReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `unfinished-survey-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

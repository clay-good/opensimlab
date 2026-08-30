import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { EASY_LABEL_ACTIONS, type EasyLabelAction } from './easy-label';

const outcomes: Record<EasyLabelAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-that-the-label-is-a-diagnosis-of-exclusion': { accepted: ['exclusion-recorded'], refused: [] },
  'record-what-has-not-been-excluded': { accepted: ['outstanding-recorded'], refused: [] },
  'escalate-so-both-can-start-together': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-treatment-intent': { accepted: ['intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-the-supplied-results': { accepted: ['results-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'start-immunosuppression-now-it-is-obviously-colitis': { accepted: [], refused: ['immunosuppression-refused'] },
  'wait-for-every-result-before-telling-anyone': { accepted: [], refused: ['wait-refused'] },
  'no-fever-so-it-cannot-be-infection': { accepted: [], refused: ['no-fever-refused'] },
  'four-cycles-in-so-it-is-the-drug': { accepted: [], refused: ['four-cycles-refused'] },
};

function choice(action: LearnerAction): EasyLabelAction | undefined {
  if (action.type !== 'easy-label-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return EASY_LABEL_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function easyLabelReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `easy-label-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

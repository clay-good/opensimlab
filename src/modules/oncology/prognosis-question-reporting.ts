import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { PROGNOSIS_QUESTION_ACTIONS, type PrognosisQuestionAction } from './prognosis-question';

const outcomes: Record<PrognosisQuestionAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'ask-what-he-wants-to-know': { accepted: ['intent-asked'], refused: [] },
  'record-the-question-as-asked': { accepted: ['question-recorded'], refused: [] },
  'check-what-he-believes-the-treatment-is-for': { accepted: ['belief-checked'], refused: [] },
  'answer-with-scenarios-not-a-number': { accepted: ['answered'], refused: ['answer-refused'] },
  'state-the-direction-of-the-error': { accepted: ['direction-stated'], refused: ['direction-refused'] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-what-was-said': { accepted: ['conversation-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'give-a-single-number': { accepted: [], refused: ['single-number-refused'] },
  'say-nobody-can-know': { accepted: [], refused: ['nobody-knows-refused'] },
  'reassure-and-move-on': { accepted: [], refused: ['reassurance-refused'] },
  'answer-before-asking-what-he-wants': { accepted: [], refused: ['premature-refused'] },
};

function choice(action: LearnerAction): PrognosisQuestionAction | undefined {
  if (action.type !== 'prognosis-question-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return PROGNOSIS_QUESTION_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function prognosisQuestionReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `prognosis-question-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

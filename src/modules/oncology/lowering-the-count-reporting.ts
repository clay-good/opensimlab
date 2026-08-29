import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { LOWERING_THE_COUNT_ACTIONS, type LoweringTheCountAction } from './lowering-the-count';

const outcomes: Record<LoweringTheCountAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-clinical-picture-not-the-count': { accepted: ['picture-recorded'], refused: [] },
  'record-what-the-count-does-and-does-not-license': { accepted: ['licence-recorded'], refused: [] },
  'escalate-to-haematology-now': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-cytoreduction-intent': { accepted: ['intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-the-supplied-results': { accepted: ['results-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'send-him-for-apheresis-and-stand-down': { accepted: [], refused: ['apheresis-refused'] },
  'the-count-alone-makes-the-diagnosis': { accepted: [], refused: ['count-only-refused'] },
  'wait-for-the-marrow-before-calling': { accepted: [], refused: ['wait-refused'] },
  'treat-the-confusion-as-delirium': { accepted: [], refused: ['delirium-refused'] },
};

function choice(action: LearnerAction): LoweringTheCountAction | undefined {
  if (action.type !== 'lowering-the-count-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return LOWERING_THE_COUNT_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function loweringTheCountReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `lowering-the-count-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

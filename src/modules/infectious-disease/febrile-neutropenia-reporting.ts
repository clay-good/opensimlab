import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { FEBRILE_NEUTROPENIA_ACTIONS, type FebrileNeutropeniaAction } from './febrile-neutropenia';

const outcomes: Record<FebrileNeutropeniaAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'recognize-neutropenic-fever': { accepted: ['neutropenic-fever-recognized'], refused: [] },
  'activate-pathway': { accepted: ['pathway-activated'], refused: [] },
  'request-cultures': { accepted: ['cultures-requested'], refused: [] },
  'record-antimicrobial-intent': { accepted: ['antimicrobial-intent'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-labs': { accepted: ['lab-check'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'untreated-reassessment', 'treated-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'crp-reassures': { accepted: [], refused: ['crp-reassurance-refused'] },
  'score-defers-antimicrobials': { accepted: [], refused: ['score-deferral-refused'] },
  'wait-for-source': { accepted: [], refused: ['source-wait-refused'] },
  'expect-leukocytosis': { accepted: [], refused: ['leukocytosis-refused'] },
};

function choice(action: LearnerAction): FebrileNeutropeniaAction | undefined {
  if (action.type !== 'febrile-neutropenia-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return FEBRILE_NEUTROPENIA_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function febrileNeutropeniaReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `febrile-neutropenia-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

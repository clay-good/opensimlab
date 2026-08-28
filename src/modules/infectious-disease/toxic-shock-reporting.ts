import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { TOXIC_SHOCK_ACTIONS, type ToxicShockAction } from './toxic-shock';

const outcomes: Record<ToxicShockAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'recognize-toxin-pattern': { accepted: ['toxin-pattern-recognized'], refused: [] },
  'activate-critical-care': { accepted: ['critical-care-activated'], refused: [] },
  'request-cultures': { accepted: ['cultures-requested'], refused: [] },
  'record-treatment-intent': { accepted: ['treatment-intent'], refused: [] },
  'record-definition-status': { accepted: ['definition-status-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-labs': { accepted: ['lab-check'], refused: [] },
  'check-perfusion': { accepted: ['perfusion-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'deteriorated-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'declare-confirmed': { accepted: [], refused: ['confirmation-refused'] },
  'criteria-count-excludes': { accepted: [], refused: ['criteria-exclusion-refused'] },
  'pending-cultures-exclude': { accepted: [], refused: ['pending-culture-refused'] },
  'negative-cultures-mean-no-infection': { accepted: [], refused: ['negative-culture-misread-refused'] },
};

function choice(action: LearnerAction): ToxicShockAction | undefined {
  if (action.type !== 'toxic-shock-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return TOXIC_SHOCK_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function toxicShockReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `toxic-shock-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

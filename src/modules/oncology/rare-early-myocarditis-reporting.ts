import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { RARE_EARLY_MYOCARDITIS_ACTIONS, type RareEarlyMyocarditisAction } from './rare-early-myocarditis';

const outcomes: Record<RareEarlyMyocarditisAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-exposure-interval': { accepted: ['interval-recorded'], refused: [] },
  'record-what-is-present-that-is-not-cardiac': { accepted: ['non-cardiac-recorded'], refused: [] },
  'arrange-continuous-rhythm-monitoring': { accepted: ['monitoring-arranged'], refused: [] },
  'escalate-to-both-teams': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-treatment-intent': { accepted: ['intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-the-supplied-results': { accepted: ['results-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'it-is-too-rare-to-be-that': { accepted: [], refused: ['rarity-refused'] },
  'the-troponin-is-raised-in-lots-of-things': { accepted: [], refused: ['troponin-refused'] },
  'repeat-the-troponin-in-a-week': { accepted: [], refused: ['defer-refused'] },
  'treat-it-as-a-coronary-syndrome-and-stop-there': { accepted: [], refused: ['coronary-only-refused'] },
};

function choice(action: LearnerAction): RareEarlyMyocarditisAction | undefined {
  if (action.type !== 'rare-early-myocarditis-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return RARE_EARLY_MYOCARDITIS_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function rareEarlyMyocarditisReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `rare-early-myocarditis-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

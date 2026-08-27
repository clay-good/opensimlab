import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { HYPONATREMIA_CORRECTION_ACTIONS, type HyponatremiaCorrectionAction } from './hyponatremia-correction';

const outcomes: Record<HyponatremiaCorrectionAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'call-support': { accepted: ['support'], refused: [] },
  'review-risk': { accepted: ['risk-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'aquaresis-reassessment', 'overcorrection-reassessment', 'response-reassessment'], refused: [] },
  'control-water-loss': { accepted: ['water-loss-control'], refused: ['control-review-refused'] },
  relower: { accepted: ['relowering'], refused: ['relowering-review-refused'] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'normalize-now': { accepted: [], refused: ['normalization-refused'] },
  'wait-for-symptoms': { accepted: ['symptom-wait-choice'], refused: [] },
};

function choice(action: LearnerAction): HyponatremiaCorrectionAction | undefined {
  if (action.type !== 'hyponatremia-correction-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return HYPONATREMIA_CORRECTION_ACTIONS.find((value) => value === descriptor.value);
}

/** Missing, shared, or duplicate evidence is not an accepted/refused result. */
export function hyponatremiaCorrectionReportActions(
  actions: readonly LearnerAction[], events: readonly EngineEvent[],
): ScenarioReportActionContext[] {
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
    const id = (event: string) => `sodium-correction-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

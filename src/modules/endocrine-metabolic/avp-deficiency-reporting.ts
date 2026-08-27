import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { AVP_DEFICIENCY_ACTIONS, type AvpDeficiencyAction } from './avp-deficiency';

const outcomes: Record<AvpDeficiencyAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'call-support': { accepted: ['support'], refused: [] },
  'review-context': { accepted: ['context-review'], refused: [] },
  'restore-volume': { accepted: ['volume-restoration'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'volume-reassessment', 'response-reassessment'], refused: [] },
  'replace-water': { accepted: ['water-replacement'], refused: ['water-review-refused'] },
  'restore-desmopressin': { accepted: ['desmopressin-restoration'], refused: ['desmopressin-review-refused'] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'normalize-now': { accepted: [], refused: ['normalization-refused'] },
  'withhold-desmopressin': { accepted: ['withholding-choice'], refused: [] },
};

function choice(action: LearnerAction): AvpDeficiencyAction | undefined {
  if (action.type !== 'avp-deficiency-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return AVP_DEFICIENCY_ACTIONS.find((value) => value === descriptor.value);
}

/** Missing, shared, or duplicate evidence is not an accepted/refused result. */
export function avpDeficiencyReportActions(
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
    const id = (event: string) => `avp-deficiency-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

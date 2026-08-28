import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { OBSTRUCTED_KIDNEY_ACTIONS, type ObstructedKidneyAction } from './obstructed-kidney';

const outcomes: Record<ObstructedKidneyAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'recognize-obstruction': { accepted: ['obstruction-recognized'], refused: [] },
  'call-urology': { accepted: ['urology-activated'], refused: [] },
  'request-cultures': { accepted: ['cultures-requested'], refused: [] },
  'record-decompression-intent': { accepted: ['decompression-intent'], refused: [] },
  'defer-stone-treatment': { accepted: ['stone-treatment-deferred'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-labs': { accepted: ['lab-check'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'undrained-reassessment', 'decompressed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'antibiotics-are-enough': { accepted: [], refused: ['antibiotics-only-refused'] },
  'wait-for-crp': { accepted: [], refused: ['marker-delay-refused'] },
  'choose-modality': { accepted: [], refused: ['modality-choice-refused'] },
  'treat-stone-now': { accepted: [], refused: ['early-stone-treatment-refused'] },
};

function choice(action: LearnerAction): ObstructedKidneyAction | undefined {
  if (action.type !== 'obstructed-kidney-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return OBSTRUCTED_KIDNEY_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function obstructedKidneyReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `obstructed-kidney-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

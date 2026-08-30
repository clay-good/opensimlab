import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { INHERITED_URGENCY_ACTIONS, type InheritedUrgencyAction } from './inherited-urgency';

const outcomes: Record<InheritedUrgencyAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-findings-that-would-make-it-an-emergency': { accepted: ['findings-recorded'], refused: [] },
  'record-that-the-tissue-decides-the-treatment': { accepted: ['tissue-recorded'], refused: [] },
  'secure-the-diagnostic-pathway': { accepted: ['pathway-secured'], refused: [] },
  'record-bounded-treatment-intent': { accepted: ['intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-the-supplied-imaging': { accepted: ['imaging-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'start-radiotherapy-tonight-before-the-biopsy': { accepted: [], refused: ['treat-first-refused'] },
  'the-swelling-alone-makes-it-an-emergency': { accepted: [], refused: ['swelling-only-refused'] },
  'send-him-home-to-await-the-biopsy': { accepted: [], refused: ['send-home-refused'] },
  'treat-the-distended-veins-with-a-diuretic': { accepted: [], refused: ['diuretic-refused'] },
};

function choice(action: LearnerAction): InheritedUrgencyAction | undefined {
  if (action.type !== 'inherited-urgency-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return INHERITED_URGENCY_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function inheritedUrgencyReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `inherited-urgency-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

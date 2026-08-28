import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { SEVERE_PNEUMONIA_ACTIONS, type SeverePneumoniaAction } from './severe-pneumonia';

const outcomes: Record<SeverePneumoniaAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'reconcile-supplied-scores': { accepted: ['scores-reconciled'], refused: [] },
  'recognize-instrument-mismatch': { accepted: ['instrument-mismatch-recognized'], refused: [] },
  'call-critical-care': { accepted: ['critical-care-requested'], refused: [] },
  'record-escalation-intent': { accepted: ['escalation-intent'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-labs': { accepted: ['lab-check'], refused: [] },
  'check-respiratory': { accepted: ['respiratory-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'deteriorated-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'mortality-score-decides-the-bed': { accepted: [], refused: ['mortality-score-refused'] },
  'wait-for-deterioration': { accepted: [], refused: ['wait-refused'] },
  'marker-grades-severity': { accepted: [], refused: ['marker-severity-refused'] },
  'saturation-alone-is-adequate': { accepted: [], refused: ['saturation-refused'] },
};

function choice(action: LearnerAction): SeverePneumoniaAction | undefined {
  if (action.type !== 'severe-pneumonia-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return SEVERE_PNEUMONIA_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function severePneumoniaReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `severe-pneumonia-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { SEPTIC_SHOCK_LABEL_ACTIONS, type SepticShockLabelAction } from './septic-shock-label';

const outcomes: Record<SepticShockLabelAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-hypoperfusion': { accepted: ['hypoperfusion-recorded'], refused: [] },
  'activate-critical-care': { accepted: ['critical-care-activated'], refused: [] },
  'record-classification-open': { accepted: ['classification-open'], refused: [] },
  'record-resuscitation-intent': { accepted: ['resuscitation-intent'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-labs': { accepted: ['lab-check'], refused: [] },
  'check-perfusion': { accepted: ['perfusion-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'resuscitated-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'declare-shock-now': { accepted: [], refused: ['early-label-refused'] },
  'lactate-means-hypoxia': { accepted: [], refused: ['hypoxia-refused'] },
  'resuscitate-to-normal-lactate': { accepted: [], refused: ['normalization-refused'] },
  'raise-the-map-target': { accepted: [], refused: ['map-target-refused'] },
};

function choice(action: LearnerAction): SepticShockLabelAction | undefined {
  if (action.type !== 'septic-shock-label-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return SEPTIC_SHOCK_LABEL_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function septicShockLabelReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `septic-shock-label-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

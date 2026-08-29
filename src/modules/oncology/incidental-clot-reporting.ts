import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { INCIDENTAL_CLOT_ACTIONS, type IncidentalClotAction } from './incidental-clot';

const outcomes: Record<IncidentalClotAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-finding-and-how-it-was-found': { accepted: ['finding-recorded'], refused: [] },
  'record-the-certainty-of-the-recommendation': { accepted: ['certainty-recorded'], refused: [] },
  'record-the-benefit-and-the-harm-together': { accepted: ['tradeoff-recorded'], refused: [] },
  'record-this-patients-bleeding-risk': { accepted: ['bleeding-risk-recorded'], refused: [] },
  'escalate-to-the-treating-service': { accepted: ['escalation-requested'], refused: [] },
  'record-the-decision-as-shared': { accepted: ['shared-decision-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-the-report': { accepted: ['report-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'incidental-so-no-action-needed': { accepted: [], refused: ['dismissal-refused'] },
  'a-pe-is-a-pe-so-anticoagulate-now': { accepted: [], refused: ['reflex-refused'] },
  'wait-for-symptoms-before-deciding': { accepted: [], refused: ['wait-refused'] },
  'leave-it-for-the-clinic-letter': { accepted: [], refused: ['defer-refused'] },
};

function choice(action: LearnerAction): IncidentalClotAction | undefined {
  if (action.type !== 'incidental-clot-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return INCIDENTAL_CLOT_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function incidentalClotReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `incidental-clot-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

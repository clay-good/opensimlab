import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { LABORATORY_TLS_ACTIONS, type LaboratoryTlsAction } from './laboratory-tls';

const outcomes: Record<LaboratoryTlsAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-which-definition-is-met': { accepted: ['definition-recorded'], refused: [] },
  'record-what-crossed-and-when': { accepted: ['crossing-recorded'], refused: [] },
  'record-the-crossing-risk': { accepted: ['risk-recorded'], refused: [] },
  'escalate-to-the-treating-team': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-monitoring-and-treatment-intent': { accepted: ['intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-the-bloods': { accepted: ['bloods-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'he-is-well-so-it-is-just-numbers': { accepted: [], refused: ['dismissal-refused'] },
  'call-it-tumour-lysis-and-move-him-to-intensive-care': { accepted: [], refused: ['overcall-refused'] },
  'wait-for-the-next-set-before-telling-anyone': { accepted: [], refused: ['wait-refused'] },
  'treat-the-potassium-and-stand-down': { accepted: [], refused: ['stand-down-refused'] },
};

function choice(action: LearnerAction): LaboratoryTlsAction | undefined {
  if (action.type !== 'laboratory-tls-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return LABORATORY_TLS_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function laboratoryTlsReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `laboratory-tls-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

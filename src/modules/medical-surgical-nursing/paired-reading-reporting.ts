import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { PAIRED_READING_ACTIONS, type PairedReadingAction } from './paired-reading';

const outcomes: Record<PairedReadingAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-oximeter-reading': { accepted: ['oximeter-recorded'], refused: [] },
  'record-the-paired-values': { accepted: ['paired-recorded'], refused: ['pairing-refused'] },
  'record-what-the-gap-is-not': { accepted: ['gap-explained'], refused: ['explanation-refused'] },
  'escalate-on-the-arterial-value': { accepted: ['escalation-requested'], refused: ['escalation-refused'] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-oximeter': { accepted: ['oximeter-check'], refused: [] },
  'check-patient': { accepted: ['patient-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'paired-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'reposition-the-probe': { accepted: [], refused: ['reposition-refused'] },
  'warm-the-hand': { accepted: [], refused: ['warming-refused'] },
  'trust-the-oximeter-trend': { accepted: [], refused: ['trend-refused'] },
  'the-device-standard-was-fixed': { accepted: [], refused: ['standard-refused'] },
};

function choice(action: LearnerAction): PairedReadingAction | undefined {
  if (action.type !== 'paired-reading-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return PAIRED_READING_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function pairedReadingReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `paired-reading-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

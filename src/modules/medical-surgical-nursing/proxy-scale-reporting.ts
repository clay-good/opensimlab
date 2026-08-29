import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { PROXY_SCALE_ACTIONS, type ProxyScaleAction } from './proxy-scale';

const outcomes: Record<ProxyScaleAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'attempt-self-report': { accepted: ['self-report-attempted'], refused: [] },
  'record-the-observed-behaviours': { accepted: ['behaviours-recorded'], refused: ['behaviours-refused'] },
  'record-what-the-score-is-not': { accepted: ['limits-recorded'], refused: ['limits-refused'] },
  'seek-the-proxy-history': { accepted: ['proxy-recorded'], refused: ['proxy-refused'] },
  'record-analgesic-intent': { accepted: ['analgesic-intent'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-behaviours': { accepted: ['behaviour-check'], refused: [] },
  'check-context': { accepted: ['context-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'proxy-available-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'read-four-as-four-out-of-ten': { accepted: [], refused: ['intensity-refused'] },
  'vitals-confirm-the-pain': { accepted: [], refused: ['vitals-refused'] },
  'zero-would-mean-comfortable': { accepted: [], refused: ['zero-refused'] },
  'wait-until-they-ask': { accepted: [], refused: ['waiting-refused'] },
};

function choice(action: LearnerAction): ProxyScaleAction | undefined {
  if (action.type !== 'proxy-scale-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return PROXY_SCALE_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function proxyScaleReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `proxy-scale-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

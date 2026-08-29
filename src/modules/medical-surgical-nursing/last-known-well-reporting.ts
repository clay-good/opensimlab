import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { LAST_KNOWN_WELL_ACTIONS, type LastKnownWellAction } from './last-known-well';

const outcomes: Record<LastKnownWellAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-last-known-well': { accepted: ['bound-recorded'], refused: [] },
  'record-the-uncertain-recollection': { accepted: ['recollection-recorded'], refused: [] },
  'activate-the-stroke-pathway': { accepted: ['pathway-activated'], refused: [] },
  'record-what-the-unknown-changes': { accepted: ['consequences-recorded'], refused: ['consequences-refused'] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-the-timeline': { accepted: ['timeline-check'], refused: [] },
  'check-patient': { accepted: ['patient-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'assessed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'chart-the-recollection-as-onset': { accepted: [], refused: ['recollection-charted-refused'] },
  'chart-last-known-well-as-onset': { accepted: [], refused: ['bound-charted-refused'] },
  'unknown-onset-means-nothing-offered': { accepted: [], refused: ['nothing-offered-refused'] },
  'wait-for-the-family-to-confirm': { accepted: [], refused: ['waiting-refused'] },
};

function choice(action: LearnerAction): LastKnownWellAction | undefined {
  if (action.type !== 'last-known-well-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return LAST_KNOWN_WELL_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function lastKnownWellReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `last-known-well-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

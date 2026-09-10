import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { KNOWN_LABEL_ACTIONS, type KnownLabelAction } from './known-label';

const outcomes: Record<KnownLabelAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-label-and-what-it-explains': { accepted: ['label-recorded'], refused: [] },
  'record-what-has-changed-according-to-someone-who-knows-him': { accepted: ['carer-account-recorded'], refused: [] },
  'record-what-the-label-cannot-exclude': { accepted: ['exclusion-limits-recorded'], refused: [] },
  'escalate-to-the-surgical-team': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-adjustment-intent': { accepted: ['adjustment-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-behaviour-record': { accepted: ['behaviour-record-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'this-is-his-baseline-behaviour': { accepted: [], refused: ['baseline-claim-refused'] },
  'the-notes-say-chronic-constipation': { accepted: [], refused: ['label-claim-refused'] },
  'he-cannot-tell-us-where-it-hurts-so-we-cannot-assess-him': { accepted: [], refused: ['cannot-assess-refused'] },
  'give-him-something-for-his-bowels-and-review': { accepted: [], refused: ['laxative-trial-refused'] },
};

function choice(action: LearnerAction): KnownLabelAction | undefined {
  if (action.type !== 'known-label-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return KNOWN_LABEL_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function knownLabelReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `known-label-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

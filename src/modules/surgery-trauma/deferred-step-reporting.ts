import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { DEFERRED_STEP_ACTIONS, type DeferredStepAction } from './deferred-step';

const outcomes: Record<DeferredStepAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-injury-and-the-clock': { accepted: ['injury-recorded'], refused: [] },
  'record-the-step-that-is-waiting': { accepted: ['pending-step-recorded'], refused: [] },
  'record-what-the-interval-is-attached-to': { accepted: ['attachment-recorded'], refused: [] },
  'escalate-to-the-team-that-can-prescribe': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-prescribing-intent': { accepted: ['prescribing-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-wound-record': { accepted: ['wound-record-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'orthopaedics-will-give-them-when-they-review-her': { accepted: [], refused: ['review-gate-refused'] },
  'she-is-stable-so-there-is-no-hurry': { accepted: [], refused: ['no-hurry-refused'] },
  'it-can-go-on-the-morning-drug-chart': { accepted: [], refused: ['morning-chart-refused'] },
  'wait-until-she-is-in-theatre-anyway': { accepted: [], refused: ['theatre-refused'] },
};

function choice(action: LearnerAction): DeferredStepAction | undefined {
  if (action.type !== 'deferred-step-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return DEFERRED_STEP_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function deferredStepReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `deferred-step-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { RISING_REQUIREMENT_ACTIONS, type RisingRequirementAction } from './rising-requirement';

const outcomes: Record<RisingRequirementAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-injury-and-the-clock': { accepted: ['injury-recorded'], refused: [] },
  'record-the-rising-requirement': { accepted: ['requirement-recorded'], refused: [] },
  'record-what-one-pressure-cannot-decide': { accepted: ['pressure-limits-recorded'], refused: [] },
  'escalate-to-the-surgical-team': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-decompression-intent': { accepted: ['decompression-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-limb-record': { accepted: ['limb-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'pulses-are-present-so-perfusion-is-fine': { accepted: [], refused: ['perfusion-claim-refused'] },
  'the-pressure-was-below-the-threshold': { accepted: [], refused: ['threshold-claim-refused'] },
  'increase-analgesia-and-review-in-the-morning': { accepted: [], refused: ['analgesia-refused'] },
  'wait-for-a-repeat-pressure-before-calling': { accepted: [], refused: ['repeat-pressure-refused'] },
};

function choice(action: LearnerAction): RisingRequirementAction | undefined {
  if (action.type !== 'rising-requirement-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return RISING_REQUIREMENT_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function risingRequirementReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `rising-requirement-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { NORMAL_TEST_TOXICITY_ACTIONS, type NormalTestToxicityAction } from './normal-test-toxicity';

const outcomes: Record<NormalTestToxicityAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'withhold-the-drug-now': { accepted: ['drug-withheld'], refused: [] },
  'record-what-the-normal-test-does-not-exclude': { accepted: ['exclusions-recorded'], refused: [] },
  'record-the-toxicity-and-its-severity': { accepted: ['toxicity-recorded'], refused: [] },
  'escalate-to-acute-oncology': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-supportive-intent': { accepted: ['supportive-intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-the-treatment-record': { accepted: ['treatment-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'the-test-was-normal-so-not-the-drug': { accepted: [], refused: ['test-exclusion-refused'] },
  'wait-for-oncology-before-stopping': { accepted: [], refused: ['wait-refused'] },
  'advise-him-to-halve-the-dose': { accepted: [], refused: ['dose-advice-refused'] },
  'treat-the-symptoms-and-review-tomorrow': { accepted: [], refused: ['symptomatic-refused'] },
};

function choice(action: LearnerAction): NormalTestToxicityAction | undefined {
  if (action.type !== 'normal-test-toxicity-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return NORMAL_TEST_TOXICITY_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function normalTestToxicityReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `normal-test-toxicity-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

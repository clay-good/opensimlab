import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { TRIAL_RULE_ACTIONS, type TrialRuleAction } from './trial-rule';

const outcomes: Record<TrialRuleAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-the-clinical-trajectory-not-just-the-scan': { accepted: ['trajectory-recorded'], refused: [] },
  'record-what-the-criteria-do-and-do-not-govern': { accepted: ['governance-recorded'], refused: [] },
  'escalate-to-the-treating-team-now': { accepted: ['escalation-requested'], refused: [] },
  'record-bounded-treatment-intent': { accepted: ['intent-recorded'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  'check-observations': { accepted: ['observation-check'], refused: [] },
  'check-the-supplied-imaging-report': { accepted: ['imaging-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'call-it-pseudoprogression-and-continue': { accepted: [], refused: ['pseudoprogression-refused'] },
  'stop-the-immunotherapy-and-tell-her-it-failed': { accepted: [], refused: ['stop-refused'] },
  'the-scan-alone-decides': { accepted: [], refused: ['scan-only-refused'] },
  'rescan-in-eight-weeks-and-review-then': { accepted: [], refused: ['wait-refused'] },
};

function choice(action: LearnerAction): TrialRuleAction | undefined {
  if (action.type !== 'trial-rule-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return TRIAL_RULE_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function trialRuleReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `trial-rule-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

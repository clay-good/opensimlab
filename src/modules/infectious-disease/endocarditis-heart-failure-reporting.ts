import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { ENDOCARDITIS_ACTIONS, type EndocarditisHeartFailureAction } from './endocarditis-heart-failure';

const outcomes: Record<EndocarditisHeartFailureAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'recognize-mechanical-failure': { accepted: ['mechanical-failure-recognized'], refused: [] },
  'call-endocarditis-team': { accepted: ['endocarditis-team-activated'], refused: [] },
  'record-surgical-referral-intent': { accepted: ['surgical-referral-intent'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-labs': { accepted: ['lab-check'], refused: [] },
  'check-perfusion': { accepted: ['perfusion-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'decompensated-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'markers-improving-means-better': { accepted: [], refused: ['marker-reassurance-refused'] },
  'wide-pulse-pressure-expected': { accepted: [], refused: ['pulse-pressure-error-refused'] },
  'vegetation-size-alone-decides': { accepted: [], refused: ['vegetation-only-refused'] },
  'continue-antimicrobials-and-review-tomorrow': { accepted: [], refused: ['deferral-refused'] },
};

function choice(action: LearnerAction): EndocarditisHeartFailureAction | undefined {
  if (action.type !== 'endocarditis-heart-failure-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return ENDOCARDITIS_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function endocarditisHeartFailureReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `endocarditis-heart-failure-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

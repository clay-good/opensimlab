import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { POSSIBLE_SEPSIS_ACTIONS, type PossibleSepsisAction } from './possible-sepsis';

const outcomes: Record<PossibleSepsisAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-time-zero': { accepted: ['time-zero-recorded'], refused: [] },
  'record-uncertainty': { accepted: ['uncertainty-recorded'], refused: [] },
  'request-time-limited-assessment': { accepted: ['assessment-requested'], refused: [] },
  'record-antimicrobial-intent': { accepted: ['antimicrobial-intent'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-labs': { accepted: ['lab-check'], refused: [] },
  'check-perfusion': { accepted: ['perfusion-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'investigated-reassessment', 'shocked-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'wait-and-see': { accepted: [], refused: ['wait-refused'] },
  'assign-the-tier': { accepted: [], refused: ['tier-refused'] },
  'single-test-rules-out': { accepted: [], refused: ['single-test-refused'] },
  'defer-without-a-ceiling': { accepted: [], refused: ['deferral-refused'] },
};

function choice(action: LearnerAction): PossibleSepsisAction | undefined {
  if (action.type !== 'possible-sepsis-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return POSSIBLE_SEPSIS_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function possibleSepsisReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `possible-sepsis-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

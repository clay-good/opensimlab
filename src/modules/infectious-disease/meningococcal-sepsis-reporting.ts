import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { MENINGOCOCCAL_SEPSIS_ACTIONS, type MeningococcalSepsisAction } from './meningococcal-sepsis';

const outcomes: Record<MeningococcalSepsisAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'recognize-rash': { accepted: ['rash-recognition'], refused: [] },
  'call-senior': { accepted: ['senior-ownership'], refused: [] },
  'request-bloods': { accepted: ['bloods-requested'], refused: [] },
  'record-antimicrobial-intent': { accepted: ['antimicrobial-intent'], refused: [] },
  'record-fluid-intent': { accepted: ['fluid-and-critical-care-intent'], refused: [] },
  'escalate-consultant': { accepted: ['consultant-attendance'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-labs': { accepted: ['lab-check'], refused: [] },
  'check-perfusion': { accepted: ['perfusion-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'treated-reassessment', 'incomplete-response-reassessment', 'attendance-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'normal-markers-exclude': { accepted: [], refused: ['marker-exclusion-refused'] },
  'vaccination-excludes': { accepted: [], refused: ['vaccination-exclusion-refused'] },
  'delay-transfer-for-antibiotics': { accepted: [], refused: ['transfer-delay-refused'] },
};

function choice(action: LearnerAction): MeningococcalSepsisAction | undefined {
  if (action.type !== 'meningococcal-sepsis-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return MENINGOCOCCAL_SEPSIS_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function meningococcalSepsisReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `meningococcal-sepsis-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

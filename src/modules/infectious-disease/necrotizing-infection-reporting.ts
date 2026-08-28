import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { NECROTIZING_INFECTION_ACTIONS, type NecrotizingInfectionAction } from './necrotizing-infection';

const outcomes: Record<NecrotizingInfectionAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'recognize-disproportionate-pain': { accepted: ['disproportionate-pain-recognized'], refused: [] },
  'mark-the-margin': { accepted: ['margin-marked'], refused: [] },
  'call-surgery': { accepted: ['surgery-activated'], refused: [] },
  'record-antimicrobial-intent': { accepted: ['antimicrobial-intent'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-labs': { accepted: ['lab-check'], refused: [] },
  'check-limb': { accepted: ['limb-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'progressed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'score-excludes': { accepted: [], refused: ['score-exclusion-refused'] },
  'wait-for-imaging': { accepted: [], refused: ['imaging-delay-refused'] },
  'absent-crepitus-excludes': { accepted: [], refused: ['crepitus-exclusion-refused'] },
  'continue-oral-antibiotics': { accepted: [], refused: ['oral-continuation-refused'] },
};

function choice(action: LearnerAction): NecrotizingInfectionAction | undefined {
  if (action.type !== 'necrotizing-infection-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return NECROTIZING_INFECTION_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function necrotizingInfectionReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `necrotizing-infection-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

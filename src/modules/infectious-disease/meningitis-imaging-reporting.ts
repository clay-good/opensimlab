import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { MENINGITIS_IMAGING_ACTIONS, type MeningitisImagingAction } from './meningitis-imaging';

const outcomes: Record<MeningitisImagingAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'record-triggering-features': { accepted: ['features-recorded'], refused: [] },
  'activate-time-critical-owners': { accepted: ['owners-activated'], refused: [] },
  'record-antimicrobial-intent': { accepted: ['antimicrobial-intent'], refused: [] },
  'compare-criteria-sets': { accepted: ['criteria-compared'], refused: [] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  'check-features': { accepted: ['feature-check'], refused: [] },
  'check-labs': { accepted: ['lab-check'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'imaged-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'scan-first-is-safer': { accepted: [], refused: ['scan-default-refused'] },
  'delay-antimicrobials-for-the-puncture': { accepted: [], refused: ['delay-refused'] },
  'normal-crp-excludes': { accepted: [], refused: ['crp-refused'] },
  'negative-gram-stain-excludes': { accepted: [], refused: ['gram-stain-refused'] },
};

function choice(action: LearnerAction): MeningitisImagingAction | undefined {
  if (action.type !== 'meningitis-imaging-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return MENINGITIS_IMAGING_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function meningitisImagingReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `meningitis-imaging-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

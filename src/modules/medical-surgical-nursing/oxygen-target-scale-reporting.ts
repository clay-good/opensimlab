import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REPORT_CONTEXT_ACTION_LIMIT, type ScenarioReportActionContext } from '@platform/reporting/contracts';
import { OXYGEN_TARGET_ACTIONS, type OxygenTargetScaleAction } from './oxygen-target-scale';

const outcomes: Record<OxygenTargetScaleAction, { accepted: readonly string[]; refused: readonly string[] }> = {
  'check-the-prescription': { accepted: ['prescription-check'], refused: [] },
  'check-the-chart': { accepted: ['chart-check'], refused: [] },
  'record-the-scale-mismatch': { accepted: ['mismatch-recorded'], refused: ['mismatch-refused'] },
  'rescore-on-the-prescribed-scale': { accepted: ['rescored'], refused: ['rescore-refused'] },
  'record-what-the-rescore-changes': { accepted: ['consequences-recorded'], refused: ['consequences-refused'] },
  'confirm-the-scale-with-the-team': { accepted: ['confirmation-requested'], refused: ['confirmation-refused'] },
  'review-boundaries': { accepted: ['boundary-review'], refused: [] },
  monitor: { accepted: ['monitoring'], refused: [] },
  reassess: { accepted: ['initial-reassessment', 'reviewed-reassessment'], refused: [] },
  handoff: { accepted: ['handoff'], refused: ['handoff-refused'] },
  'raise-the-oxygen-to-correct-it': { accepted: [], refused: ['oxygen-raise-refused'] },
  'assume-the-diagnosis-sets-the-scale': { accepted: [], refused: ['assumed-scale-refused'] },
  'a-lower-score-means-she-is-improving': { accepted: [], refused: ['improvement-refused'] },
  'score-both-and-take-the-higher': { accepted: [], refused: ['both-scales-refused'] },
};

function choice(action: LearnerAction): OxygenTargetScaleAction | undefined {
  if (action.type !== 'oxygen-target-scale-response' || !Number.isSafeInteger(action.tick) || action.tick < 0
    || !action.payload || typeof action.payload !== 'object' || Array.isArray(action.payload)) return undefined;
  const keys = Reflect.ownKeys(action.payload);
  if (keys.length !== 1 || keys[0] !== 'action') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(action.payload, 'action')!;
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return undefined;
  return OXYGEN_TARGET_ACTIONS.find((value) => value === descriptor.value);
}

/** Only uniquely attributable outcomes enter optional context; never event prose or arbitrary payloads. */
export function oxygenTargetScaleReportActions(actions: readonly LearnerAction[], events: readonly EngineEvent[]): ScenarioReportActionContext[] {
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
    const id = (event: string) => `oxygen-target-scale-${event}-${action.tick}`;
    const accepted = expected.accepted.map(id); const refused = expected.refused.map(id);
    const matches = events.filter((event) => event.tick === action.tick
      && (accepted.includes(event.eventId) || refused.includes(event.eventId)));
    if (matches.length !== 1) return [];
    return [{ tick: action.tick, type: action.type, payload: { action: selected },
      outcome: refused.includes(matches[0]!.eventId) ? 'refused' as const : 'accepted' as const }];
  });
}

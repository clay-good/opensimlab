import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { OxygenTargetScale, OXYGEN_TARGET_ACTIONS } from '../../src/modules/medical-surgical-nursing/oxygen-target-scale';
import { oxygenTargetScaleReportActions as reportActions } from '../../src/modules/medical-surgical-nursing/oxygen-target-scale-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'oxygen-target-scale-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `oxygen-target-scale-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('OxygenTargetScale reports require uniquely attributable action outcomes', () => {
  it.each([
    ['check-the-prescription', 'prescription-check', 'accepted'],
    ['check-the-chart', 'chart-check', 'accepted'],
    ['record-the-scale-mismatch', 'mismatch-recorded', 'accepted'],
    ['record-the-scale-mismatch', 'mismatch-refused', 'refused'],
    ['rescore-on-the-prescribed-scale', 'rescored', 'accepted'],
    ['rescore-on-the-prescribed-scale', 'rescore-refused', 'refused'],
    ['record-what-the-rescore-changes', 'consequences-recorded', 'accepted'],
    ['record-what-the-rescore-changes', 'consequences-refused', 'refused'],
    ['confirm-the-scale-with-the-team', 'confirmation-requested', 'accepted'],
    ['confirm-the-scale-with-the-team', 'confirmation-refused', 'refused'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['raise-the-oxygen-to-correct-it', 'oxygen-raise-refused', 'refused'],
    ['assume-the-diagnosis-sets-the-scale', 'assumed-scale-refused', 'refused'],
    ['a-lower-score-means-she-is-improving', 'improvement-refused', 'refused'],
    ['score-both-and-take-the-higher', 'both-scales-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'oxygen-target-scale-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes reading, recording, and refusals at one tick', () => {
    const model = new OxygenTargetScale();
    const actions = ['check-the-prescription', 'raise-the-oxygen-to-correct-it', 'check-the-chart', 'score-both-and-take-the-higher']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['check-the-prescription', 'accepted'], ['raise-the-oxygen-to-correct-it', 'refused'],
      ['check-the-chart', 'accepted'], ['score-both-and-take-the-higher', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'last-known-well-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'oxygen-target-scale-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = OXYGEN_TARGET_ACTIONS.filter((action) => {
      const model = new OxygenTargetScale();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(OXYGEN_TARGET_ACTIONS.length);
  });
});

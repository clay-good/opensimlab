import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { LowScore, LOW_SCORE_ACTIONS } from '../../src/modules/medical-surgical-nursing/low-score';
import { lowScoreReportActions as reportActions } from '../../src/modules/medical-surgical-nursing/low-score-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'low-score-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `low-score-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('LowScore reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-observations-and-score', 'observations-recorded', 'accepted'],
    ['record-what-the-score-excludes', 'exclusions-recorded', 'accepted'],
    ['record-the-family-report', 'family-report-recorded', 'accepted'],
    ['escalate-on-concern', 'escalation-requested', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-context', 'context-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['score-is-low-so-recheck-later', 'recheck-refused', 'refused'],
    ['no-fever-so-not-infection', 'fever-refused', 'refused'],
    ['use-qsofa-instead', 'qsofa-refused', 'refused'],
    ['document-and-move-on', 'documentation-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'low-score-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new LowScore();
    const actions = ['record-observations-and-score', 'score-is-low-so-recheck-later', 'check-context', 'document-and-move-on']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-observations-and-score', 'accepted'], ['score-is-low-so-recheck-later', 'refused'],
      ['check-context', 'accepted'], ['document-and-move-on', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'possible-sepsis-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'low-score-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = LOW_SCORE_ACTIONS.filter((action) => {
      const model = new LowScore();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(LOW_SCORE_ACTIONS.length);
  });
});

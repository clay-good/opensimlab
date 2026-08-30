import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { EasyLabel } from '../../src/modules/oncology/easy-label';
import { EASY_LABEL_ACTIONS } from '../../src/modules/oncology/easy-label';
import { easyLabelReportActions as reportActions } from '../../src/modules/oncology/easy-label-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'easy-label-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `easy-label-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('EasyLabel reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-that-the-label-is-a-diagnosis-of-exclusion', 'exclusion-recorded', 'accepted'],
    ['record-what-has-not-been-excluded', 'outstanding-recorded', 'accepted'],
    ['escalate-so-both-can-start-together', 'escalation-requested', 'accepted'],
    ['record-bounded-treatment-intent', 'intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-the-supplied-results', 'results-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['start-immunosuppression-now-it-is-obviously-colitis', 'immunosuppression-refused', 'refused'],
    ['wait-for-every-result-before-telling-anyone', 'wait-refused', 'refused'],
    ['no-fever-so-it-cannot-be-infection', 'no-fever-refused', 'refused'],
    ['four-cycles-in-so-it-is-the-drug', 'four-cycles-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'easy-label-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new EasyLabel();
    const actions = ['record-that-the-label-is-a-diagnosis-of-exclusion', 'no-fever-so-it-cannot-be-infection',
      'check-the-supplied-results', 'four-cycles-in-so-it-is-the-drug'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-that-the-label-is-a-diagnosis-of-exclusion', 'accepted'], ['no-fever-so-it-cannot-be-infection', 'refused'],
      ['check-the-supplied-results', 'accepted'], ['four-cycles-in-so-it-is-the-drug', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'silent-interaction-response', payload: { action: 'review-boundaries' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'easy-label-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = EASY_LABEL_ACTIONS.filter((action) => {
      const model = new EasyLabel();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(EASY_LABEL_ACTIONS.length);
  });
});

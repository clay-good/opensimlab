import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { UnfinishedSurvey, UNFINISHED_SURVEY_ACTIONS } from '../../src/modules/surgery-trauma/unfinished-survey';
import { unfinishedSurveyReportActions as reportActions } from '../../src/modules/surgery-trauma/unfinished-survey-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'unfinished-survey-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `unfinished-survey-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('UnfinishedSurvey reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-why-he-could-not-be-examined', 'examination-limits-recorded', 'accepted'],
    ['record-what-the-injury-list-rests-on', 'injury-list-recorded', 'accepted'],
    ['record-that-the-third-survey-is-not-done', 'survey-incomplete-recorded', 'accepted'],
    ['escalate-to-the-trauma-team', 'escalation-requested', 'accepted'],
    ['record-bounded-survey-intent', 'survey-intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-injury-record', 'injury-record-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['the-secondary-survey-is-documented-complete', 'documentation-claim-refused', 'refused'],
    ['the-pan-scan-would-have-shown-it', 'imaging-claim-refused', 'refused'],
    ['he-has-not-complained-of-anything', 'no-complaint-refused', 'refused'],
    ['clear-him-now-and-review-if-something-appears', 'clear-now-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'unfinished-survey-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new UnfinishedSurvey();
    const actions = ['record-why-he-could-not-be-examined', 'the-pan-scan-would-have-shown-it',
      'check-injury-record', 'he-has-not-complained-of-anything'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-why-he-could-not-be-examined', 'accepted'], ['the-pan-scan-would-have-shown-it', 'refused'],
      ['check-injury-record', 'accepted'], ['he-has-not-complained-of-anything', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'rising-requirement-response', payload: { action: 'review-boundaries' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'unfinished-survey-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = UNFINISHED_SURVEY_ACTIONS.filter((action) => {
      const model = new UnfinishedSurvey();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(UNFINISHED_SURVEY_ACTIONS.length);
  });
});

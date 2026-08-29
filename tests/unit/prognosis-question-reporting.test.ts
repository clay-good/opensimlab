import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PrognosisQuestion, PROGNOSIS_QUESTION_ACTIONS } from '../../src/modules/oncology/prognosis-question';
import { prognosisQuestionReportActions as reportActions } from '../../src/modules/oncology/prognosis-question-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'prognosis-question-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `prognosis-question-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('PrognosisQuestion reports require uniquely attributable action outcomes', () => {
  it.each([
    ['ask-what-he-wants-to-know', 'intent-asked', 'accepted'],
    ['record-the-question-as-asked', 'question-recorded', 'accepted'],
    ['check-what-he-believes-the-treatment-is-for', 'belief-checked', 'accepted'],
    ['answer-with-scenarios-not-a-number', 'answer-refused', 'refused'],
    ['state-the-direction-of-the-error', 'direction-refused', 'refused'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-what-was-said', 'conversation-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['give-a-single-number', 'single-number-refused', 'refused'],
    ['say-nobody-can-know', 'nobody-knows-refused', 'refused'],
    ['reassure-and-move-on', 'reassurance-refused', 'refused'],
    ['answer-before-asking-what-he-wants', 'premature-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'prognosis-question-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new PrognosisQuestion();
    const actions = ['ask-what-he-wants-to-know', 'give-a-single-number',
      'check-what-was-said', 'reassure-and-move-on'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['ask-what-he-wants-to-know', 'accepted'], ['give-a-single-number', 'refused'],
      ['check-what-was-said', 'accepted'], ['reassure-and-move-on', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'normal-test-toxicity-response', payload: { action: 'monitor' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'prognosis-question-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = PROGNOSIS_QUESTION_ACTIONS.filter((action) => {
      const model = new PrognosisQuestion();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(PROGNOSIS_QUESTION_ACTIONS.length);
  });
});

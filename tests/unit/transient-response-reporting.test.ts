import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { TransientResponse, TRANSIENT_RESPONSE_ACTIONS } from '../../src/modules/surgery-trauma/transient-response';
import { transientResponseReportActions as reportActions } from '../../src/modules/surgery-trauma/transient-response-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'transient-response-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `transient-response-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('TransientResponse reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-mechanism-and-the-clock', 'mechanism-recorded', 'accepted'],
    ['record-the-shape-of-the-response', 'response-recorded', 'accepted'],
    ['record-what-a-picture-cannot-do', 'imaging-limits-recorded', 'accepted'],
    ['escalate-to-the-theatre-team', 'escalation-requested', 'accepted'],
    ['record-bounded-operative-intent', 'operative-intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-response-record', 'response-record-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['he-came-back-up-so-he-is-stable', 'stability-claim-refused', 'refused'],
    ['send-him-for-a-scan-before-calling', 'scan-first-refused', 'refused'],
    ['give-another-litre-and-see', 'another-litre-refused', 'refused'],
    ['wait-for-the-cross-matched-blood-before-calling', 'wait-for-blood-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'transient-response-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new TransientResponse();
    const actions = ['record-the-mechanism-and-the-clock', 'send-him-for-a-scan-before-calling',
      'check-response-record', 'give-another-litre-and-see'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-mechanism-and-the-clock', 'accepted'], ['send-him-for-a-scan-before-calling', 'refused'],
      ['check-response-record', 'accepted'], ['give-another-litre-and-see', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'unfinished-survey-response', payload: { action: 'review-boundaries' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'transient-response-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = TRANSIENT_RESPONSE_ACTIONS.filter((action) => {
      const model = new TransientResponse();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(TRANSIENT_RESPONSE_ACTIONS.length);
  });
});

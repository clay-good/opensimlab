import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { KnownLabel, KNOWN_LABEL_ACTIONS } from '../../src/modules/surgery-trauma/known-label';
import { knownLabelReportActions as reportActions } from '../../src/modules/surgery-trauma/known-label-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'known-label-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `known-label-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('KnownLabel reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-label-and-what-it-explains', 'label-recorded', 'accepted'],
    ['record-what-has-changed-according-to-someone-who-knows-him', 'carer-account-recorded', 'accepted'],
    ['record-what-the-label-cannot-exclude', 'exclusion-limits-recorded', 'accepted'],
    ['escalate-to-the-surgical-team', 'escalation-requested', 'accepted'],
    ['record-bounded-adjustment-intent', 'adjustment-intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-behaviour-record', 'behaviour-record-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['this-is-his-baseline-behaviour', 'baseline-claim-refused', 'refused'],
    ['the-notes-say-chronic-constipation', 'label-claim-refused', 'refused'],
    ['he-cannot-tell-us-where-it-hurts-so-we-cannot-assess-him', 'cannot-assess-refused', 'refused'],
    ['give-him-something-for-his-bowels-and-review', 'laxative-trial-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'known-label-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new KnownLabel();
    const actions = ['record-the-label-and-what-it-explains', 'this-is-his-baseline-behaviour',
      'check-behaviour-record', 'give-him-something-for-his-bowels-and-review'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-label-and-what-it-explains', 'accepted'], ['this-is-his-baseline-behaviour', 'refused'],
      ['check-behaviour-record', 'accepted'], ['give-him-something-for-his-bowels-and-review', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'deferred-step-response', payload: { action: 'review-boundaries' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'known-label-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = KNOWN_LABEL_ACTIONS.filter((action) => {
      const model = new KnownLabel();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(KNOWN_LABEL_ACTIONS.length);
  });
});

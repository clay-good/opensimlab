import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { DeferredStep, DEFERRED_STEP_ACTIONS } from '../../src/modules/surgery-trauma/deferred-step';
import { deferredStepReportActions as reportActions } from '../../src/modules/surgery-trauma/deferred-step-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'deferred-step-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `deferred-step-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('DeferredStep reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-injury-and-the-clock', 'injury-recorded', 'accepted'],
    ['record-the-step-that-is-waiting', 'pending-step-recorded', 'accepted'],
    ['record-what-the-interval-is-attached-to', 'attachment-recorded', 'accepted'],
    ['escalate-to-the-team-that-can-prescribe', 'escalation-requested', 'accepted'],
    ['record-bounded-prescribing-intent', 'prescribing-intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-wound-record', 'wound-record-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['orthopaedics-will-give-them-when-they-review-her', 'review-gate-refused', 'refused'],
    ['she-is-stable-so-there-is-no-hurry', 'no-hurry-refused', 'refused'],
    ['it-can-go-on-the-morning-drug-chart', 'morning-chart-refused', 'refused'],
    ['wait-until-she-is-in-theatre-anyway', 'theatre-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'deferred-step-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new DeferredStep();
    const actions = ['record-the-injury-and-the-clock', 'orthopaedics-will-give-them-when-they-review-her',
      'check-wound-record', 'it-can-go-on-the-morning-drug-chart'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-injury-and-the-clock', 'accepted'], ['orthopaedics-will-give-them-when-they-review-her', 'refused'],
      ['check-wound-record', 'accepted'], ['it-can-go-on-the-morning-drug-chart', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'third-attendance-response', payload: { action: 'review-boundaries' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'deferred-step-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = DEFERRED_STEP_ACTIONS.filter((action) => {
      const model = new DeferredStep();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(DEFERRED_STEP_ACTIONS.length);
  });
});

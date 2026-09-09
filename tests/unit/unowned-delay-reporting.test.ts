import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { UnownedDelay, UNOWNED_DELAY_ACTIONS } from '../../src/modules/surgery-trauma/unowned-delay';
import { unownedDelayReportActions as reportActions } from '../../src/modules/surgery-trauma/unowned-delay-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'unowned-delay-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `unowned-delay-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('UnownedDelay reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-fracture-and-the-clock', 'fracture-recorded', 'accepted'],
    ['record-what-each-delay-was-for', 'delay-reasons-recorded', 'accepted'],
    ['record-what-is-still-being-waited-for', 'pending-recorded', 'accepted'],
    ['escalate-to-the-team-that-owns-the-list', 'escalation-requested', 'accepted'],
    ['record-bounded-scheduling-intent', 'scheduling-intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-delay-record', 'delay-record-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['she-is-not-fit-until-the-echo-is-done', 'echo-gate-refused', 'refused'],
    ['the-list-is-full-so-it-is-out-of-our-hands', 'list-full-refused', 'refused'],
    ['one-more-night-will-not-make-a-difference', 'one-more-night-refused', 'refused'],
    ['keep-her-fasted-in-case-a-slot-appears', 'keep-fasted-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'unowned-delay-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new UnownedDelay();
    const actions = ['record-the-fracture-and-the-clock', 'she-is-not-fit-until-the-echo-is-done',
      'check-delay-record', 'keep-her-fasted-in-case-a-slot-appears'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-fracture-and-the-clock', 'accepted'], ['she-is-not-fit-until-the-echo-is-done', 'refused'],
      ['check-delay-record', 'accepted'], ['keep-her-fasted-in-case-a-slot-appears', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'quiet-chest-response', payload: { action: 'review-boundaries' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'unowned-delay-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = UNOWNED_DELAY_ACTIONS.filter((action) => {
      const model = new UnownedDelay();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(UNOWNED_DELAY_ACTIONS.length);
  });
});

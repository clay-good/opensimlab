import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { QuietChest, QUIET_CHEST_ACTIONS } from '../../src/modules/surgery-trauma/quiet-chest';
import { quietChestReportActions as reportActions } from '../../src/modules/surgery-trauma/quiet-chest-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'quiet-chest-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `quiet-chest-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('QuietChest reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-fall-and-what-was-broken', 'injury-recorded', 'accepted'],
    ['record-what-comfortable-at-rest-measures', 'comfort-limits-recorded', 'accepted'],
    ['record-what-the-count-predicts', 'count-recorded', 'accepted'],
    ['escalate-to-the-admitting-team', 'escalation-requested', 'accepted'],
    ['record-bounded-admission-intent', 'admission-intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-chest-record', 'chest-record-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['her-numbers-are-normal-so-she-can-go-home', 'normal-numbers-refused', 'refused'],
    ['there-is-no-pneumothorax-on-the-film', 'film-claim-refused', 'refused'],
    ['she-says-the-pain-is-manageable', 'pain-report-refused', 'refused'],
    ['send-her-home-with-tablets-and-review-in-a-week', 'discharge-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'quiet-chest-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new QuietChest();
    const actions = ['record-the-fall-and-what-was-broken', 'there-is-no-pneumothorax-on-the-film',
      'check-chest-record', 'she-says-the-pain-is-manageable'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-fall-and-what-was-broken', 'accepted'], ['there-is-no-pneumothorax-on-the-film', 'refused'],
      ['check-chest-record', 'accepted'], ['she-says-the-pain-is-manageable', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'transient-response-response', payload: { action: 'review-boundaries' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'quiet-chest-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = QUIET_CHEST_ACTIONS.filter((action) => {
      const model = new QuietChest();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(QUIET_CHEST_ACTIONS.length);
  });
});

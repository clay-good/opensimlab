import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { DelayedImmuneEvent } from '../../src/modules/oncology/delayed-immune-event';
import { DELAYED_IMMUNE_EVENT_ACTIONS } from '../../src/modules/oncology/delayed-immune-event';
import { delayedImmuneEventReportActions as reportActions } from '../../src/modules/oncology/delayed-immune-event-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'delayed-immune-event-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `delayed-immune-event-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('DelayedImmuneEvent reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-completed-exposure', 'exposure-recorded', 'accepted'],
    ['record-the-symptom-course', 'course-recorded', 'accepted'],
    ['record-infection-evaluation-in-parallel', 'infection-evaluation-recorded', 'accepted'],
    ['escalate-to-the-treating-service', 'escalation-requested', 'accepted'],
    ['record-bounded-treatment-intent', 'treatment-intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-exposure-history', 'exposure-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['stopped-months-ago-so-not-the-drug', 'attribution-refused', 'refused'],
    ['slow-the-gut-and-review-tomorrow', 'motility-refused', 'refused'],
    ['wait-for-stool-results-before-escalating', 'wait-refused', 'refused'],
    ['discharge-with-oral-rehydration', 'discharge-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'delayed-immune-event-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new DelayedImmuneEvent();
    const actions = ['record-the-completed-exposure', 'stopped-months-ago-so-not-the-drug',
      'check-exposure-history', 'discharge-with-oral-rehydration'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-completed-exposure', 'accepted'], ['stopped-months-ago-so-not-the-drug', 'refused'],
      ['check-exposure-history', 'accepted'], ['discharge-with-oral-rehydration', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'low-score-response', payload: { action: 'monitor' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'delayed-immune-event-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = DELAYED_IMMUNE_EVENT_ACTIONS.filter((action) => {
      const model = new DelayedImmuneEvent();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(DELAYED_IMMUNE_EVENT_ACTIONS.length);
  });
});

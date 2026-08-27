import { describe, expect, it, vi } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RenalHypermagnesemia, RENAL_HYPERMAGNESEMIA_ACTIONS } from '../../src/modules/renal-electrolyte/hypermagnesemia';
import { renalHypermagnesemiaReportActions as reportActions } from '../../src/modules/renal-electrolyte/hypermagnesemia-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'renal-hypermagnesemia-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `renal-hypermagnesemia-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RenalHypermagnesemia reports require uniquely attributable action outcomes', () => {
  it.each([
    ['stop-magnesium', 'magnesium-stopped', 'accepted'], ['support-breathing', 'breathing-support', 'accepted'],
    ['calcium', 'calcium-antagonism', 'accepted'], ['call-support', 'support', 'accepted'],
    ['review-context', 'context-review', 'accepted'], ['deliver-removal', 'removal-care', 'accepted'],
    ['monitor', 'monitoring', 'accepted'], ['check-magnesium', 'magnesium-check', 'accepted'],
    ['check-neuromuscular', 'neuromuscular-check', 'accepted'], ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'calcium-reassessment', 'accepted'], ['reassess', 'recurrence-reassessment', 'accepted'],
    ['reassess', 'removal-reassessment', 'accepted'], ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'], ['calcium-means-clearance', 'calcium-clearance-refused', 'refused'],
    ['routine-diuresis', 'routine-diuresis-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'renal-hypermagnesemia-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes calcium, observation, and refusals at one tick', () => {
    const model = new RenalHypermagnesemia();
    const actions = ['calcium', 'calcium-means-clearance', 'check-magnesium', 'routine-diuresis'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map(({ outcome }) => outcome)).toEqual(['accepted', 'refused', 'accepted', 'refused']);
  });

  it('attributes all thirteen choices against real events with a pending-removal-response handoff', () => {
    const model = new RenalHypermagnesemia();
    const decisions = [[0, 'monitor'], [1, 'check-neuromuscular'], [2, 'check-magnesium'],
      [3, 'review-context'], [4, 'call-support'], [5, 'stop-magnesium'], [6, 'support-breathing'],
      [7, 'handoff'], [8, 'calcium-means-clearance'], [9, 'routine-diuresis'], [10, 'calcium'],
      [11, 'deliver-removal'], [12, 'reassess'], [13, 'handoff']] as const;
    expect(new Set(decisions.map(([, action]) => action))).toEqual(new Set(RENAL_HYPERMAGNESEMIA_ACTIONS));
    const actions = decisions.map(([tick, action]) => request(action, tick));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick)
      .map(({ id }) => event(id, action.tick)));
    const outcomes = reportActions(actions, events);
    expect(outcomes).toHaveLength(actions.length);
    expect(outcomes.map(({ outcome }) => outcome)).toEqual([
      'accepted', 'accepted', 'accepted', 'accepted', 'accepted', 'accepted', 'accepted',
      'refused', 'refused', 'refused', 'accepted', 'accepted', 'accepted', 'accepted',
    ]);
    expect(model.snapshot(13)).toMatchObject({ ended: 'handoff', removalResponseObserved: false });
  });

  it('omits missing, unrelated, wrong-tick, shared, and automatic checkpoint events', () => {
    for (const events of [[], [event('monitoring', 4)], [event('monitoring-duplicate')], [event('action-refused')],
      [event('calcium-clearance-refused')], [event('clinical-deterioration')], [event('calcium-review-checkpoint')],
      [event('removal-checkpoint')], [event('instructor-takeover')], [{ ...event('monitoring'), tick: 4 }]]) {
      expect(reportActions([request('monitor')], events)).toEqual([]);
    }
    const model = new RenalHypermagnesemia(); model.apply('monitor', 0);
    expect(reportActions([request('monitor')], model.apply('monitor', 3).map(({ id }) => event(id)))).toEqual([]);
    const refused = model.apply('unknown', 3).map(({ id }) => event(id));
    expect(refused.at(-1)?.eventId).toBe('renal-hypermagnesemia-action-refused-3');
    expect(reportActions([request('monitor')], refused)).toEqual([]);
  });

  it('omits repeated requests, duplicate events, and contradictory outcomes', () => {
    expect(reportActions([request('calcium'), request('calcium')], [event('calcium-antagonism')])).toEqual([]);
    expect(reportActions([request('monitor')], [event('monitoring'), event('monitoring')])).toEqual([]);
    expect(reportActions([request('handoff')], [event('handoff'), event('handoff-refused')])).toEqual([]);
  });

  it('counts duplicates before taking the last twenty requests and does not backfill omissions', () => {
    const actions = [request('monitor'), ...Array.from({ length: 19 }, () => ({
      tick: 3, type: 'silence-alarm', payload: { alarmId: 'private-value' },
    })), request('monitor')];
    expect(reportActions(actions, [event('monitoring')])).toEqual([]);
    const observations = Array.from({ length: 21 }, (_, tick) => request('reassess', tick));
    expect(reportActions(observations, [event('initial-reassessment', 0)])).toEqual([]);
    const result = reportActions(observations, observations.map(({ tick }) => event('initial-reassessment', tick)));
    expect(result).toHaveLength(20); expect(result[0]?.tick).toBe(1);
  });

  it('does not evaluate accessors or transmit unknown, inherited, symbolic, or private payload fields', () => {
    const getter = vi.fn(() => 'monitor');
    const accessor = Object.defineProperty({}, 'action', { enumerable: true, get: getter });
    const nonEnumerable = Object.defineProperty({}, 'action', { enumerable: false, value: 'monitor' });
    const inherited = Object.create({ action: 'monitor' });
    const actions: LearnerAction[] = [request('private-value'), request('monitor', NaN), request('monitor', -1),
      request('monitor', 1.5), request('monitor', Infinity), request('monitor', Number.MAX_SAFE_INTEGER + 1),
      { ...request('monitor'), type: 'give-drug' },
      ...[accessor, nonEnumerable, inherited, { action: 'monitor', notes: 'private-value' },
        { action: 'monitor', [Symbol('private')]: true }, ['monitor'], null].map((payload) => ({ ...request('monitor'), payload } as LearnerAction))];
    expect(reportActions(actions, [event('monitoring')])).toEqual([]); expect(getter).not.toHaveBeenCalled();
  });

  it('preserves input history and omits event prose and structured private values', () => {
    const actions = [request('monitor')]; const events = [{ ...event('monitoring'), data: { privateValue: 'not for submission' } }];
    const before = JSON.stringify({ actions, events });
    expect(reportActions(actions, events)).toEqual([{ tick: 3, type: 'renal-hypermagnesemia-response', outcome: 'accepted', payload: { action: 'monitor' } }]);
    expect(JSON.stringify({ actions, events })).toBe(before);
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RenalHypocalcemia, RENAL_HYPOCALCEMIA_ACTIONS, RENAL_HYPOCALCEMIA_RESCUE_TICKS } from '../../src/modules/renal-electrolyte/hypocalcemia';
import { renalHypocalcemiaReportActions as reportActions } from '../../src/modules/renal-electrolyte/hypocalcemia-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'renal-hypocalcemia-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `renal-hypocalcemia-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RenalHypocalcemia reports require uniquely attributable action outcomes', () => {
  it.each([
    ['rescue-calcium', 'calcium-rescue', 'accepted'], ['continue-calcium', 'calcium-continuation', 'accepted'],
    ['continue-calcium', 'continuing-review-refused', 'refused'], ['call-support', 'support', 'accepted'],
    ['review-context', 'context-review', 'accepted'], ['monitor', 'monitoring', 'accepted'],
    ['coordinate-mineral-care', 'mineral-care', 'accepted'], ['arrange-follow-up', 'follow-up', 'accepted'],
    ['check-ionized', 'ionized-check', 'accepted'], ['check-symptoms', 'symptom-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'], ['reassess', 'rescue-reassessment', 'accepted'],
    ['reassess', 'continuing-reassessment', 'accepted'], ['reassess', 'recurrence-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'], ['handoff', 'handoff-refused', 'refused'],
    ['trust-adjusted-total', 'adjusted-reassurance-refused', 'refused'], ['oral-only', 'oral-only-refused', 'refused'],
    ['stop-after-relief', 'relief-stop-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'renal-hypocalcemia-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes rescue, observation, and refusals at one tick', () => {
    const model = new RenalHypocalcemia();
    const actions = ['rescue-calcium', 'trust-adjusted-total', 'check-ionized', 'oral-only', 'stop-after-relief'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map(({ outcome }) => outcome)).toEqual(['accepted', 'refused', 'accepted', 'refused', 'refused']);
  });

  it('attributes all fourteen choices against real model events, including refused then accepted care and pending-response handoff', () => {
    const model = new RenalHypocalcemia();
    const response = 11 + RENAL_HYPOCALCEMIA_RESCUE_TICKS;
    const decisions = [[0, 'monitor'], [1, 'check-symptoms'], [2, 'check-ionized'], [3, 'review-context'],
      [4, 'call-support'], [5, 'coordinate-mineral-care'], [6, 'arrange-follow-up'], [7, 'continue-calcium'],
      [8, 'handoff'], [9, 'trust-adjusted-total'], [10, 'oral-only'], [10, 'stop-after-relief'],
      [11, 'rescue-calcium'], [12, 'continue-calcium'], [response, 'reassess'], [response + 1, 'handoff']] as const;
    expect(new Set(decisions.map(([, action]) => action))).toEqual(new Set(RENAL_HYPOCALCEMIA_ACTIONS));
    const actions = decisions.map(([tick, action]) => request(action, tick));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick)
      .map(({ id }) => event(id, action.tick)));
    const outcomes = reportActions(actions, events);
    expect(outcomes).toHaveLength(actions.length);
    expect(outcomes.map(({ outcome }) => outcome)).toEqual([
      'accepted', 'accepted', 'accepted', 'accepted', 'accepted', 'accepted', 'accepted', 'refused',
      'refused', 'refused', 'refused', 'refused', 'accepted', 'accepted', 'accepted', 'accepted',
    ]);
    expect(model.snapshot(response + 1)).toMatchObject({ ended: 'handoff', continuingResponseObserved: false });
  });

  it('omits missing, unrelated, wrong-tick, shared, and automatic checkpoint events', () => {
    for (const events of [[], [event('monitoring', 4)], [event('monitoring-duplicate')], [event('action-refused')],
      [event('adjusted-reassurance-refused')], [event('rescue-checkpoint')], [{ ...event('monitoring'), tick: 4 }]]) {
      expect(reportActions([request('monitor')], events)).toEqual([]);
    }
    const model = new RenalHypocalcemia(); model.apply('monitor', 0);
    expect(reportActions([request('monitor')], model.apply('monitor', 3).map(({ id }) => event(id)))).toEqual([]);
    const refused = model.apply('unknown', 3).map(({ id }) => event(id));
    expect(refused.at(-1)?.eventId).toBe('renal-hypocalcemia-action-refused-3');
    expect(reportActions([request('monitor')], refused)).toEqual([]);
  });

  it('omits repeated requests, duplicate events, and contradictory outcomes', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
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
    expect(reportActions(actions, events)).toEqual([{ tick: 3, type: 'renal-hypocalcemia-response', outcome: 'accepted', payload: { action: 'monitor' } }]);
    expect(JSON.stringify({ actions, events })).toBe(before);
  });
});

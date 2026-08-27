import { describe, expect, it, vi } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RenalHypernatremia, RENAL_HYPERNATREMIA_ACTIONS, RENAL_HYPERNATREMIA_VOLUME_TICKS,
  RENAL_HYPERNATREMIA_WATER_TICKS } from '../../src/modules/renal-electrolyte/hypernatremia';
import { renalHypernatremiaReportActions as reportActions } from '../../src/modules/renal-electrolyte/hypernatremia-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'renal-hypernatremia-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `renal-hypernatremia-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RenalHypernatremia reports require uniquely attributable action outcomes', () => {
  it.each([
    ['restore-volume', 'volume-restoration', 'accepted'], ['replace-water', 'water-replacement', 'accepted'],
    ['replace-water', 'water-review-refused', 'refused'], ['manage-losses', 'losses-care', 'accepted'],
    ['manage-losses', 'losses-review-refused', 'refused'], ['assist-water-access', 'water-access', 'accepted'],
    ['call-support', 'support', 'accepted'], ['review-context', 'context-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'], ['check-sodium', 'sodium-check', 'accepted'],
    ['check-fluid-balance', 'fluid-balance-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'], ['reassess', 'volume-reassessment', 'accepted'],
    ['reassess', 'water-reassessment', 'accepted'], ['reassess', 'recurrence-reassessment', 'accepted'],
    ['reassess', 'combined-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'], ['handoff', 'handoff-refused', 'refused'],
    ['normalize-now', 'normalization-refused', 'refused'], ['empiric-desmopressin', 'desmopressin-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'renal-hypernatremia-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes restoration, observation, and refusals at one tick', () => {
    const model = new RenalHypernatremia();
    const actions = ['restore-volume', 'normalize-now', 'check-sodium', 'empiric-desmopressin'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map(({ outcome }) => outcome)).toEqual(['accepted', 'refused', 'accepted', 'refused']);
  });

  it('attributes all thirteen choices against real model events, including refused then accepted care and handoff', () => {
    const model = new RenalHypernatremia();
    const volume = 10 + RENAL_HYPERNATREMIA_VOLUME_TICKS;
    const later = volume + RENAL_HYPERNATREMIA_WATER_TICKS;
    const decisions = [[0, 'assist-water-access'], [1, 'monitor'], [2, 'check-fluid-balance'], [3, 'check-sodium'],
      [4, 'review-context'], [5, 'call-support'], [6, 'replace-water'], [7, 'manage-losses'], [8, 'handoff'],
      [9, 'normalize-now'], [9, 'empiric-desmopressin'], [10, 'restore-volume'], [volume, 'replace-water'],
      [volume + 1, 'manage-losses'], [later, 'reassess'], [later + 1, 'handoff']] as const;
    expect(new Set(decisions.map(([, action]) => action))).toEqual(new Set(RENAL_HYPERNATREMIA_ACTIONS));
    const actions = decisions.map(([tick, action]) => request(action, tick));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick)
      .map(({ id }) => event(id, action.tick)));
    const outcomes = reportActions(actions, events);
    expect(outcomes).toHaveLength(actions.length);
    expect(outcomes.map(({ outcome }) => outcome)).toEqual([
      'accepted', 'accepted', 'accepted', 'accepted', 'accepted', 'accepted', 'refused', 'refused',
      'refused', 'refused', 'refused', 'accepted', 'accepted', 'accepted', 'accepted', 'accepted',
    ]);
    expect(model.snapshot(later + 1).ended).toBe('handoff');
  });

  it('omits missing, unrelated, wrong-tick, shared, and automatic checkpoint events', () => {
    for (const events of [[], [event('monitoring', 4)], [event('monitoring-duplicate')], [event('action-refused')],
      [event('desmopressin-refused')], [event('volume-checkpoint')], [{ ...event('monitoring'), tick: 4 }]]) {
      expect(reportActions([request('monitor')], events)).toEqual([]);
    }
    const model = new RenalHypernatremia(); model.apply('monitor', 0);
    expect(reportActions([request('monitor')], model.apply('monitor', 3).map(({ id }) => event(id)))).toEqual([]);
    const refused = model.apply('unknown', 3).map(({ id }) => event(id));
    expect(refused.at(-1)?.eventId).toBe('renal-hypernatremia-action-refused-3');
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
    expect(reportActions(actions, events)).toEqual([{ tick: 3, type: 'renal-hypernatremia-response', outcome: 'accepted', payload: { action: 'monitor' } }]);
    expect(JSON.stringify({ actions, events })).toBe(before);
  });
});

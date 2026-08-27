import { describe, expect, it, vi } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RenalHyperkalemia } from '../../src/modules/renal-electrolyte/hyperkalemia';
import { renalHyperkalemiaReportActions as reportActions } from '../../src/modules/renal-electrolyte/hyperkalemia-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'renal-hyperkalemia-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `renal-hyperkalemia-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RenalHyperkalemia reports require uniquely attributable action outcomes', () => {
  it.each([
    ['shift', 'shifting-care', 'accepted'], ['call-support', 'support', 'accepted'],
    ['review-context', 'context-review', 'accepted'], ['plan-removal', 'removal-plan', 'accepted'], ['deliver-removal', 'removal-care', 'accepted'], ['calcium', 'calcium-care', 'accepted'], ['check-ecg', 'ecg-check', 'accepted'],
    ['monitor', 'monitoring', 'accepted'], ['check-glucose', 'glucose-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'], ['reassess', 'rebound-reassessment', 'accepted'],
    ['reassess', 'shift-reassessment', 'accepted'], ['reassess', 'removal-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'], ['handoff', 'handoff-refused', 'refused'],
    ['ecg-resolved', 'ecg-resolution-refused', 'refused'], ['stop-glucose-monitoring', 'glucose-monitoring-stop-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'renal-hyperkalemia-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes restoration, observation, and refusals at one tick', () => {
    const model = new RenalHyperkalemia();
    const actions = ['shift', 'ecg-resolved', 'check-glucose', 'stop-glucose-monitoring'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map(({ outcome }) => outcome)).toEqual(['accepted', 'refused', 'accepted', 'refused']);
  });

  it('omits missing, unrelated, wrong-tick, shared, and automatic checkpoint events', () => {
    for (const events of [[], [event('monitoring', 4)], [event('monitoring-duplicate')], [event('action-refused')],
      [event('glucose-monitoring-stop-refused')], [event('early-response-checkpoint')], [{ ...event('monitoring'), tick: 4 }]]) {
      expect(reportActions([request('monitor')], events)).toEqual([]);
    }
    const model = new RenalHyperkalemia(); model.apply('monitor', 0);
    expect(reportActions([request('monitor')], model.apply('monitor', 3).map(({ id }) => event(id)))).toEqual([]);
    const refused = model.apply('unknown', 3).map(({ id }) => event(id));
    expect(refused.at(-1)?.eventId).toBe('renal-hyperkalemia-action-refused-3');
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
    const inherited = Object.create({ action: 'monitor' });
    const actions: LearnerAction[] = [request('private-value'), request('monitor', NaN), request('monitor', -1),
      request('monitor', 1.5), { ...request('monitor'), type: 'give-drug' },
      ...[accessor, inherited, { action: 'monitor', notes: 'private-value' },
        { action: 'monitor', [Symbol('private')]: true }, ['monitor'], null].map((payload) => ({ ...request('monitor'), payload } as LearnerAction))];
    expect(reportActions(actions, [event('monitoring')])).toEqual([]); expect(getter).not.toHaveBeenCalled();
  });

  it('preserves input history and omits event prose and structured private values', () => {
    const actions = [request('monitor')]; const events = [{ ...event('monitoring'), data: { privateValue: 'not for submission' } }];
    const before = JSON.stringify({ actions, events });
    expect(reportActions(actions, events)).toEqual([{ tick: 3, type: 'renal-hyperkalemia-response', outcome: 'accepted', payload: { action: 'monitor' } }]);
    expect(JSON.stringify({ actions, events })).toBe(before);
  });
});

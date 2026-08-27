import { describe, expect, it, vi } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { Refeeding } from '../../src/modules/endocrine-metabolic/refeeding';
import { refeedingReportActions as reportActions } from '../../src/modules/endocrine-metabolic/refeeding-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'refeeding-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `refeeding-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('Refeeding reports require uniquely attributable action outcomes', () => {
  it.each([
    ['call-support', 'support', 'accepted'], ['review-context', 'context-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'], ['thiamine', 'thiamine', 'accepted'],
    ['replace-electrolytes', 'electrolyte-replacement', 'accepted'], ['review-nutrition', 'nutrition-review', 'accepted'],
    ['phosphate-only', 'phosphate-only', 'accepted'], ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'electrolyte-reassessment', 'accepted'], ['reassess', 'recurrent-reassessment', 'accepted'],
    ['reassess', 'complete-electrolyte-reassessment', 'accepted'],
    ['reassess', 'response-reassessment', 'accepted'], ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'], ['advance-feeding', 'feeding-advance-refused', 'refused'],
    ['stop-monitoring', 'monitoring-stop-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'refeeding-response', payload: { action }, outcome },
    ]);
  });

  it('keeps partial care accepted and independently attributes same-tick refusals', () => {
    const model = new Refeeding();
    const actions = ['phosphate-only', 'advance-feeding', 'replace-electrolytes', 'stop-monitoring'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map(({ outcome }) => outcome)).toEqual(['accepted', 'refused', 'accepted', 'refused']);
  });

  it('omits missing, unrelated, wrong-tick, shared, and automatic checkpoint events', () => {
    for (const events of [[], [event('monitoring', 4)], [event('monitoring-duplicate')], [event('action-refused')],
      [event('monitoring-stop-refused')], [event('electrolyte-checkpoint')], [{ ...event('monitoring'), tick: 4 }]]) {
      expect(reportActions([request('monitor')], events)).toEqual([]);
    }
    const model = new Refeeding(); model.apply('replace-electrolytes', 0);
    const refused = model.apply('phosphate-only', 3).map(({ id }) => event(id));
    expect(refused.at(-1)?.eventId).toBe('refeeding-action-refused-3');
    expect(reportActions([request('phosphate-only')], refused)).toEqual([]);
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
    expect(reportActions(actions, events)).toEqual([{ tick: 3, type: 'refeeding-response', outcome: 'accepted', payload: { action: 'monitor' } }]);
    expect(JSON.stringify({ actions, events })).toBe(before);
  });
});

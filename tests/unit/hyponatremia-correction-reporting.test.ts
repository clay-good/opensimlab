import { describe, expect, it, vi } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { hyponatremiaCorrectionReportActions as reportActions } from '../../src/modules/endocrine-metabolic/hyponatremia-correction-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'hyponatremia-correction-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `sodium-correction-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose must not leave the session.' });

describe('sodium reports require unambiguous action-specific outcome evidence', () => {
  it.each([
    ['call-support', 'support', 'accepted'], ['review-risk', 'risk-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'], ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'aquaresis-reassessment', 'accepted'], ['reassess', 'overcorrection-reassessment', 'accepted'],
    ['reassess', 'response-reassessment', 'accepted'], ['control-water-loss', 'water-loss-control', 'accepted'],
    ['control-water-loss', 'control-review-refused', 'refused'], ['relower', 'relowering', 'accepted'],
    ['relower', 'relowering-review-refused', 'refused'], ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'], ['normalize-now', 'normalization-refused', 'refused'],
    ['wait-for-symptoms', 'symptom-wait-choice', 'accepted'],
  ] as const)('matches only %s to its %s evidence', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'hyponatremia-correction-response', payload: { action }, outcome },
    ]);
  });

  it('does not use missing, unrelated, wrong-tick, or shared-refusal evidence', () => {
    for (const events of [[], [event('monitoring', 4)], [event('monitoring-duplicate')],
      [event('action-refused')], [event('normalization-refused')], [{ ...event('monitoring'), tick: 4 }]]) {
      expect(reportActions([request('monitor')], events)).toEqual([]);
    }
    expect(reportActions([request('wait-for-symptoms')], [event('action-refused')])).toEqual([]);
  });

  it('does not let an unrelated same-tick refusal override a matching accepted event', () => {
    expect(reportActions([request('monitor'), request('normalize-now')],
      [event('normalization-refused'), event('monitoring')]).map(({ outcome }) => outcome)).toEqual(['accepted', 'refused']);
  });

  it('omits repeated requests, duplicate events, and conflicting outcome events', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor')], [event('monitoring'), event('monitoring')])).toEqual([]);
    expect(reportActions([request('control-water-loss')], [event('water-loss-control'), event('control-review-refused')])).toEqual([]);
  });

  it('counts duplicates in the full recorder before selecting the last twenty requests', () => {
    const actions = [request('monitor'), ...Array.from({ length: 19 }, () => ({
      tick: 3, type: 'silence-alarm', payload: { alarmId: 'private-value' },
    })), request('monitor')];
    expect(actions).toHaveLength(21);
    expect(reportActions(actions, [event('monitoring')])).toEqual([]);
  });

  it('does not reach beyond the last twenty requests to fill omitted entries', () => {
    const actions = Array.from({ length: 21 }, (_, tick) => request('reassess', tick));
    expect(reportActions(actions, [event('initial-reassessment', 0)])).toEqual([]);
    const result = reportActions(actions, actions.map(({ tick }) => event('initial-reassessment', tick)));
    expect(result).toHaveLength(20); expect(result[0]?.tick).toBe(1);
  });

  it('excludes malformed, generic, inherited, and accessor payloads without reading private data', () => {
    const getter = vi.fn(() => 'monitor');
    const accessor = Object.defineProperty({}, 'action', { enumerable: true, get: getter });
    const inherited = Object.assign(Object.create({ action: 'monitor' }) as Record<string, string>, { notes: 'private-value' });
    const actions: LearnerAction[] = [
      { ...request('monitor'), payload: { action: 'monitor', notes: 'private-value' } },
      request('private-value'), { ...request('monitor'), type: 'give-drug' },
      { ...request('monitor'), payload: accessor }, { ...request('monitor'), payload: inherited },
      request('monitor', NaN), request('monitor', -1), request('monitor', 1.5),
    ];
    expect(reportActions(actions, [event('monitoring')])).toEqual([]);
    expect(getter).not.toHaveBeenCalled();
  });

  it('does not mutate history or transmit event prose or structured private data', () => {
    const actions = [request('monitor')];
    const events = [{ ...event('monitoring'), data: { notes: 'private-value', sodium: 116 } }];
    const before = JSON.stringify({ actions, events });
    expect(reportActions(actions, events)).toEqual([
      { tick: 3, type: 'hyponatremia-correction-response', outcome: 'accepted', payload: { action: 'monitor' } },
    ]);
    expect(JSON.stringify({ actions, events })).toBe(before);
  });
});

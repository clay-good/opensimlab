/**
 * A problem report may carry what the learner chose, never what the engine said.
 *
 * The mapping is only safe while every declared choice has exactly one outcome event it can be
 * attributed to. A choice that shares an event id with another, or a choice with no event at
 * all, would either mislabel a report or drop it silently, so both directions are asserted.
 */
import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RenalHypomagnesemia, RENAL_HYPOMAGNESEMIA_ACTIONS } from '../../src/modules/renal-electrolyte/hypomagnesemia';
import { renalHypomagnesemiaReportActions as reportActions } from '../../src/modules/renal-electrolyte/hypomagnesemia-reporting';

const request = (action: string, tick = 3): LearnerAction =>
  ({ tick, type: 'renal-hypomagnesemia-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `renal-hypomagnesemia-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RenalHypomagnesemia reports require uniquely attributable action outcomes', () => {
  it.each([
    ['monitor', 'monitoring', 'accepted'], ['stop-exposure', 'exposure-stopped', 'accepted'],
    ['replace-magnesium', 'repletion', 'accepted'], ['call-support', 'support', 'accepted'],
    ['review-context', 'context-review', 'accepted'], ['review-number', 'number-review', 'accepted'],
    ['check-magnesium', 'magnesium-check', 'accepted'], ['check-potassium', 'potassium-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'], ['reassess', 'untreated-reassessment', 'accepted'],
    ['reassess', 'repletion-reassessment', 'accepted'], ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'], ['potassium-alone', 'potassium-alone-refused', 'refused'],
    ['normal-number-excludes', 'normal-number-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'renal-hypomagnesemia-response', payload: { action }, outcome },
    ]);
  });

  it('carries the choice and never the engine’s prose', () => {
    const context = reportActions([request('review-number')], [event('number-review')]);
    expect(JSON.stringify(context)).not.toContain('Private event prose');
    expect(Object.keys(context[0]!)).toEqual(['tick', 'type', 'payload', 'outcome']);
  });

  it('attributes every declared choice against real engine events', () => {
    const model = new RenalHypomagnesemia();
    const decisions = [[0, 'check-potassium'], [1, 'check-magnesium'], [2, 'monitor'], [3, 'review-number'],
      [4, 'normal-number-excludes'], [5, 'potassium-alone'], [6, 'handoff'], [7, 'replace-magnesium'],
      [8, 'stop-exposure'], [9, 'call-support'], [10, 'review-context'], [11, 'reassess']] as const;
    expect(new Set(decisions.map(([, action]) => action))).toEqual(new Set(RENAL_HYPOMAGNESEMIA_ACTIONS));
    const actions = decisions.map(([tick, action]) => request(action, tick));
    const events = actions.flatMap((action) =>
      model.apply(action.payload.action, action.tick).map(({ id }) => event(id, action.tick)));
    const context = reportActions(actions, events);
    expect(context).toHaveLength(decisions.length);
    expect(context.filter(({ outcome }) => outcome === 'refused').map(({ payload }) => payload.action))
      .toEqual(['normal-number-excludes', 'potassium-alone', 'handoff']);
  });

  it('drops a choice that cannot be told apart from another at the same tick', () => {
    const twice = [request('check-magnesium'), request('check-magnesium')];
    expect(reportActions(twice, [event('magnesium-check')])).toEqual([]);
  });

  it('ignores an action of another type, a bad tick, or a payload with extra keys', () => {
    expect(reportActions([{ tick: 3, type: 'fluid', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: -1, type: 'renal-hypomagnesemia-response', payload: { action: 'monitor' } }],
      [event('monitoring', -1)])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'renal-hypomagnesemia-response',
      payload: { action: 'monitor', extra: 1 } }], [event('monitoring')])).toEqual([]);
  });

  it('ignores a choice that is not one of the declared ones', () => {
    expect(reportActions([request('replace-potassium')], [event('monitoring')])).toEqual([]);
  });
});

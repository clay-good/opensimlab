/**
 * A problem report may carry what the learner chose, never what the engine said.
 *
 * The mapping is only safe while every declared choice has exactly one outcome event it can be
 * attributed to. A choice sharing an event id with another, or one with no event at all, would
 * either mislabel a report or drop it silently, so both directions are asserted.
 */
import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RenalRhabdomyolysis, RENAL_RHABDOMYOLYSIS_ACTIONS } from '../../src/modules/renal-electrolyte/rhabdomyolysis';
import { renalRhabdomyolysisReportActions as reportActions } from '../../src/modules/renal-electrolyte/rhabdomyolysis-reporting';

const request = (action: string, tick = 3): LearnerAction =>
  ({ tick, type: 'renal-rhabdomyolysis-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `renal-rhabdomyolysis-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RenalRhabdomyolysis reports require uniquely attributable action outcomes', () => {
  it.each([
    ['review-cause', 'cause-review', 'accepted'], ['examine-compartments', 'compartment-examination', 'accepted'],
    ['review-number', 'number-review', 'accepted'], ['review-additions', 'additions-review', 'accepted'],
    ['arrange-fluids', 'fluid-ownership', 'accepted'], ['call-support', 'support', 'accepted'],
    ['monitor', 'monitoring', 'accepted'], ['check-creatine-kinase', 'creatine-kinase-check', 'accepted'],
    ['check-renal', 'renal-check', 'accepted'], ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'unexamined-reassessment', 'accepted'], ['reassess', 'serial-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'], ['handoff', 'handoff-refused', 'refused'],
    ['dialyse-on-number', 'dialysis-refused', 'refused'],
    ['add-bicarbonate-and-mannitol', 'additions-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'renal-rhabdomyolysis-response', payload: { action }, outcome },
    ]);
  });

  it('carries the choice and never the engine’s prose', () => {
    const context = reportActions([request('review-number')], [event('number-review')]);
    expect(JSON.stringify(context)).not.toContain('Private event prose');
    expect(Object.keys(context[0]!)).toEqual(['tick', 'type', 'payload', 'outcome']);
  });

  it('attributes every declared choice against real engine events', () => {
    const model = new RenalRhabdomyolysis();
    const decisions = [[0, 'check-creatine-kinase'], [1, 'check-renal'], [2, 'dialyse-on-number'],
      [3, 'add-bicarbonate-and-mannitol'], [4, 'handoff'], [5, 'examine-compartments'],
      [6, 'review-cause'], [7, 'arrange-fluids'], [8, 'review-number'], [9, 'review-additions'],
      [10, 'call-support'], [11, 'monitor'], [12, 'reassess']] as const;
    expect(new Set(decisions.map(([, action]) => action))).toEqual(new Set(RENAL_RHABDOMYOLYSIS_ACTIONS));
    const actions = decisions.map(([tick, action]) => request(action, tick));
    const events = actions.flatMap((action) =>
      model.apply(action.payload.action, action.tick).map(({ id }) => event(id, action.tick)));
    const context = reportActions(actions, events);
    expect(context).toHaveLength(decisions.length);
    expect(context.filter(({ outcome }) => outcome === 'refused').map(({ payload }) => payload.action))
      .toEqual(['dialyse-on-number', 'add-bicarbonate-and-mannitol', 'handoff']);
  });

  it('drops a choice that cannot be told apart from another at the same tick', () => {
    expect(reportActions([request('check-renal'), request('check-renal')], [event('renal-check')])).toEqual([]);
  });

  it('ignores an action of another type, a bad tick, or a payload with extra keys', () => {
    expect(reportActions([{ tick: 3, type: 'fluid', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: -1, type: 'renal-rhabdomyolysis-response', payload: { action: 'monitor' } }],
      [event('monitoring', -1)])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'renal-rhabdomyolysis-response',
      payload: { action: 'monitor', extra: 1 } }], [event('monitoring')])).toEqual([]);
  });

  it('ignores a choice that is not one of the declared ones', () => {
    expect(reportActions([request('fasciotomy')], [event('monitoring')])).toEqual([]);
  });
});

/**
 * A problem report may carry what the learner chose, never what the engine said.
 *
 * The mapping is only safe while every declared choice has exactly one outcome event it can be
 * attributed to. A choice sharing an event id with another, or one with no event at all, would
 * either mislabel a report or drop it silently, so both directions are asserted.
 */
import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RenalPhosphateTarget, RENAL_PHOSPHATE_ACTIONS } from '../../src/modules/renal-electrolyte/phosphate-target';
import { renalPhosphateTargetReportActions as reportActions } from '../../src/modules/renal-electrolyte/phosphate-target-reporting';

const request = (action: string, tick = 3): LearnerAction =>
  ({ tick, type: 'renal-phosphate-target-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `renal-phosphate-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RenalPhosphateTarget reports require uniquely attributable action outcomes', () => {
  it.each([
    ['review-surrogate', 'surrogate-review', 'accepted'], ['review-trial', 'trial-review', 'accepted'],
    ['review-intake', 'intake-review', 'accepted'], ['own-decision', 'decision-owned', 'accepted'],
    ['call-support', 'support', 'accepted'], ['monitor', 'monitoring', 'accepted'],
    ['check-phosphate', 'phosphate-check', 'accepted'], ['check-nutrition', 'nutrition-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'], ['reassess', 'unexamined-reassessment', 'accepted'],
    ['reassess', 'records-reassessment', 'accepted'], ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'], ['treat-the-number', 'treat-the-number-refused', 'refused'],
    ['restrict-further', 'restrict-further-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'renal-phosphate-target-response', payload: { action }, outcome },
    ]);
  });

  it('carries the choice and never the engine’s prose', () => {
    const context = reportActions([request('review-surrogate')], [event('surrogate-review')]);
    expect(JSON.stringify(context)).not.toContain('Private event prose');
    expect(Object.keys(context[0]!)).toEqual(['tick', 'type', 'payload', 'outcome']);
  });

  it('attributes every declared choice against real engine events', () => {
    const model = new RenalPhosphateTarget();
    const decisions = [[0, 'check-phosphate'], [1, 'check-nutrition'], [2, 'treat-the-number'],
      [3, 'restrict-further'], [4, 'handoff'], [5, 'review-surrogate'], [6, 'review-trial'],
      [7, 'review-intake'], [8, 'own-decision'], [9, 'call-support'], [10, 'monitor'],
      [11, 'reassess']] as const;
    expect(new Set(decisions.map(([, action]) => action))).toEqual(new Set(RENAL_PHOSPHATE_ACTIONS));
    const actions = decisions.map(([tick, action]) => request(action, tick));
    const events = actions.flatMap((action) =>
      model.apply(action.payload.action, action.tick).map(({ id }) => event(id, action.tick)));
    const context = reportActions(actions, events);
    expect(context).toHaveLength(decisions.length);
    expect(context.filter(({ outcome }) => outcome === 'refused').map(({ payload }) => payload.action))
      .toEqual(['treat-the-number', 'restrict-further', 'handoff']);
  });

  it('drops a choice that cannot be told apart from another at the same tick', () => {
    expect(reportActions([request('check-phosphate'), request('check-phosphate')],
      [event('phosphate-check')])).toEqual([]);
  });

  it('ignores an action of another type, a bad tick, or a payload with extra keys', () => {
    expect(reportActions([{ tick: 3, type: 'fluid', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: -1, type: 'renal-phosphate-target-response', payload: { action: 'monitor' } }],
      [event('monitoring', -1)])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'renal-phosphate-target-response',
      payload: { action: 'monitor', extra: 1 } }], [event('monitoring')])).toEqual([]);
  });

  it('ignores a choice that is not one of the declared ones', () => {
    expect(reportActions([request('start-sevelamer')], [event('monitoring')])).toEqual([]);
  });
});

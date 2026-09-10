/**
 * A problem report may carry what the learner chose, never what the engine said.
 *
 * The mapping is only safe while every declared choice has exactly one outcome event it can be
 * attributed to. A choice sharing an event id with another, or one with no event at all, would
 * either mislabel a report or drop it silently, so both directions are asserted.
 */
import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RenalProteinuriaRatio, RENAL_PROTEINURIA_ACTIONS } from '../../src/modules/renal-electrolyte/proteinuria-ratio';
import { renalProteinuriaRatioReportActions as reportActions } from '../../src/modules/renal-electrolyte/proteinuria-ratio-reporting';

const request = (action: string, tick = 3): LearnerAction =>
  ({ tick, type: 'renal-proteinuria-ratio-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `renal-proteinuria-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RenalProteinuriaRatio reports require uniquely attributable action outcomes', () => {
  it.each([
    ['compare-variation', 'variation-comparison', 'accepted'], ['review-sampling', 'sampling-review', 'accepted'],
    ['review-patient', 'patient-review', 'accepted'], ['request-repeat', 'repeat-requested', 'accepted'],
    ['own-decision', 'decision-owned', 'accepted'], ['call-support', 'support', 'accepted'],
    ['monitor', 'monitoring', 'accepted'], ['check-ratio', 'ratio-check', 'accepted'],
    ['check-clinical', 'clinical-check', 'accepted'], ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'uncompared-reassessment', 'accepted'], ['reassess', 'repeat-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'], ['handoff', 'handoff-refused', 'refused'],
    ['change-treatment', 'change-treatment-refused', 'refused'],
    ['call-it-progression', 'progression-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'renal-proteinuria-ratio-response', payload: { action }, outcome },
    ]);
  });

  it('carries the choice and never the engine’s prose', () => {
    const context = reportActions([request('compare-variation')], [event('variation-comparison')]);
    expect(JSON.stringify(context)).not.toContain('Private event prose');
    expect(Object.keys(context[0]!)).toEqual(['tick', 'type', 'payload', 'outcome']);
  });

  it('attributes every declared choice against real engine events', () => {
    const model = new RenalProteinuriaRatio();
    const decisions = [[0, 'check-ratio'], [1, 'check-clinical'], [2, 'change-treatment'],
      [3, 'call-it-progression'], [4, 'handoff'], [5, 'compare-variation'], [6, 'review-sampling'],
      [7, 'review-patient'], [8, 'request-repeat'], [9, 'own-decision'], [10, 'call-support'],
      [11, 'monitor'], [12, 'reassess']] as const;
    expect(new Set(decisions.map(([, action]) => action))).toEqual(new Set(RENAL_PROTEINURIA_ACTIONS));
    const actions = decisions.map(([tick, action]) => request(action, tick));
    const events = actions.flatMap((action) =>
      model.apply(action.payload.action, action.tick).map(({ id }) => event(id, action.tick)));
    const context = reportActions(actions, events);
    expect(context).toHaveLength(decisions.length);
    expect(context.filter(({ outcome }) => outcome === 'refused').map(({ payload }) => payload.action))
      .toEqual(['change-treatment', 'call-it-progression', 'handoff']);
  });

  it('drops a choice that cannot be told apart from another at the same tick', () => {
    expect(reportActions([request('check-ratio'), request('check-ratio')], [event('ratio-check')])).toEqual([]);
  });

  it('ignores an action of another type, a bad tick, or a payload with extra keys', () => {
    expect(reportActions([{ tick: 3, type: 'fluid', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: -1, type: 'renal-proteinuria-ratio-response', payload: { action: 'monitor' } }],
      [event('monitoring', -1)])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'renal-proteinuria-ratio-response',
      payload: { action: 'monitor', extra: 1 } }], [event('monitoring')])).toEqual([]);
  });

  it('ignores a choice that is not one of the declared ones', () => {
    expect(reportActions([request('order-biopsy')], [event('monitoring')])).toEqual([]);
  });
});

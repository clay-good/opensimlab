/**
 * A problem report may carry what the learner chose, never what the engine said.
 *
 * The mapping is only safe while every declared choice has exactly one outcome event it can be
 * attributed to. A choice sharing an event id with another, or one with no event at all, would
 * either mislabel a report or drop it silently, so both directions are asserted.
 */
import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RenalContrastAttribution, RENAL_CONTRAST_ACTIONS } from '../../src/modules/renal-electrolyte/contrast-attribution';
import { renalContrastAttributionReportActions as reportActions } from '../../src/modules/renal-electrolyte/contrast-attribution-reporting';

const request = (action: string, tick = 3): LearnerAction =>
  ({ tick, type: 'renal-contrast-attribution-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `renal-contrast-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RenalContrastAttribution reports require uniquely attributable action outcomes', () => {
  it.each([
    ['review-label', 'label-review', 'accepted'], ['review-alternatives', 'alternatives-review', 'accepted'],
    ['review-evidence', 'evidence-review', 'accepted'], ['withdraw-exposures', 'exposures-withdrawn', 'accepted'],
    ['call-support', 'support', 'accepted'], ['monitor', 'monitoring', 'accepted'],
    ['check-creatinine', 'creatinine-check', 'accepted'], ['check-perfusion', 'perfusion-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'], ['reassess', 'unexamined-reassessment', 'accepted'],
    ['reassess', 'record-reassessment', 'accepted'], ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'], ['attribute-to-contrast', 'attribution-refused', 'refused'],
    ['stop-looking', 'stop-looking-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'renal-contrast-attribution-response', payload: { action }, outcome },
    ]);
  });

  it('carries the choice and never the engine’s prose', () => {
    const context = reportActions([request('review-label')], [event('label-review')]);
    expect(JSON.stringify(context)).not.toContain('Private event prose');
    expect(Object.keys(context[0]!)).toEqual(['tick', 'type', 'payload', 'outcome']);
  });

  it('attributes every declared choice against real engine events', () => {
    const model = new RenalContrastAttribution();
    const decisions = [[0, 'check-creatinine'], [1, 'check-perfusion'], [2, 'attribute-to-contrast'],
      [3, 'stop-looking'], [4, 'handoff'], [5, 'review-label'], [6, 'review-alternatives'],
      [7, 'withdraw-exposures'], [8, 'review-evidence'], [9, 'call-support'], [10, 'monitor'],
      [11, 'reassess']] as const;
    expect(new Set(decisions.map(([, action]) => action))).toEqual(new Set(RENAL_CONTRAST_ACTIONS));
    const actions = decisions.map(([tick, action]) => request(action, tick));
    const events = actions.flatMap((action) =>
      model.apply(action.payload.action, action.tick).map(({ id }) => event(id, action.tick)));
    const context = reportActions(actions, events);
    expect(context).toHaveLength(decisions.length);
    expect(context.filter(({ outcome }) => outcome === 'refused').map(({ payload }) => payload.action))
      .toEqual(['attribute-to-contrast', 'stop-looking', 'handoff']);
  });

  it('drops a choice that cannot be told apart from another at the same tick', () => {
    expect(reportActions([request('check-creatinine'), request('check-creatinine')],
      [event('creatinine-check')])).toEqual([]);
  });

  it('ignores an action of another type, a bad tick, or a payload with extra keys', () => {
    expect(reportActions([{ tick: 3, type: 'fluid', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: -1, type: 'renal-contrast-attribution-response', payload: { action: 'monitor' } }],
      [event('monitoring', -1)])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'renal-contrast-attribution-response',
      payload: { action: 'monitor', extra: 1 } }], [event('monitoring')])).toEqual([]);
  });

  it('ignores a choice that is not one of the declared ones', () => {
    expect(reportActions([request('give-contrast')], [event('monitoring')])).toEqual([]);
  });
});

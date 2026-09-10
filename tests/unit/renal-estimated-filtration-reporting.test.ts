/**
 * A problem report may carry what the learner chose, never what the engine said.
 *
 * This lesson has one choice that can be either accepted or refused depending on timing --
 * reviewing the discordance before the marker returns is premature -- so the mapping has to
 * distinguish those two outcomes rather than collapsing them.
 */
import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RenalEstimatedFiltration, RENAL_ESTIMATE_ACTIONS } from '../../src/modules/renal-electrolyte/estimated-filtration';
import { renalEstimatedFiltrationReportActions as reportActions } from '../../src/modules/renal-electrolyte/estimated-filtration-reporting';

const request = (action: string, tick = 3): LearnerAction =>
  ({ tick, type: 'renal-estimated-filtration-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `renal-estimate-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RenalEstimatedFiltration reports require uniquely attributable action outcomes', () => {
  it.each([
    ['review-precision', 'precision-review', 'accepted'], ['review-generation', 'generation-review', 'accepted'],
    ['request-second-marker', 'second-marker-requested', 'accepted'],
    ['review-discordance', 'discordance-review', 'accepted'],
    ['review-discordance', 'discordance-early', 'refused'],
    ['own-medicine-decision', 'medicine-owned', 'accepted'], ['call-support', 'support', 'accepted'],
    ['monitor', 'monitoring', 'accepted'], ['check-creatinine', 'creatinine-check', 'accepted'],
    ['check-second-marker', 'second-marker-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'], ['reassess', 'unreviewed-reassessment', 'accepted'],
    ['reassess', 'discordant-reassessment', 'accepted'], ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'], ['dose-on-estimate', 'dose-refused', 'refused'],
    ['take-the-convenient-number', 'convenient-number-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'renal-estimated-filtration-response', payload: { action }, outcome },
    ]);
  });

  it('carries the choice and never the engine’s prose', () => {
    const context = reportActions([request('review-precision')], [event('precision-review')]);
    expect(JSON.stringify(context)).not.toContain('Private event prose');
    expect(Object.keys(context[0]!)).toEqual(['tick', 'type', 'payload', 'outcome']);
  });

  it('attributes every declared choice against real engine events', () => {
    const model = new RenalEstimatedFiltration();
    const decisions = [[0, 'check-creatinine'], [1, 'check-second-marker'], [2, 'review-discordance'],
      [3, 'dose-on-estimate'], [4, 'take-the-convenient-number'], [5, 'handoff'],
      [6, 'review-precision'], [7, 'review-generation'], [8, 'request-second-marker'],
      [9, 'own-medicine-decision'], [10, 'call-support'], [11, 'monitor'], [12, 'reassess']] as const;
    expect(new Set(decisions.map(([, action]) => action))).toEqual(new Set(RENAL_ESTIMATE_ACTIONS));
    const actions = decisions.map(([tick, action]) => request(action, tick));
    const events = actions.flatMap((action) =>
      model.apply(action.payload.action, action.tick).map(({ id }) => event(id, action.tick)));
    const context = reportActions(actions, events);
    expect(context).toHaveLength(decisions.length);
    // The premature discordance review is reported as the refusal it was.
    expect(context.filter(({ outcome }) => outcome === 'refused').map(({ payload }) => payload.action))
      .toEqual(['review-discordance', 'dose-on-estimate', 'take-the-convenient-number', 'handoff']);
  });

  it('drops a choice that cannot be told apart from another at the same tick', () => {
    expect(reportActions([request('check-creatinine'), request('check-creatinine')],
      [event('creatinine-check')])).toEqual([]);
  });

  it('ignores an action of another type, a bad tick, or a payload with extra keys', () => {
    expect(reportActions([{ tick: 3, type: 'fluid', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: -1, type: 'renal-estimated-filtration-response', payload: { action: 'monitor' } }],
      [event('monitoring', -1)])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'renal-estimated-filtration-response',
      payload: { action: 'monitor', extra: 1 } }], [event('monitoring')])).toEqual([]);
  });

  it('ignores a choice that is not one of the declared ones', () => {
    expect(reportActions([request('measure-filtration')], [event('monitoring')])).toEqual([]);
  });
});

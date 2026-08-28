import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ToxicShock, TOXIC_SHOCK_ACTIONS } from '../../src/modules/infectious-disease/toxic-shock';
import { toxicShockReportActions as reportActions } from '../../src/modules/infectious-disease/toxic-shock-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'toxic-shock-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `toxic-shock-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('ToxicShock reports require uniquely attributable action outcomes', () => {
  it.each([
    ['recognize-toxin-pattern', 'toxin-pattern-recognized', 'accepted'],
    ['activate-critical-care', 'critical-care-activated', 'accepted'],
    ['request-cultures', 'cultures-requested', 'accepted'],
    ['record-treatment-intent', 'treatment-intent', 'accepted'],
    ['record-definition-status', 'definition-status-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-labs', 'lab-check', 'accepted'],
    ['check-perfusion', 'perfusion-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'deteriorated-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['declare-confirmed', 'confirmation-refused', 'refused'],
    ['criteria-count-excludes', 'criteria-exclusion-refused', 'refused'],
    ['pending-cultures-exclude', 'pending-culture-refused', 'refused'],
    ['negative-cultures-mean-no-infection', 'negative-culture-misread-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'toxic-shock-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes activation, observation, and refusals at one tick', () => {
    const model = new ToxicShock();
    const actions = ['activate-critical-care', 'declare-confirmed', 'check-labs', 'criteria-count-excludes']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['activate-critical-care', 'accepted'], ['declare-confirmed', 'refused'],
      ['check-labs', 'accepted'], ['criteria-count-excludes', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'severe-pneumonia-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'toxic-shock-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = TOXIC_SHOCK_ACTIONS.filter((action) => {
      const model = new ToxicShock();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(TOXIC_SHOCK_ACTIONS.length);
  });
});

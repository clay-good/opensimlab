import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { FebrileNeutropenia, FEBRILE_NEUTROPENIA_ACTIONS } from '../../src/modules/infectious-disease/febrile-neutropenia';
import { febrileNeutropeniaReportActions as reportActions } from '../../src/modules/infectious-disease/febrile-neutropenia-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'febrile-neutropenia-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `febrile-neutropenia-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('FebrileNeutropenia reports require uniquely attributable action outcomes', () => {
  it.each([
    ['recognize-neutropenic-fever', 'neutropenic-fever-recognized', 'accepted'],
    ['activate-pathway', 'pathway-activated', 'accepted'],
    ['request-cultures', 'cultures-requested', 'accepted'],
    ['record-antimicrobial-intent', 'antimicrobial-intent', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-labs', 'lab-check', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'untreated-reassessment', 'accepted'],
    ['reassess', 'treated-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['crp-reassures', 'crp-reassurance-refused', 'refused'],
    ['score-defers-antimicrobials', 'score-deferral-refused', 'refused'],
    ['wait-for-source', 'source-wait-refused', 'refused'],
    ['expect-leukocytosis', 'leukocytosis-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'febrile-neutropenia-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes intent, observation, and refusals at one tick', () => {
    const model = new FebrileNeutropenia();
    const actions = ['record-antimicrobial-intent', 'crp-reassures', 'check-labs', 'wait-for-source']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-antimicrobial-intent', 'accepted'], ['crp-reassures', 'refused'],
      ['check-labs', 'accepted'], ['wait-for-source', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'obstructed-kidney-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'febrile-neutropenia-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = FEBRILE_NEUTROPENIA_ACTIONS.filter((action) => {
      const model = new FebrileNeutropenia();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(FEBRILE_NEUTROPENIA_ACTIONS.length);
  });
});

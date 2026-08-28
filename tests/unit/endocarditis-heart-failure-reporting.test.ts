import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { EndocarditisHeartFailure, ENDOCARDITIS_ACTIONS } from '../../src/modules/infectious-disease/endocarditis-heart-failure';
import { endocarditisHeartFailureReportActions as reportActions } from '../../src/modules/infectious-disease/endocarditis-heart-failure-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'endocarditis-heart-failure-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `endocarditis-heart-failure-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('EndocarditisHeartFailure reports require uniquely attributable action outcomes', () => {
  it.each([
    ['recognize-mechanical-failure', 'mechanical-failure-recognized', 'accepted'],
    ['call-endocarditis-team', 'endocarditis-team-activated', 'accepted'],
    ['record-surgical-referral-intent', 'surgical-referral-intent', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-labs', 'lab-check', 'accepted'],
    ['check-perfusion', 'perfusion-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'decompensated-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['markers-improving-means-better', 'marker-reassurance-refused', 'refused'],
    ['wide-pulse-pressure-expected', 'pulse-pressure-error-refused', 'refused'],
    ['vegetation-size-alone-decides', 'vegetation-only-refused', 'refused'],
    ['continue-antimicrobials-and-review-tomorrow', 'deferral-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'endocarditis-heart-failure-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes activation, observation, and refusals at one tick', () => {
    const model = new EndocarditisHeartFailure();
    const actions = ['call-endocarditis-team', 'markers-improving-means-better', 'check-labs', 'deferral-probe']
      .slice(0, 3).concat(['continue-antimicrobials-and-review-tomorrow']).map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['call-endocarditis-team', 'accepted'], ['markers-improving-means-better', 'refused'],
      ['check-labs', 'accepted'], ['continue-antimicrobials-and-review-tomorrow', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'necrotizing-infection-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'endocarditis-heart-failure-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = ENDOCARDITIS_ACTIONS.filter((action) => {
      const model = new EndocarditisHeartFailure();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(ENDOCARDITIS_ACTIONS.length);
  });
});

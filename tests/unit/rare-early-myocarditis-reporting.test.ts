import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RareEarlyMyocarditis } from '../../src/modules/oncology/rare-early-myocarditis';
import { RARE_EARLY_MYOCARDITIS_ACTIONS } from '../../src/modules/oncology/rare-early-myocarditis';
import { rareEarlyMyocarditisReportActions as reportActions } from '../../src/modules/oncology/rare-early-myocarditis-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'rare-early-myocarditis-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `rare-early-myocarditis-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RareEarlyMyocarditis reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-exposure-interval', 'interval-recorded', 'accepted'],
    ['record-what-is-present-that-is-not-cardiac', 'non-cardiac-recorded', 'accepted'],
    ['arrange-continuous-rhythm-monitoring', 'monitoring-arranged', 'accepted'],
    ['escalate-to-both-teams', 'escalation-requested', 'accepted'],
    ['record-bounded-treatment-intent', 'intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-the-supplied-results', 'results-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['it-is-too-rare-to-be-that', 'rarity-refused', 'refused'],
    ['the-troponin-is-raised-in-lots-of-things', 'troponin-refused', 'refused'],
    ['repeat-the-troponin-in-a-week', 'defer-refused', 'refused'],
    ['treat-it-as-a-coronary-syndrome-and-stop-there', 'coronary-only-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'rare-early-myocarditis-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new RareEarlyMyocarditis();
    const actions = ['record-the-exposure-interval', 'it-is-too-rare-to-be-that',
      'check-the-supplied-results', 'repeat-the-troponin-in-a-week'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-exposure-interval', 'accepted'], ['it-is-too-rare-to-be-that', 'refused'],
      ['check-the-supplied-results', 'accepted'], ['repeat-the-troponin-in-a-week', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'laboratory-tls-response', payload: { action: 'monitor' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'rare-early-myocarditis-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = RARE_EARLY_MYOCARDITIS_ACTIONS.filter((action) => {
      const model = new RareEarlyMyocarditis();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(RARE_EARLY_MYOCARDITIS_ACTIONS.length);
  });
});

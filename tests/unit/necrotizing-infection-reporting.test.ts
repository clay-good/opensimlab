import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { NecrotizingInfection, NECROTIZING_INFECTION_ACTIONS } from '../../src/modules/infectious-disease/necrotizing-infection';
import { necrotizingInfectionReportActions as reportActions } from '../../src/modules/infectious-disease/necrotizing-infection-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'necrotizing-infection-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `necrotizing-infection-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('NecrotizingInfection reports require uniquely attributable action outcomes', () => {
  it.each([
    ['recognize-disproportionate-pain', 'disproportionate-pain-recognized', 'accepted'],
    ['mark-the-margin', 'margin-marked', 'accepted'],
    ['call-surgery', 'surgery-activated', 'accepted'],
    ['record-antimicrobial-intent', 'antimicrobial-intent', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-labs', 'lab-check', 'accepted'],
    ['check-limb', 'limb-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'progressed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['score-excludes', 'score-exclusion-refused', 'refused'],
    ['wait-for-imaging', 'imaging-delay-refused', 'refused'],
    ['absent-crepitus-excludes', 'crepitus-exclusion-refused', 'refused'],
    ['continue-oral-antibiotics', 'oral-continuation-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'necrotizing-infection-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes activation, observation, and refusals at one tick', () => {
    const model = new NecrotizingInfection();
    const actions = ['call-surgery', 'score-excludes', 'check-labs', 'wait-for-imaging']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['call-surgery', 'accepted'], ['score-excludes', 'refused'],
      ['check-labs', 'accepted'], ['wait-for-imaging', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'febrile-neutropenia-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'necrotizing-infection-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = NECROTIZING_INFECTION_ACTIONS.filter((action) => {
      const model = new NecrotizingInfection();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(NECROTIZING_INFECTION_ACTIONS.length);
  });
});

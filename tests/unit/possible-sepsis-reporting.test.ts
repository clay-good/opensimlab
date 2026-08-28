import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PossibleSepsis, POSSIBLE_SEPSIS_ACTIONS } from '../../src/modules/infectious-disease/possible-sepsis';
import { possibleSepsisReportActions as reportActions } from '../../src/modules/infectious-disease/possible-sepsis-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'possible-sepsis-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `possible-sepsis-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('PossibleSepsis reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-time-zero', 'time-zero-recorded', 'accepted'],
    ['record-uncertainty', 'uncertainty-recorded', 'accepted'],
    ['request-time-limited-assessment', 'assessment-requested', 'accepted'],
    ['record-antimicrobial-intent', 'antimicrobial-intent', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-labs', 'lab-check', 'accepted'],
    ['check-perfusion', 'perfusion-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'investigated-reassessment', 'accepted'],
    ['reassess', 'shocked-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['wait-and-see', 'wait-refused', 'refused'],
    ['assign-the-tier', 'tier-refused', 'refused'],
    ['single-test-rules-out', 'single-test-refused', 'refused'],
    ['defer-without-a-ceiling', 'deferral-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'possible-sepsis-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, observation, and refusals at one tick', () => {
    const model = new PossibleSepsis();
    const actions = ['record-time-zero', 'wait-and-see', 'check-labs', 'assign-the-tier']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-time-zero', 'accepted'], ['wait-and-see', 'refused'],
      ['check-labs', 'accepted'], ['assign-the-tier', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'toxic-shock-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'possible-sepsis-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = POSSIBLE_SEPSIS_ACTIONS.filter((action) => {
      const model = new PossibleSepsis();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(POSSIBLE_SEPSIS_ACTIONS.length);
  });
});

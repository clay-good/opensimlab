import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { LostContingency, LOST_CONTINGENCY_ACTIONS } from '../../src/modules/medical-surgical-nursing/lost-contingency';
import { lostContingencyReportActions as reportActions } from '../../src/modules/medical-surgical-nursing/lost-contingency-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'lost-contingency-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `lost-contingency-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('LostContingency reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-what-was-said', 'spoken-recorded', 'accepted'],
    ['check-the-notes', 'notes-check', 'accepted'],
    ['record-the-gap-as-a-transmission-gap', 'gap-recorded', 'accepted'],
    ['record-the-gap-as-a-transmission-gap', 'gap-refused', 'refused'],
    ['reconstruct-the-contingency', 'reconstructed', 'accepted'],
    ['reconstruct-the-contingency', 'reconstruct-refused', 'refused'],
    ['record-what-the-gap-changes', 'consequences-recorded', 'accepted'],
    ['record-what-the-gap-changes', 'consequences-refused', 'refused'],
    ['confirm-the-plan-with-the-team', 'confirmation-requested', 'accepted'],
    ['confirm-the-plan-with-the-team', 'confirmation-refused', 'refused'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'confirmed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['nothing-said-means-nothing-applies', 'nothing-applies-refused', 'refused'],
    ['ask-the-day-nurse-to-remember', 'memory-refused', 'refused'],
    ['a-quiet-handover-means-a-stable-patient', 'quiet-refused', 'refused'],
    ['write-a-plan-of-my-own', 'own-plan-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'lost-contingency-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes reading, recording, and refusals at one tick', () => {
    const model = new LostContingency();
    const actions = ['record-what-was-said', 'write-a-plan-of-my-own', 'check-the-notes', 'ask-the-day-nurse-to-remember']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-what-was-said', 'accepted'], ['write-a-plan-of-my-own', 'refused'],
      ['check-the-notes', 'accepted'], ['ask-the-day-nurse-to-remember', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'oxygen-target-scale-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'lost-contingency-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = LOST_CONTINGENCY_ACTIONS.filter((action) => {
      const model = new LostContingency();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(LOST_CONTINGENCY_ACTIONS.length);
  });
});

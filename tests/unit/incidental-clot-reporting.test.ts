import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { IncidentalClot } from '../../src/modules/oncology/incidental-clot';
import { INCIDENTAL_CLOT_ACTIONS } from '../../src/modules/oncology/incidental-clot';
import { incidentalClotReportActions as reportActions } from '../../src/modules/oncology/incidental-clot-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'incidental-clot-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `incidental-clot-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('IncidentalClot reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-finding-and-how-it-was-found', 'finding-recorded', 'accepted'],
    ['record-the-certainty-of-the-recommendation', 'certainty-recorded', 'accepted'],
    ['record-the-benefit-and-the-harm-together', 'tradeoff-recorded', 'accepted'],
    ['record-this-patients-bleeding-risk', 'bleeding-risk-recorded', 'accepted'],
    ['escalate-to-the-treating-service', 'escalation-requested', 'accepted'],
    ['record-the-decision-as-shared', 'shared-decision-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-the-report', 'report-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['incidental-so-no-action-needed', 'dismissal-refused', 'refused'],
    ['a-pe-is-a-pe-so-anticoagulate-now', 'reflex-refused', 'refused'],
    ['wait-for-symptoms-before-deciding', 'wait-refused', 'refused'],
    ['leave-it-for-the-clinic-letter', 'defer-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'incidental-clot-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new IncidentalClot();
    const actions = ['record-the-finding-and-how-it-was-found', 'incidental-so-no-action-needed',
      'check-the-report', 'leave-it-for-the-clinic-letter'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-finding-and-how-it-was-found', 'accepted'], ['incidental-so-no-action-needed', 'refused'],
      ['check-the-report', 'accepted'], ['leave-it-for-the-clinic-letter', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'delayed-immune-event-response', payload: { action: 'monitor' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'incidental-clot-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = INCIDENTAL_CLOT_ACTIONS.filter((action) => {
      const model = new IncidentalClot();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(INCIDENTAL_CLOT_ACTIONS.length);
  });
});

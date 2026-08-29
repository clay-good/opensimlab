import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { NormalTestToxicity } from '../../src/modules/oncology/normal-test-toxicity';
import { NORMAL_TEST_TOXICITY_ACTIONS } from '../../src/modules/oncology/normal-test-toxicity';
import { normalTestToxicityReportActions as reportActions } from '../../src/modules/oncology/normal-test-toxicity-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'normal-test-toxicity-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `normal-test-toxicity-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('NormalTestToxicity reports require uniquely attributable action outcomes', () => {
  it.each([
    ['withhold-the-drug-now', 'drug-withheld', 'accepted'],
    ['record-what-the-normal-test-does-not-exclude', 'exclusions-recorded', 'accepted'],
    ['record-the-toxicity-and-its-severity', 'toxicity-recorded', 'accepted'],
    ['escalate-to-acute-oncology', 'escalation-requested', 'accepted'],
    ['record-bounded-supportive-intent', 'supportive-intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-the-treatment-record', 'treatment-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['the-test-was-normal-so-not-the-drug', 'test-exclusion-refused', 'refused'],
    ['wait-for-oncology-before-stopping', 'wait-refused', 'refused'],
    ['advise-him-to-halve-the-dose', 'dose-advice-refused', 'refused'],
    ['treat-the-symptoms-and-review-tomorrow', 'symptomatic-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'normal-test-toxicity-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new NormalTestToxicity();
    const actions = ['withhold-the-drug-now', 'the-test-was-normal-so-not-the-drug',
      'check-the-treatment-record', 'advise-him-to-halve-the-dose'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['withhold-the-drug-now', 'accepted'], ['the-test-was-normal-so-not-the-drug', 'refused'],
      ['check-the-treatment-record', 'accepted'], ['advise-him-to-halve-the-dose', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'incidental-clot-response', payload: { action: 'monitor' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'normal-test-toxicity-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = NORMAL_TEST_TOXICITY_ACTIONS.filter((action) => {
      const model = new NormalTestToxicity();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(NORMAL_TEST_TOXICITY_ACTIONS.length);
  });
});

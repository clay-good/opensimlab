import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { TrialRule } from '../../src/modules/oncology/trial-rule';
import { TRIAL_RULE_ACTIONS } from '../../src/modules/oncology/trial-rule';
import { trialRuleReportActions as reportActions } from '../../src/modules/oncology/trial-rule-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'trial-rule-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `trial-rule-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('TrialRule reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-clinical-trajectory-not-just-the-scan', 'trajectory-recorded', 'accepted'],
    ['record-what-the-criteria-do-and-do-not-govern', 'governance-recorded', 'accepted'],
    ['escalate-to-the-treating-team-now', 'escalation-requested', 'accepted'],
    ['record-bounded-treatment-intent', 'intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-the-supplied-imaging-report', 'imaging-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['call-it-pseudoprogression-and-continue', 'pseudoprogression-refused', 'refused'],
    ['stop-the-immunotherapy-and-tell-her-it-failed', 'stop-refused', 'refused'],
    ['the-scan-alone-decides', 'scan-only-refused', 'refused'],
    ['rescan-in-eight-weeks-and-review-then', 'wait-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'trial-rule-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new TrialRule();
    const actions = ['record-the-clinical-trajectory-not-just-the-scan', 'the-scan-alone-decides',
      'check-the-supplied-imaging-report', 'rescan-in-eight-weeks-and-review-then'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-clinical-trajectory-not-just-the-scan', 'accepted'], ['the-scan-alone-decides', 'refused'],
      ['check-the-supplied-imaging-report', 'accepted'], ['rescan-in-eight-weeks-and-review-then', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'inherited-urgency-response', payload: { action: 'review-boundaries' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'trial-rule-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = TRIAL_RULE_ACTIONS.filter((action) => {
      const model = new TrialRule();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(TRIAL_RULE_ACTIONS.length);
  });
});

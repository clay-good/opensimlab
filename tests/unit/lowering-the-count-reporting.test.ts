import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { LoweringTheCount } from '../../src/modules/oncology/lowering-the-count';
import { LOWERING_THE_COUNT_ACTIONS } from '../../src/modules/oncology/lowering-the-count';
import { loweringTheCountReportActions as reportActions } from '../../src/modules/oncology/lowering-the-count-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'lowering-the-count-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `lowering-the-count-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('LoweringTheCount reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-clinical-picture-not-the-count', 'picture-recorded', 'accepted'],
    ['record-what-the-count-does-and-does-not-license', 'licence-recorded', 'accepted'],
    ['escalate-to-haematology-now', 'escalation-requested', 'accepted'],
    ['record-bounded-cytoreduction-intent', 'intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-the-supplied-results', 'results-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['send-him-for-apheresis-and-stand-down', 'apheresis-refused', 'refused'],
    ['the-count-alone-makes-the-diagnosis', 'count-only-refused', 'refused'],
    ['wait-for-the-marrow-before-calling', 'wait-refused', 'refused'],
    ['treat-the-confusion-as-delirium', 'delirium-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'lowering-the-count-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new LoweringTheCount();
    const actions = ['record-the-clinical-picture-not-the-count', 'the-count-alone-makes-the-diagnosis',
      'check-the-supplied-results', 'wait-for-the-marrow-before-calling'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-clinical-picture-not-the-count', 'accepted'], ['the-count-alone-makes-the-diagnosis', 'refused'],
      ['check-the-supplied-results', 'accepted'], ['wait-for-the-marrow-before-calling', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'rare-early-myocarditis-response', payload: { action: 'monitor' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'lowering-the-count-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = LOWERING_THE_COUNT_ACTIONS.filter((action) => {
      const model = new LoweringTheCount();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(LOWERING_THE_COUNT_ACTIONS.length);
  });
});

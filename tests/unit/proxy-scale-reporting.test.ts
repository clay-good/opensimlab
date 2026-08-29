import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ProxyScale, PROXY_SCALE_ACTIONS } from '../../src/modules/medical-surgical-nursing/proxy-scale';
import { proxyScaleReportActions as reportActions } from '../../src/modules/medical-surgical-nursing/proxy-scale-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'proxy-scale-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `proxy-scale-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('ProxyScale reports require uniquely attributable action outcomes', () => {
  it.each([
    ['attempt-self-report', 'self-report-attempted', 'accepted'],
    ['record-the-observed-behaviours', 'behaviours-recorded', 'accepted'],
    ['record-the-observed-behaviours', 'behaviours-refused', 'refused'],
    ['record-what-the-score-is-not', 'limits-recorded', 'accepted'],
    ['record-what-the-score-is-not', 'limits-refused', 'refused'],
    ['seek-the-proxy-history', 'proxy-recorded', 'accepted'],
    ['seek-the-proxy-history', 'proxy-refused', 'refused'],
    ['record-analgesic-intent', 'analgesic-intent', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-behaviours', 'behaviour-check', 'accepted'],
    ['check-context', 'context-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'proxy-available-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['read-four-as-four-out-of-ten', 'intensity-refused', 'refused'],
    ['vitals-confirm-the-pain', 'vitals-refused', 'refused'],
    ['zero-would-mean-comfortable', 'zero-refused', 'refused'],
    ['wait-until-they-ask', 'waiting-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'proxy-scale-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes reading, checking, and refusals at one tick', () => {
    const model = new ProxyScale();
    const actions = ['attempt-self-report', 'read-four-as-four-out-of-ten', 'check-behaviours', 'vitals-confirm-the-pain']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['attempt-self-report', 'accepted'], ['read-four-as-four-out-of-ten', 'refused'],
      ['check-behaviours', 'accepted'], ['vitals-confirm-the-pain', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'possible-sepsis-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'proxy-scale-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = PROXY_SCALE_ACTIONS.filter((action) => {
      const model = new ProxyScale();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(PROXY_SCALE_ACTIONS.length);
  });
});

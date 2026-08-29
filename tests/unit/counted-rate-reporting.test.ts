import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { CountedRate, COUNTED_RATE_ACTIONS } from '../../src/modules/medical-surgical-nursing/counted-rate';
import { countedRateReportActions as reportActions } from '../../src/modules/medical-surgical-nursing/counted-rate-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'counted-rate-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `counted-rate-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('CountedRate reports require uniquely attributable action outcomes', () => {
  it.each([
    ['review-the-charted-trend', 'trend-reviewed', 'accepted'],
    ['count-for-a-full-minute', 'counted', 'accepted'],
    ['record-the-discrepancy', 'discrepancy-recorded', 'accepted'],
    ['record-the-discrepancy', 'discrepancy-refused', 'refused'],
    ['escalate-on-the-counted-value', 'escalation-requested', 'accepted'],
    ['escalate-on-the-counted-value', 'escalation-refused', 'refused'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-chart', 'chart-check', 'accepted'],
    ['check-patient', 'patient-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['trust-the-flat-trend', 'trend-refused', 'refused'],
    ['chart-the-monitor-value', 'monitor-refused', 'refused'],
    ['round-to-the-previous-entry', 'rounding-refused', 'refused'],
    ['correct-the-earlier-entries', 'retrospective-edit-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'counted-rate-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes reading, checking, and refusals at one tick', () => {
    const model = new CountedRate();
    const actions = ['review-the-charted-trend', 'trust-the-flat-trend', 'check-chart', 'correct-the-earlier-entries']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['review-the-charted-trend', 'accepted'], ['trust-the-flat-trend', 'refused'],
      ['check-chart', 'accepted'], ['correct-the-earlier-entries', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'possible-sepsis-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'counted-rate-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = COUNTED_RATE_ACTIONS.filter((action) => {
      const model = new CountedRate();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(COUNTED_RATE_ACTIONS.length);
  });
});

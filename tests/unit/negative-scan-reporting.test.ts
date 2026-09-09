import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { NegativeScan, NEGATIVE_SCAN_ACTIONS } from '../../src/modules/surgery-trauma/negative-scan';
import { negativeScanReportActions as reportActions } from '../../src/modules/surgery-trauma/negative-scan-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'negative-scan-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `negative-scan-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('NegativeScan reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-operative-course', 'operative-course-recorded', 'accepted'],
    ['record-the-failure-to-progress', 'progress-recorded', 'accepted'],
    ['record-what-the-scan-excludes', 'scan-limits-recorded', 'accepted'],
    ['escalate-to-the-operating-team', 'escalation-requested', 'accepted'],
    ['record-bounded-surgical-intent', 'surgical-intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-operative-record', 'operative-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['the-scan-was-negative-so-it-is-not-a-leak', 'scan-exclusion-refused', 'refused'],
    ['abnormal-vitals-are-routine-after-bowel-surgery', 'routine-dismissal-refused', 'refused'],
    ['repeat-the-scan-tomorrow-and-review-then', 'rescan-deferral-refused', 'refused'],
    ['treat-the-numbers-and-watch-overnight', 'treat-the-numbers-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'negative-scan-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new NegativeScan();
    const actions = ['record-the-operative-course', 'the-scan-was-negative-so-it-is-not-a-leak',
      'check-operative-record', 'treat-the-numbers-and-watch-overnight'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-operative-course', 'accepted'], ['the-scan-was-negative-so-it-is-not-a-leak', 'refused'],
      ['check-operative-record', 'accepted'], ['treat-the-numbers-and-watch-overnight', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'low-score-response', payload: { action: 'monitor' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'negative-scan-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = NEGATIVE_SCAN_ACTIONS.filter((action) => {
      const model = new NegativeScan();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(NEGATIVE_SCAN_ACTIONS.length);
  });
});

import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PairedReading, PAIRED_READING_ACTIONS } from '../../src/modules/medical-surgical-nursing/paired-reading';
import { pairedReadingReportActions as reportActions } from '../../src/modules/medical-surgical-nursing/paired-reading-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'paired-reading-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `paired-reading-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('PairedReading reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-oximeter-reading', 'oximeter-recorded', 'accepted'],
    ['record-the-paired-values', 'paired-recorded', 'accepted'],
    ['record-the-paired-values', 'pairing-refused', 'refused'],
    ['record-what-the-gap-is-not', 'gap-explained', 'accepted'],
    ['record-what-the-gap-is-not', 'explanation-refused', 'refused'],
    ['escalate-on-the-arterial-value', 'escalation-requested', 'accepted'],
    ['escalate-on-the-arterial-value', 'escalation-refused', 'refused'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-oximeter', 'oximeter-check', 'accepted'],
    ['check-patient', 'patient-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'paired-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['reposition-the-probe', 'reposition-refused', 'refused'],
    ['warm-the-hand', 'warming-refused', 'refused'],
    ['trust-the-oximeter-trend', 'trend-refused', 'refused'],
    ['the-device-standard-was-fixed', 'standard-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'paired-reading-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes reading, checking, and refusals at one tick', () => {
    const model = new PairedReading();
    const actions = ['record-the-oximeter-reading', 'reposition-the-probe', 'check-oximeter', 'warm-the-hand']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-oximeter-reading', 'accepted'], ['reposition-the-probe', 'refused'],
      ['check-oximeter', 'accepted'], ['warm-the-hand', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'possible-sepsis-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'paired-reading-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = PAIRED_READING_ACTIONS.filter((action) => {
      const model = new PairedReading();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(PAIRED_READING_ACTIONS.length);
  });
});

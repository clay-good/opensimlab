import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { QuietPatient, QUIET_PATIENT_ACTIONS } from '../../src/modules/medical-surgical-nursing/quiet-patient';
import { quietPatientReportActions as reportActions } from '../../src/modules/medical-surgical-nursing/quiet-patient-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'quiet-patient-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `quiet-patient-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('QuietPatient reports require uniquely attributable action outcomes', () => {
  it.each([
    ['review-the-charted-impression', 'impressions-reviewed', 'accepted'],
    ['screen-for-arousal', 'screened', 'accepted'],
    ['record-the-screen-result', 'result-recorded', 'accepted'],
    ['record-the-screen-result', 'result-refused', 'refused'],
    ['escalate-on-the-positive-screen', 'escalation-requested', 'accepted'],
    ['escalate-on-the-positive-screen', 'escalation-refused', 'refused'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-chart', 'chart-check', 'accepted'],
    ['check-patient', 'patient-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'screened-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['let-them-sleep-and-screen-later', 'deferral-refused', 'refused'],
    ['quiet-is-settled', 'quiet-refused', 'refused'],
    ['negative-earlier-screen-excludes', 'earlier-screen-refused', 'refused'],
    ['call-it-low-mood', 'mood-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'quiet-patient-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes reading, checking, and refusals at one tick', () => {
    const model = new QuietPatient();
    const actions = ['review-the-charted-impression', 'quiet-is-settled', 'check-chart', 'call-it-low-mood']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['review-the-charted-impression', 'accepted'], ['quiet-is-settled', 'refused'],
      ['check-chart', 'accepted'], ['call-it-low-mood', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'possible-sepsis-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'quiet-patient-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = QUIET_PATIENT_ACTIONS.filter((action) => {
      const model = new QuietPatient();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(QUIET_PATIENT_ACTIONS.length);
  });
});

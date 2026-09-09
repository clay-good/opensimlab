import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ThirdAttendance, THIRD_ATTENDANCE_ACTIONS } from '../../src/modules/surgery-trauma/third-attendance';
import { thirdAttendanceReportActions as reportActions } from '../../src/modules/surgery-trauma/third-attendance-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'third-attendance-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `third-attendance-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('ThirdAttendance reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-attendances-and-what-each-found', 'attendances-recorded', 'accepted'],
    ['record-what-a-previous-assessment-can-say', 'prior-limits-recorded', 'accepted'],
    ['record-what-has-changed-since-the-last-visit', 'change-recorded', 'accepted'],
    ['escalate-to-the-surgical-team', 'escalation-requested', 'accepted'],
    ['record-bounded-assessment-intent', 'assessment-intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-attendance-record', 'attendance-record-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['she-has-been-seen-twice-already', 'seen-twice-refused', 'refused'],
    ['the-notes-say-it-was-settling', 'settling-claim-refused', 'refused'],
    ['she-is-anxious-and-keeps-coming-back', 'anxious-claim-refused', 'refused'],
    ['discharge-her-with-the-same-advice-again', 'same-advice-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'third-attendance-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new ThirdAttendance();
    const actions = ['record-the-attendances-and-what-each-found', 'the-notes-say-it-was-settling',
      'check-attendance-record', 'she-is-anxious-and-keeps-coming-back'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-attendances-and-what-each-found', 'accepted'], ['the-notes-say-it-was-settling', 'refused'],
      ['check-attendance-record', 'accepted'], ['she-is-anxious-and-keeps-coming-back', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'unowned-delay-response', payload: { action: 'review-boundaries' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'third-attendance-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = THIRD_ATTENDANCE_ACTIONS.filter((action) => {
      const model = new ThirdAttendance();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(THIRD_ATTENDANCE_ACTIONS.length);
  });
});

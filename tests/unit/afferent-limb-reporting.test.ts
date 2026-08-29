import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { AfferentLimb, AFFERENT_LIMB_ACTIONS } from '../../src/modules/medical-surgical-nursing/afferent-limb';
import { afferentLimbReportActions as reportActions } from '../../src/modules/medical-surgical-nursing/afferent-limb-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'afferent-limb-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `afferent-limb-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('AfferentLimb reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-met-criteria', 'criteria-recorded', 'accepted'],
    ['record-the-obstacles', 'obstacles-recorded', 'accepted'],
    ['call-the-response-team', 'team-called', 'accepted'],
    ['state-the-concern-explicitly', 'concern-stated', 'accepted'],
    ['state-the-concern-explicitly', 'statement-refused', 'refused'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-criteria', 'criteria-check', 'accepted'],
    ['check-availability', 'availability-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'attended-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['call-the-doctor-first', 'doctor-first-refused', 'refused'],
    ['wait-for-the-ward-round', 'round-refused', 'refused'],
    ['document-and-wait', 'documentation-refused', 'refused'],
    ['ask-permission-to-call', 'permission-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'afferent-limb-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes reading, checking, and refusals at one tick', () => {
    const model = new AfferentLimb();
    const actions = ['record-the-met-criteria', 'call-the-doctor-first', 'check-criteria', 'ask-permission-to-call']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-met-criteria', 'accepted'], ['call-the-doctor-first', 'refused'],
      ['check-criteria', 'accepted'], ['ask-permission-to-call', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'possible-sepsis-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'afferent-limb-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = AFFERENT_LIMB_ACTIONS.filter((action) => {
      const model = new AfferentLimb();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(AFFERENT_LIMB_ACTIONS.length);
  });
});

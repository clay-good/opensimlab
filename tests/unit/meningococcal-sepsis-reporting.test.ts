import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { MeningococcalSepsis, MENINGOCOCCAL_SEPSIS_ACTIONS } from '../../src/modules/infectious-disease/meningococcal-sepsis';
import { meningococcalSepsisReportActions as reportActions } from '../../src/modules/infectious-disease/meningococcal-sepsis-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'meningococcal-sepsis-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `meningococcal-sepsis-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('MeningococcalSepsis reports require uniquely attributable action outcomes', () => {
  it.each([
    ['recognize-rash', 'rash-recognition', 'accepted'], ['call-senior', 'senior-ownership', 'accepted'],
    ['request-bloods', 'bloods-requested', 'accepted'],
    ['record-antimicrobial-intent', 'antimicrobial-intent', 'accepted'],
    ['record-fluid-intent', 'fluid-and-critical-care-intent', 'accepted'],
    ['escalate-consultant', 'consultant-attendance', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'], ['monitor', 'monitoring', 'accepted'],
    ['check-labs', 'lab-check', 'accepted'], ['check-perfusion', 'perfusion-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'], ['reassess', 'treated-reassessment', 'accepted'],
    ['reassess', 'incomplete-response-reassessment', 'accepted'], ['reassess', 'attendance-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'], ['handoff', 'handoff-refused', 'refused'],
    ['normal-markers-exclude', 'marker-exclusion-refused', 'refused'],
    ['vaccination-excludes', 'vaccination-exclusion-refused', 'refused'],
    ['delay-transfer-for-antibiotics', 'transfer-delay-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'meningococcal-sepsis-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes intent, observation, and refusals at one tick', () => {
    const model = new MeningococcalSepsis();
    const actions = ['record-antimicrobial-intent', 'normal-markers-exclude', 'check-labs', 'vaccination-excludes']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-antimicrobial-intent', 'accepted'], ['normal-markers-exclude', 'refused'],
      ['check-labs', 'accepted'], ['vaccination-excludes', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    const actions = [request('monitor'), request('monitor')];
    expect(reportActions(actions, [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'renal-hypermagnesemia-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'meningococcal-sepsis-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const injected = { tick: 3, type: 'meningococcal-sepsis-response',
      payload: { action: 'monitor' } } satisfies LearnerAction;
    const [entry] = reportActions([injected], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = MENINGOCOCCAL_SEPSIS_ACTIONS.filter((action) => {
      const model = new MeningococcalSepsis();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(MENINGOCOCCAL_SEPSIS_ACTIONS.length);
  });
});

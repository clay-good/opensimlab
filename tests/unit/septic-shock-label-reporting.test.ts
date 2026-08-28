import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SepticShockLabel, SEPTIC_SHOCK_LABEL_ACTIONS } from '../../src/modules/infectious-disease/septic-shock-label';
import { septicShockLabelReportActions as reportActions } from '../../src/modules/infectious-disease/septic-shock-label-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'septic-shock-label-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `septic-shock-label-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('SepticShockLabel reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-hypoperfusion', 'hypoperfusion-recorded', 'accepted'],
    ['activate-critical-care', 'critical-care-activated', 'accepted'],
    ['record-classification-open', 'classification-open', 'accepted'],
    ['record-resuscitation-intent', 'resuscitation-intent', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-labs', 'lab-check', 'accepted'],
    ['check-perfusion', 'perfusion-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'resuscitated-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['declare-shock-now', 'early-label-refused', 'refused'],
    ['lactate-means-hypoxia', 'hypoxia-refused', 'refused'],
    ['resuscitate-to-normal-lactate', 'normalization-refused', 'refused'],
    ['raise-the-map-target', 'map-target-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'septic-shock-label-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, observation, and refusals at one tick', () => {
    const model = new SepticShockLabel();
    const actions = ['record-hypoperfusion', 'declare-shock-now', 'check-labs', 'raise-the-map-target']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-hypoperfusion', 'accepted'], ['declare-shock-now', 'refused'],
      ['check-labs', 'accepted'], ['raise-the-map-target', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    // The adjacent critical-care lesson owns 'septic-shock-response'; its actions must not leak here.
    expect(reportActions([{ tick: 3, type: 'septic-shock-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'possible-sepsis-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'septic-shock-label-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = SEPTIC_SHOCK_LABEL_ACTIONS.filter((action) => {
      const model = new SepticShockLabel();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(SEPTIC_SHOCK_LABEL_ACTIONS.length);
  });
});

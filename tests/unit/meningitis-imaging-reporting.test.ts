import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { MeningitisImaging, MENINGITIS_IMAGING_ACTIONS } from '../../src/modules/infectious-disease/meningitis-imaging';
import { meningitisImagingReportActions as reportActions } from '../../src/modules/infectious-disease/meningitis-imaging-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'meningitis-imaging-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `meningitis-imaging-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('MeningitisImaging reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-triggering-features', 'features-recorded', 'accepted'],
    ['activate-time-critical-owners', 'owners-activated', 'accepted'],
    ['record-antimicrobial-intent', 'antimicrobial-intent', 'accepted'],
    ['compare-criteria-sets', 'criteria-compared', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['monitor', 'monitoring', 'accepted'],
    ['check-features', 'feature-check', 'accepted'],
    ['check-labs', 'lab-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'imaged-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['scan-first-is-safer', 'scan-default-refused', 'refused'],
    ['delay-antimicrobials-for-the-puncture', 'delay-refused', 'refused'],
    ['normal-crp-excludes', 'crp-refused', 'refused'],
    ['negative-gram-stain-excludes', 'gram-stain-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'meningitis-imaging-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, comparison, and refusals at one tick', () => {
    const model = new MeningitisImaging();
    const actions = ['record-triggering-features', 'scan-first-is-safer', 'check-labs', 'normal-crp-excludes']
      .map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-triggering-features', 'accepted'], ['scan-first-is-safer', 'refused'],
      ['check-labs', 'accepted'], ['normal-crp-excludes', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
  });

  it('refuses the other two meningitis lessons and malformed payloads', () => {
    // Three lessons in this repo concern meningitis; none may report as another.
    expect(reportActions([{ tick: 3, type: 'acute-bacterial-meningitis-first-hour-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'meningococcal-sepsis-response', payload: { action: 'monitor' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'meningitis-imaging-response', payload: { action: 'monitor', note: 'x' } }], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor', -1)], [event('monitoring', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('monitor')], [{ ...event('monitoring'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = MENINGITIS_IMAGING_ACTIONS.filter((action) => {
      const model = new MeningitisImaging();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(MENINGITIS_IMAGING_ACTIONS.length);
  });
});

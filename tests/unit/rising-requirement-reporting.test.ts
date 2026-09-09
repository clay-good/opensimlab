import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RisingRequirement, RISING_REQUIREMENT_ACTIONS } from '../../src/modules/surgery-trauma/rising-requirement';
import { risingRequirementReportActions as reportActions } from '../../src/modules/surgery-trauma/rising-requirement-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'rising-requirement-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `rising-requirement-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('RisingRequirement reports require uniquely attributable action outcomes', () => {
  it.each([
    ['record-the-injury-and-the-clock', 'injury-recorded', 'accepted'],
    ['record-the-rising-requirement', 'requirement-recorded', 'accepted'],
    ['record-what-one-pressure-cannot-decide', 'pressure-limits-recorded', 'accepted'],
    ['escalate-to-the-surgical-team', 'escalation-requested', 'accepted'],
    ['record-bounded-decompression-intent', 'decompression-intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-limb-record', 'limb-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['pulses-are-present-so-perfusion-is-fine', 'perfusion-claim-refused', 'refused'],
    ['the-pressure-was-below-the-threshold', 'threshold-claim-refused', 'refused'],
    ['increase-analgesia-and-review-in-the-morning', 'analgesia-refused', 'refused'],
    ['wait-for-a-repeat-pressure-before-calling', 'repeat-pressure-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'rising-requirement-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new RisingRequirement();
    const actions = ['record-the-injury-and-the-clock', 'the-pressure-was-below-the-threshold',
      'check-limb-record', 'increase-analgesia-and-review-in-the-morning'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['record-the-injury-and-the-clock', 'accepted'], ['the-pressure-was-below-the-threshold', 'refused'],
      ['check-limb-record', 'accepted'], ['increase-analgesia-and-review-in-the-morning', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'low-score-response', payload: { action: 'monitor' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'rising-requirement-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = RISING_REQUIREMENT_ACTIONS.filter((action) => {
      const model = new RisingRequirement();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(RISING_REQUIREMENT_ACTIONS.length);
  });
});

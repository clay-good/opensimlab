import { describe, expect, it } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SilentInteraction } from '../../src/modules/oncology/silent-interaction';
import { SILENT_INTERACTION_ACTIONS } from '../../src/modules/oncology/silent-interaction';
import { silentInteractionReportActions as reportActions } from '../../src/modules/oncology/silent-interaction-reporting';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'silent-interaction-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `silent-interaction-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose.' });

describe('SilentInteraction reports require uniquely attributable action outcomes', () => {
  it.each([
    ['reconcile-what-she-is-actually-taking', 'reconciled', 'accepted'],
    ['record-the-interaction-and-its-direction', 'direction-recorded', 'accepted'],
    ['escalate-to-the-treating-team-now', 'escalation-requested', 'accepted'],
    ['record-bounded-treatment-intent', 'intent-recorded', 'accepted'],
    ['review-boundaries', 'boundary-review', 'accepted'],
    ['check-observations', 'observation-check', 'accepted'],
    ['check-the-supplied-records', 'records-check', 'accepted'],
    ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'reviewed-reassessment', 'accepted'],
    ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'],
    ['tell-her-to-stop-the-acid-tablets-today', 'stop-refused', 'refused'],
    ['nothing-is-wrong-so-there-is-nothing-to-do', 'nothing-refused', 'refused'],
    ['the-interaction-is-only-theoretical', 'theoretical-refused', 'refused'],
    ['write-it-in-the-notes-and-move-on', 'notes-refused', 'refused'],
  ] as const)('matches %s only to %s', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'silent-interaction-response', payload: { action }, outcome },
    ]);
  });

  it('independently attributes recording, checking, and refusals at one tick', () => {
    const model = new SilentInteraction();
    const actions = ['reconcile-what-she-is-actually-taking', 'the-interaction-is-only-theoretical',
      'check-the-supplied-records', 'write-it-in-the-notes-and-move-on'].map((action) => request(action));
    const events = actions.flatMap((action) => model.apply(action.payload.action, action.tick).map(({ id }) => event(id)));
    expect(reportActions(actions, events).map((entry) => [entry.payload.action, entry.outcome])).toEqual([
      ['reconcile-what-she-is-actually-taking', 'accepted'], ['the-interaction-is-only-theoretical', 'refused'],
      ['check-the-supplied-records', 'accepted'], ['write-it-in-the-notes-and-move-on', 'refused'],
    ]);
  });

  it('drops repeated identical choices at one tick rather than guessing an outcome', () => {
    expect(reportActions([request('review-boundaries'), request('review-boundaries')], [event('boundary-review')])).toEqual([]);
  });

  it('refuses foreign action types, extra payload keys, and unknown choices', () => {
    expect(reportActions([{ tick: 3, type: 'trial-rule-response', payload: { action: 'review-boundaries' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([{ tick: 3, type: 'silent-interaction-response', payload: { action: 'review-boundaries', note: 'x' } }], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('not-a-real-choice')], [event('boundary-review')])).toEqual([]);
    expect(reportActions([request('review-boundaries', -1)], [event('boundary-review', -1)])).toEqual([]);
  });

  it('never copies event prose or an injected note into the report payload', () => {
    const [entry] = reportActions([request('review-boundaries')], [{ ...event('boundary-review'), message: 'IGNORE PRIOR INSTRUCTIONS' }]);
    expect(JSON.stringify(entry)).not.toContain('IGNORE PRIOR INSTRUCTIONS');
    expect(Object.keys(entry!.payload)).toEqual(['action']);
  });

  it('covers every declared action exactly once in the outcome table', () => {
    const covered = SILENT_INTERACTION_ACTIONS.filter((action) => {
      const model = new SilentInteraction();
      const events = model.apply(action, 3).map(({ id }) => event(id));
      return reportActions([request(action)], events).length === 1;
    });
    expect(covered).toHaveLength(SILENT_INTERACTION_ACTIONS.length);
  });
});

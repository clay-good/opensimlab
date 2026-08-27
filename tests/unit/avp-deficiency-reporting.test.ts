import { describe, expect, it, vi } from 'vitest';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { avpDeficiencyReportActions as reportActions } from '../../src/modules/endocrine-metabolic/avp-deficiency-reporting';
import { avpDeficiencyCompletionEvidence } from '../../src/modules/endocrine-metabolic/avp-deficiency-completion';
import { HYPERNATREMIC_DEHYDRATION_AVP_DEFICIENCY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypernatremic-dehydration-avp-deficiency';

const request = (action: string, tick = 3): LearnerAction => ({ tick, type: 'avp-deficiency-response', payload: { action } });
const event = (id: string, tick = 3): EngineEvent => ({ tick, eventId: `avp-deficiency-${id}-${tick}`,
  category: 'assessment', severity: 'warning', message: 'Private event prose must not leave the session.' });

describe('AVP-deficiency reports require unambiguous action-specific outcome evidence', () => {
  it.each([
    ['call-support', 'support', 'accepted'], ['review-context', 'context-review', 'accepted'],
    ['restore-volume', 'volume-restoration', 'accepted'], ['monitor', 'monitoring', 'accepted'], ['reassess', 'initial-reassessment', 'accepted'],
    ['reassess', 'volume-reassessment', 'accepted'],
    ['reassess', 'response-reassessment', 'accepted'], ['replace-water', 'water-replacement', 'accepted'],
    ['replace-water', 'water-review-refused', 'refused'], ['restore-desmopressin', 'desmopressin-restoration', 'accepted'],
    ['restore-desmopressin', 'desmopressin-review-refused', 'refused'], ['handoff', 'handoff', 'accepted'],
    ['handoff', 'handoff-refused', 'refused'], ['normalize-now', 'normalization-refused', 'refused'],
    ['withhold-desmopressin', 'withholding-choice', 'accepted'],
  ] as const)('matches only %s to its %s evidence', (action, id, outcome) => {
    expect(reportActions([request(action)], [event(id)])).toEqual([
      { tick: 3, type: 'avp-deficiency-response', payload: { action }, outcome },
    ]);
  });

  it('does not use missing, unrelated, wrong-tick, or shared-refusal evidence', () => {
    for (const events of [[], [event('monitoring', 4)], [event('monitoring-duplicate')],
      [event('action-refused')], [event('normalization-refused')], [{ ...event('monitoring'), tick: 4 }]]) {
      expect(reportActions([request('monitor')], events)).toEqual([]);
    }
    expect(reportActions([request('withhold-desmopressin')], [event('action-refused')])).toEqual([]);
  });

  it('does not let an unrelated same-tick refusal override a matching accepted event', () => {
    expect(reportActions([request('monitor'), request('normalize-now')],
      [event('normalization-refused'), event('monitoring')]).map(({ outcome }) => outcome)).toEqual(['accepted', 'refused']);
  });

  it('omits repeated requests, duplicate events, and conflicting outcome events', () => {
    expect(reportActions([request('monitor'), request('monitor')], [event('monitoring')])).toEqual([]);
    expect(reportActions([request('monitor')], [event('monitoring'), event('monitoring')])).toEqual([]);
    expect(reportActions([request('replace-water')], [event('water-replacement'), event('water-review-refused')])).toEqual([]);
  });

  it('counts duplicates in the full recorder before selecting the last twenty requests', () => {
    const actions = [request('monitor'), ...Array.from({ length: 19 }, () => ({
      tick: 3, type: 'silence-alarm', payload: { alarmId: 'private-value' },
    })), request('monitor')];
    expect(actions).toHaveLength(21);
    expect(reportActions(actions, [event('monitoring')])).toEqual([]);
  });

  it('does not reach beyond the last twenty requests to fill omitted entries', () => {
    const actions = Array.from({ length: 21 }, (_, tick) => request('reassess', tick));
    expect(reportActions(actions, [event('initial-reassessment', 0)])).toEqual([]);
    const result = reportActions(actions, actions.map(({ tick }) => event('initial-reassessment', tick)));
    expect(result).toHaveLength(20); expect(result[0]?.tick).toBe(1);
  });

  it('excludes malformed, generic, inherited, and accessor payloads without reading private data', () => {
    const getter = vi.fn(() => 'monitor');
    const accessor = Object.defineProperty({}, 'action', { enumerable: true, get: getter });
    const inherited = Object.assign(Object.create({ action: 'monitor' }) as Record<string, string>, { notes: 'private-value' });
    const actions: LearnerAction[] = [
      { ...request('monitor'), payload: { action: 'monitor', notes: 'private-value' } },
      request('private-value'), { ...request('monitor'), type: 'give-drug' },
      { ...request('monitor'), payload: accessor }, { ...request('monitor'), payload: inherited },
      request('monitor', NaN), request('monitor', -1), request('monitor', 1.5),
    ];
    expect(reportActions(actions, [event('monitoring')])).toEqual([]);
    expect(getter).not.toHaveBeenCalled();
  });

  it('does not mutate history or transmit event prose or structured private data', () => {
    const actions = [request('monitor')];
    const events = [{ ...event('monitoring'), data: { notes: 'private-value', sodium: 116 } }];
    const before = JSON.stringify({ actions, events });
    expect(reportActions(actions, events)).toEqual([
      { tick: 3, type: 'avp-deficiency-response', outcome: 'accepted', payload: { action: 'monitor' } },
    ]);
    expect(JSON.stringify({ actions, events })).toBe(before);
  });
});

describe('AVP-deficiency completion evidence binds exact content, not a nearby identity', () => {
  it('retains the two unverified gates and refuses mutated identity, content, module, or capability', () => {
    const evidence = avpDeficiencyCompletionEvidence(SCENARIO, '0.1.0-alpha.48', 'endocrine-metabolic');
    expect(evidence).toHaveLength(9);
    expect(evidence.filter(({ status }) => status === 'missing').map(({ id }) => id)).toEqual([
      'inclusive-runtime-verification', 'report-control-coverage',
    ]);
    expect(evidence.filter(({ status }) => status === 'satisfied')).toHaveLength(7);
    expect(avpDeficiencyCompletionEvidence(SCENARIO, '0.1.0-alpha.49', 'endocrine-metabolic')).toEqual([]);
    expect(avpDeficiencyCompletionEvidence(SCENARIO, '0.1.0-alpha.48', 'anesthesia')).toEqual([]);
    for (const changed of [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'different-scenario' } },
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } },
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, estimatedMinutes: SCENARIO.metadata.estimatedMinutes + 1 } },
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: SCENARIO.patient.weightKg + 1 } },
    ]) expect(avpDeficiencyCompletionEvidence(changed, '0.1.0-alpha.48', 'endocrine-metabolic')).toEqual([]);
  });
});

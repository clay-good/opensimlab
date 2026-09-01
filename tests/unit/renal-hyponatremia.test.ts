import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RenalHyponatremia, supportsRenalHyponatremia, RENAL_HYPONATREMIA_ACTIONS,
  RENAL_HYPONATREMIA_RESCUE_TICKS as RESCUE, RENAL_HYPONATREMIA_ADDITIONAL_RESCUE_TICKS as ADDITIONAL,
  RENAL_HYPONATREMIA_DELAY_TICKS as DELAY, RENAL_HYPONATREMIA_TAKEOVER_TICKS as TAKEOVER,
  RENAL_HYPONATREMIA_SESSION_TICKS as SESSION,
} from '../../src/modules/renal-electrolyte/hyponatremia';
import { RENAL_HYPONATREMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hyponatremia-fixtures';

function ownership(model: RenalHyponatremia, tick = 0) {
  for (const action of ['call-support', 'review-context', 'monitor', 'evaluate-neurology']) model.apply(action, tick);
}
function full(model: RenalHyponatremia, tick: number) {
  model.apply('reassess', tick); return model.snapshot(tick).observation;
}
function second(model: RenalHyponatremia, tick = RESCUE) {
  model.apply('rescue', 0); model.apply('reassess', tick); model.apply('additional-rescue', tick);
}

describe('Renal hyponatremia: persistent symptoms despite measured sodium improvement', () => {
  it('binds the exact narrative model and literal authored clock durations', () => {
    const scenario = { ...ROUTINE_INDUCTION, metadata: { ...ROUTINE_INDUCTION.metadata,
      id: 'hyponatremia-symptoms-and-reassessment' }, timeline: ['renal-hyponatremia', 'renal-hyponatremia-boundary']
      .map((target) => ({ id: target, type: 'narrative' as const, target, atTick: 0, message: 'Authored boundary' })) };
    expect(supportsRenalHyponatremia(scenario)).toBe(true);
    for (const invalid of [ROUTINE_INDUCTION, { ...scenario, timeline: [] },
      { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsRenalHyponatremia(invalid)).toBe(false);
    }
    expect([RESCUE, ADDITIONAL, DELAY, TAKEOVER, SESSION]).toEqual([36000, 18000, 18000, 72000, 144000]);
    expect(RENAL_HYPONATREMIA_ACTIONS).toHaveLength(13);
  });

  it('starts with no care or requested findings and no hidden numeric values in public state', () => {
    const model = new RenalHyponatremia();
    expect(model.snapshot(0)).toEqual({ supportActive: false, contextReviewedAtTick: null, monitoringAtTick: null,
      rescueAtTick: null, additionalRescueAtTick: null, neurologicReviewAtTick: null,
      rescueDueInSeconds: null, additionalRescueDueInSeconds: null,
      initialResponseObserved: false, additionalResponseObserved: false, persistentSymptomsObserved: false,
      sodiumNormalizationAttempted: false, numberOnlyRecoveryAttempted: false, siadhLabelAttempted: false,
      sodiumObservation: null, neurologicObservation: null, observation: null,
      alertness: 'awake but confused', choiceFeedback: null, ended: null,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false });
    expect(model.vitals()).toEqual({ systolicMmHg: 132, diastolicMmHg: 78, meanArterialMmHg: 96,
      heartRateBpm: 92, respiratoryRateBpm: 18, spo2Percent: 98, coreTemperatureC: 36.7, alertness: 'awake but confused' });
    expect(model.rhythm()).toBe('sinus');
    expect(full(model, 0)).toMatchObject({ sodiumMmolL: 118, changeFromBaselineMmolL: 0, headache: true, nausea: true });
  });

  it.each(['call-support', 'review-context', 'monitor', 'evaluate-neurology'])('accepts %s independently once without treating sodium or inventing investigation results', (action) => {
    const model = new RenalHyponatremia();
    expect(model.apply(action, 0)).toHaveLength(1); expect(model.apply(action, 1)).toEqual([]);
    expect(model.snapshot(1)).toMatchObject({ rescueAtTick: null, rescueDueInSeconds: null, observation: null });
    expect(full(model, DELAY)).toMatchObject({ sodiumMmolL: 118, headache: true, nausea: true, heartRateBpm: 102 });
    model.advance(TAKEOVER); expect(model.snapshot(TAKEOVER).ended).toBe('instructor-takeover');
  });

  it('accepts urgent rescue without administrative or observation gates and measures persistent symptoms after +5', () => {
    const model = new RenalHyponatremia();
    expect(model.apply('rescue', 0).at(-1)?.id).toBe('rescue');
    expect(model.apply('rescue', 1)).toEqual([]);
    expect(model.advance(RESCUE - 1)).toEqual([]);
    expect(model.snapshot(RESCUE - 1).rescueDueInSeconds).toBe(1);
    expect(model.apply('reassess', RESCUE).map((event) => event.id)).toEqual(['rescue-checkpoint', 'persistent-symptoms-reassessment']);
    expect(model.snapshot(RESCUE)).toMatchObject({ supportActive: false, initialResponseObserved: true,
      additionalResponseObserved: false, persistentSymptomsObserved: true, observation: { atTick: RESCUE,
        sodiumMmolL: 123, changeFromBaselineMmolL: 5, headache: true, nausea: true, alertness: 'awake but confused',
        systolicMmHg: 126, diastolicMmHg: 74, meanArterialMmHg: 91, heartRateBpm: 88, respiratoryRateBpm: 16 } });
    expect(model.snapshot(RESCUE).observation).not.toHaveProperty('diagnosis');
  });

  it('does not let old full or separate partial findings authorize an additional rescue', () => {
    const model = new RenalHyponatremia(); full(model, 0); model.apply('rescue', 0);
    expect(model.apply('additional-rescue', 0).at(-1)?.id).toBe('additional-rescue-refused');
    model.apply('check-sodium', RESCUE); model.apply('check-neurology', RESCUE);
    expect(model.snapshot(RESCUE)).toMatchObject({ observation: { atTick: 0, sodiumMmolL: 118 },
      sodiumObservation: { atTick: RESCUE, sodiumMmolL: 123 }, neurologicObservation: { atTick: RESCUE },
      initialResponseObserved: false, persistentSymptomsObserved: false });
    expect(model.apply('additional-rescue', RESCUE).at(-1)?.id).toBe('additional-rescue-refused');
    full(model, RESCUE);
    expect(model.apply('additional-rescue', RESCUE).at(-1)?.id).toBe('additional-rescue');
    expect(model.snapshot(RESCUE)).toMatchObject({ additionalRescueAtTick: RESCUE, neurologicReviewAtTick: null,
      contextReviewedAtTick: null, monitoringAtTick: null, supportActive: false });
  });

  it.each([['evaluate-neurology', 'additional-rescue'], ['additional-rescue', 'evaluate-neurology']] as const)('accepts %s then %s without an administrative delay or a fictional neurologic cure', (first, next) => {
    const model = new RenalHyponatremia(); model.apply('rescue', 0); full(model, RESCUE);
    expect(model.apply(first, RESCUE).at(-1)?.id).not.toContain('refused');
    expect(model.apply(next, RESCUE).at(-1)?.id).not.toContain('refused');
    expect(model.apply('additional-rescue', RESCUE + 1)).toEqual([]);
    expect(full(model, RESCUE + ADDITIONAL)).toMatchObject({ sodiumMmolL: 124, changeFromBaselineMmolL: 6,
      alertness: 'awake but confused', headache: true, nausea: true, heartRateBpm: 88 });
    expect(model.snapshot(RESCUE + ADDITIONAL)).toMatchObject({ additionalResponseObserved: true,
      persistentSymptomsObserved: true, additionalRescueDueInSeconds: null, durableRecoveryProven: false });
  });

  it('keeps partial sodium and neurologic observations separate from each other and full response credit', () => {
    const model = new RenalHyponatremia(); second(model);
    const old = model.snapshot(RESCUE).observation;
    model.apply('check-neurology', RESCUE + ADDITIONAL);
    expect(model.snapshot(RESCUE + ADDITIONAL)).toMatchObject({ sodiumObservation: { atTick: RESCUE, sodiumMmolL: 123 },
      neurologicObservation: { atTick: RESCUE + ADDITIONAL }, additionalResponseObserved: false });
    model.apply('check-sodium', RESCUE + ADDITIONAL + 1);
    expect(model.snapshot(RESCUE + ADDITIONAL + 1).observation).toEqual(old);
    expect(model.snapshot(RESCUE + ADDITIONAL + 1)).toMatchObject({ sodiumObservation: { sodiumMmolL: 124 }, additionalResponseObserved: false });
    ownership(model, RESCUE + ADDITIONAL + 1);
    expect(model.apply('handoff', RESCUE + ADDITIONAL + 1).at(-1)?.id).toBe('handoff-refused');
    full(model, RESCUE + ADDITIONAL + 1);
    expect(model.apply('handoff', RESCUE + ADDITIONAL + 1).at(-1)?.id).toBe('handoff');
  });

  it.each(['call-support', 'review-context', 'monitor', 'evaluate-neurology'])('requires %s ownership at handoff without making it a rescue prerequisite', (missing) => {
    const model = new RenalHyponatremia(); second(model);
    for (const action of ['call-support', 'review-context', 'monitor', 'evaluate-neurology']) {
      if (action !== missing) model.apply(action, RESCUE);
    }
    full(model, RESCUE + ADDITIONAL);
    expect(model.apply('handoff', RESCUE + ADDITIONAL).at(-1)?.id).toBe('handoff-refused');
    model.apply(missing, RESCUE + ADDITIONAL);
    expect(model.apply('handoff', RESCUE + ADDITIONAL).at(-1)?.id).toBe('handoff');
  });

  it('retains all refused shortcuts while permitting later unresolved-risk handoff', () => {
    const model = new RenalHyponatremia();
    for (const action of ['normalize-now', 'sodium-means-recovered', 'siadh-now']) {
      expect(model.apply(action, 0).at(-1)?.id).toContain('refused');
    }
    second(model); ownership(model, RESCUE); full(model, RESCUE + ADDITIONAL);
    expect(model.apply('handoff', RESCUE + ADDITIONAL).at(-1)?.message).toContain('not a clinical stopping rule');
    const ended = model.snapshot(RESCUE + ADDITIONAL);
    expect(ended).toMatchObject({ sodiumNormalizationAttempted: true, numberOnlyRecoveryAttempted: true,
      siadhLabelAttempted: true, ended: 'handoff', observation: { sodiumMmolL: 124, headache: true, nausea: true } });
    expect(model.advance(SESSION)).toEqual([]);
    expect(model.apply('rescue', SESSION).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(SESSION)).toEqual(ended);
  });

  it('does not disclose new sodium through automatic events, snapshot reads, or an investigation request', () => {
    const model = new RenalHyponatremia(); model.apply('rescue', 0); full(model, 0);
    const old = model.snapshot(0).observation;
    expect(model.snapshot(SESSION).rescueDueInSeconds).toBe(0);
    expect(model.snapshot(SESSION).observation).toEqual(old);
    expect(model.vitals().heartRateBpm).toBe(92);
    const events = model.advance(RESCUE);
    expect(JSON.stringify(events)).not.toMatch(/123|124/);
    model.apply('evaluate-neurology', RESCUE);
    expect(model.snapshot(RESCUE).observation).toEqual(old);
    expect(model.snapshot(RESCUE).initialResponseObserved).toBe(false);
    const copy = model.snapshot(RESCUE);
    Object.assign(copy.observation!, { sodiumMmolL: 999 });
    expect(model.snapshot(RESCUE).observation?.sodiumMmolL).toBe(118);
  });

  it('keeps delayed care viable without a grading cutoff or spontaneous normalization', () => {
    const model = new RenalHyponatremia();
    expect(model.advance(DELAY).at(-1)?.id).toBe('clinical-deterioration');
    expect(model.vitals()).toMatchObject({ heartRateBpm: 102, systolicMmHg: 140, diastolicMmHg: 82,
      meanArterialMmHg: 101, respiratoryRateBpm: 20 });
    model.apply('rescue', TAKEOVER - 1);
    full(model, TAKEOVER - 1 + RESCUE); model.apply('additional-rescue', TAKEOVER - 1 + RESCUE);
    ownership(model, TAKEOVER - 1 + RESCUE);
    expect(full(model, TAKEOVER - 1 + RESCUE + ADDITIONAL)).toMatchObject({ sodiumMmolL: 124,
      changeFromBaselineMmolL: 6, headache: true, nausea: true });
    expect(model.apply('handoff', TAKEOVER - 1 + RESCUE + ADDITIONAL).at(-1)?.id).toBe('handoff');
  });

  it('orders coarse checkpoints like fine advancement and caps them at the terminal stop', () => {
    for (const rescueAt of [null, 0, DELAY] as const) {
      const fine = new RenalHyponatremia(); const coarse = new RenalHyponatremia();
      if (rescueAt !== null) for (const model of [fine, coarse]) model.apply('rescue', rescueAt);
      const events = [];
      for (let tick = (rescueAt ?? 0) + 1; tick <= SESSION + RESCUE; tick++) events.push(...fine.advance(tick));
      expect(coarse.advance(SESSION + RESCUE)).toEqual(events);
      expect(coarse.snapshot(SESSION + RESCUE)).toEqual(fine.snapshot(SESSION + RESCUE));
      expect(coarse.vitals()).toEqual(fine.vitals());
    }
    const model = new RenalHyponatremia(); model.apply('rescue', 0); full(model, SESSION - 1);
    model.apply('additional-rescue', SESSION - 1);
    expect(model.advance(SESSION + ADDITIONAL).map((event) => event.id)).toEqual(['instructor-takeover']);
    expect(model.snapshot(SESSION + ADDITIONAL)).toMatchObject({ additionalResponseObserved: false,
      additionalRescueDueInSeconds: null, observation: { sodiumMmolL: 123 } });
    const untreated = new RenalHyponatremia();
    expect(untreated.apply('rescue', TAKEOVER).map((event) => event.id))
      .toEqual(['clinical-deterioration', 'instructor-takeover', 'action-refused']);
    expect(untreated.snapshot(TAKEOVER).rescueAtTick).toBe(null);
  });

  it('rejects unknown actions without executing payload properties or initiating care', () => {
    const model = new RenalHyponatremia();
    const malicious = { get action() { throw new Error('must not read'); } };
    for (const action of [null, undefined, {}, malicious, '__proto__', 1, false]) {
      expect(model.apply(action, 0).at(-1)?.id).toBe('action-refused');
    }
    expect(model.snapshot(0)).toMatchObject({ rescueAtTick: null, additionalRescueAtTick: null, observation: null });
  });

  it('binds literal transcripts and deterministically reproduces every model frame for all four courses', () => {
    expect(FIXTURES).toMatchObject({ scenarioId: 'hyponatremia-symptoms-and-reassessment', contentVersion: '0.1.0', seed: 4961 });
    expect(FIXTURES.expert).toHaveLength(9); expect(FIXTURES.recovery).toHaveLength(15);
    for (const name of ['expert', 'recovery', 'commonError', 'noAction'] as const) {
      const run = () => {
        const model = new RenalHyponatremia(); const hash = createHash('sha256'); const actions = FIXTURES[name];
        const stop = name === 'expert' || name === 'recovery' ? actions.at(-1)![0] : TAKEOVER;
        for (let tick = 0; tick <= stop; tick++) {
          const events = model.advance(tick);
          for (const [at, action] of actions) if (at === tick) events.push(...model.apply(action, tick));
          hash.update(JSON.stringify({ tick, events, state: model.snapshot(tick), vitals: model.vitals(), rhythm: model.rhythm() }));
        }
        return { digest: hash.digest('hex'), state: model.snapshot(stop) };
      };
      const first = run(); expect(run()).toEqual(first);
      expect(first.state.ended).toBe(name === 'expert' || name === 'recovery' ? 'handoff' : 'instructor-takeover');
      if (name === 'expert' || name === 'recovery') expect(first.state).toMatchObject({ initialResponseObserved: true,
        additionalResponseObserved: true, persistentSymptomsObserved: true, observation: { sodiumMmolL: 124,
          changeFromBaselineMmolL: 6, headache: true, nausea: true, alertness: 'awake but confused' } });
      if (name === 'recovery') expect(first.state).toMatchObject({ sodiumNormalizationAttempted: true,
        numberOnlyRecoveryAttempted: true, siadhLabelAttempted: true });
      if (name === 'commonError') expect(first.state).toMatchObject({ rescueAtTick: null,
        observation: null, sodiumObservation: { atTick: 0, sodiumMmolL: 118 } });
    }
  });
});

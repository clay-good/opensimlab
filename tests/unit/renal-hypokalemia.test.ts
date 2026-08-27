import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RenalHypokalemia, supportsRenalHypokalemia, RENAL_HYPOKALEMIA_ACTIONS,
  RENAL_HYPOKALEMIA_POTASSIUM_TICKS as POTASSIUM, RENAL_HYPOKALEMIA_MAGNESIUM_TICKS as MAGNESIUM,
  RENAL_HYPOKALEMIA_RESPONSE_TICKS as RESPONSE, RENAL_HYPOKALEMIA_RECURRENCE_TICKS as RECURRENCE,
  RENAL_HYPOKALEMIA_DELAY_TICKS as DELAY, RENAL_HYPOKALEMIA_TAKEOVER_TICKS as TAKEOVER,
  RENAL_HYPOKALEMIA_SESSION_TICKS as SESSION,
} from '../../src/modules/renal-electrolyte/hypokalemia';
import { RENAL_HYPOKALEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypokalemia-fixtures';

function ownership(model: RenalHypokalemia, tick = 0, losses = true) {
  for (const action of ['call-support', 'review-context', 'monitor']) model.apply(action, tick);
  if (losses) model.apply('manage-losses', tick);
}
function findings(model: RenalHypokalemia, tick: number) {
  model.apply('reassess', tick); return model.snapshot(tick).observation;
}

describe('Renal hypokalemia: independent replacement, ongoing losses, and current findings', () => {
  it('binds the narrative model and literal authored clock durations', () => {
    const scenario = { ...ROUTINE_INDUCTION, metadata: { ...ROUTINE_INDUCTION.metadata,
      id: 'hypokalemia-magnesium-and-ongoing-losses' }, timeline: ['renal-hypokalemia', 'renal-hypokalemia-boundary']
      .map((target) => ({ id: target, type: 'narrative' as const, target, atTick: 0, message: 'Authored boundary' })) };
    expect(supportsRenalHypokalemia(scenario)).toBe(true);
    for (const invalid of [ROUTINE_INDUCTION, { ...scenario, timeline: [] },
      { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsRenalHypokalemia(invalid)).toBe(false);
    }
    expect([POTASSIUM, MAGNESIUM, RESPONSE, RECURRENCE, DELAY, TAKEOVER, SESSION])
      .toEqual([18000, 18000, 36000, 72000, 36000, 72000, 216000]);
    expect(RENAL_HYPOKALEMIA_ACTIONS).toHaveLength(12);
  });

  it('starts with no care or current numeric lab observations and qualitative ECG only', () => {
    const model = new RenalHypokalemia();
    expect(model.snapshot(0)).toEqual({ supportActive: false, contextReviewedAtTick: null, monitoringAtTick: null,
      potassiumAtTick: null, magnesiumAtTick: null, lossManagementAtTick: null,
      potassiumDueInSeconds: null, magnesiumDueInSeconds: null, responseDueInSeconds: null, recurrenceDueInSeconds: null,
      potassiumResponseObserved: false, magnesiumResponseObserved: false, responseObserved: false, recurrenceObserved: false,
      rapidPotassiumAttempted: false, monitoringStopAttempted: false, potassiumObservation: null, ecgObservation: null,
      observation: null, alertness: 'awake with generalized weakness', choiceFeedback: null, ended: null,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false });
    expect(model.vitals()).toEqual({ systolicMmHg: 106, diastolicMmHg: 66, meanArterialMmHg: 79, heartRateBpm: 96,
      respiratoryRateBpm: 18, spo2Percent: 98, coreTemperatureC: 36.7, alertness: 'awake with generalized weakness' });
    expect(model.rhythm()).toBe('hypokalemic-repolarization');
    expect(findings(model, 0)).toMatchObject({ potassiumMmolL: 2.3, magnesiumMmolL: 0.40 });
    expect(model.snapshot(0).observation).not.toHaveProperty('qtcMs');
  });

  it.each(['call-support', 'review-context', 'manage-losses', 'monitor'])('accepts %s once without electrolyte repletion or laboratory acquisition', (action) => {
    const model = new RenalHypokalemia();
    expect(model.apply(action, 0)).toHaveLength(1); expect(model.apply(action, 1)).toEqual([]);
    expect(model.snapshot(1)).toMatchObject({ potassiumAtTick: null, magnesiumAtTick: null, responseDueInSeconds: null,
      observation: null });
    expect(findings(model, DELAY)).toMatchObject({ potassiumMmolL: 2.3, magnesiumMmolL: 0.40 });
    expect(model.vitals()).toMatchObject({ heartRateBpm: 108, systolicMmHg: 98, diastolicMmHg: 60,
      meanArterialMmHg: 73, respiratoryRateBpm: 20 });
  });

  it('accepts potassium alone without magnesium or administrative gates and leaves magnesium low', () => {
    const model = new RenalHypokalemia(); model.apply('potassium', 0);
    expect(model.apply('potassium', 1)).toEqual([]);
    expect(model.advance(POTASSIUM - 1)).toEqual([]);
    expect(model.snapshot(POTASSIUM - 1).potassiumDueInSeconds).toBe(1);
    expect(model.apply('reassess', POTASSIUM).at(-1)?.id).toBe('potassium-reassessment');
    expect(model.snapshot(POTASSIUM)).toMatchObject({ observation: { potassiumMmolL: 2.7, magnesiumMmolL: 0.40 },
      potassiumResponseObserved: true, magnesiumResponseObserved: false, responseObserved: false });
    expect(model.rhythm()).toBe('hypokalemic-repolarization');
  });

  it('accepts magnesium alone without correcting potassium or preventing the missing-potassium teaching stop', () => {
    const model = new RenalHypokalemia(); model.apply('magnesium', 0);
    expect(model.apply('magnesium', 1)).toEqual([]);
    expect(model.apply('reassess', MAGNESIUM).at(-1)?.id).toBe('magnesium-reassessment');
    expect(model.snapshot(MAGNESIUM)).toMatchObject({ observation: { potassiumMmolL: 2.3, magnesiumMmolL: 0.58 },
      potassiumResponseObserved: false, magnesiumResponseObserved: true, responseObserved: false });
    model.advance(TAKEOVER); expect(model.snapshot(TAKEOVER).ended).toBe('instructor-takeover');
  });

  it.each([['potassium', 'magnesium'], ['magnesium', 'potassium']] as const)('accepts %s then %s and shows distinct partial and combined findings', (first, second) => {
    const model = new RenalHypokalemia(); model.apply(first, 0); model.apply(second, 0);
    expect(model.snapshot(0)).toMatchObject({ supportActive: false, lossManagementAtTick: null,
      observation: null, responseDueInSeconds: 3600 });
    expect(model.apply('reassess', POTASSIUM).at(-1)?.id).toBe('partial-reassessment');
    expect(model.snapshot(POTASSIUM)).toMatchObject({ observation: { potassiumMmolL: 2.7, magnesiumMmolL: 0.58 },
      potassiumResponseObserved: true, magnesiumResponseObserved: true, responseObserved: false });
    expect(findings(model, RESPONSE)).toMatchObject({ potassiumMmolL: 3.1, magnesiumMmolL: 0.62,
      rhythm: 'sinus', heartRateBpm: 88, systolicMmHg: 110, diastolicMmHg: 68, meanArterialMmHg: 82, respiratoryRateBpm: 16 });
    expect(model.apply('handoff', RESPONSE).at(-1)?.id).toBe('handoff-refused');
    ownership(model, RESPONSE); expect(model.apply('handoff', RESPONSE).at(-1)?.id).toBe('handoff');
  });

  it('does not delay a combined response when ongoing-loss care is added before the recurrence clock', () => {
    const model = new RenalHypokalemia(); model.apply('potassium', 0); model.apply('magnesium', 0);
    model.apply('manage-losses', POTASSIUM);
    expect(model.snapshot(POTASSIUM).responseDueInSeconds).toBe(1800);
    expect(findings(model, RESPONSE)).toMatchObject({ potassiumMmolL: 3.1, magnesiumMmolL: 0.62 });
    const later = model.advance(RECURRENCE);
    expect(later.map(({ id }) => id)).toEqual(['losses-review-checkpoint']);
    expect(findings(model, RECURRENCE)).toMatchObject({ potassiumMmolL: 3.1, magnesiumMmolL: 0.62 });
    expect(model.snapshot(RECURRENCE).recurrenceObserved).toBe(false);
  });

  it('keeps potassium-only and ECG-only observations separate from full magnesium findings and response credit', () => {
    const model = new RenalHypokalemia(); findings(model, 0); const initial = model.snapshot(0).observation;
    model.apply('potassium', 0); model.apply('magnesium', 0); ownership(model);
    model.apply('check-potassium', POTASSIUM);
    expect(model.snapshot(POTASSIUM)).toMatchObject({ observation: initial,
      potassiumObservation: { atTick: POTASSIUM, potassiumMmolL: 2.7 },
      potassiumResponseObserved: false, magnesiumResponseObserved: false });
    model.apply('check-ecg', RESPONSE);
    expect(model.snapshot(RESPONSE)).toMatchObject({ observation: initial,
      potassiumObservation: { potassiumMmolL: 2.7 }, ecgObservation: { atTick: RESPONSE, rhythm: 'sinus' }, responseObserved: false });
    expect(model.apply('handoff', RESPONSE).at(-1)?.id).toBe('handoff-refused');
    findings(model, RESPONSE); expect(model.snapshot(RESPONSE)).toMatchObject({ responseObserved: true,
      potassiumResponseObserved: false, magnesiumResponseObserved: false });
    expect(model.apply('handoff', RESPONSE).at(-1)?.id).toBe('handoff');
  });

  it('keeps recurrence numeric findings and observed history private until full reassessment', () => {
    const model = new RenalHypokalemia(); model.apply('potassium', 0); model.apply('magnesium', 0);
    findings(model, RESPONSE); const previous = model.snapshot(RESPONSE).observation;
    const events = model.advance(RECURRENCE);
    expect(model.rhythm()).toBe('hypokalemic-repolarization');
    expect(model.snapshot(RECURRENCE)).toMatchObject({ observation: previous, responseObserved: true, recurrenceObserved: false });
    expect(JSON.stringify({ events, snapshot: model.snapshot(RECURRENCE), vitals: model.vitals() })).not.toMatch(/2\.5|0\.46/);
    model.apply('check-potassium', RECURRENCE); expect(model.snapshot(RECURRENCE).recurrenceObserved).toBe(false);
    expect(model.snapshot(RECURRENCE).observation).toEqual(previous);
    expect(model.apply('reassess', RECURRENCE).at(-1)?.id).toBe('recurrence-reassessment');
    expect(model.snapshot(RECURRENCE)).toMatchObject({ recurrenceObserved: true,
      observation: { potassiumMmolL: 2.5, magnesiumMmolL: 0.46 } });
  });

  it('recovers after ongoing-loss care without erasing recurrence or reusing the earlier full assessment', () => {
    const model = new RenalHypokalemia(); ownership(model, 0, false);
    model.apply('potassium', 0); model.apply('magnesium', 0); findings(model, RESPONSE);
    model.apply('manage-losses', RECURRENCE);
    expect(model.snapshot(RECURRENCE).responseDueInSeconds).toBe(3600);
    expect(model.apply('handoff', RECURRENCE).at(-1)?.id).toBe('handoff-refused');
    findings(model, RECURRENCE);
    model.advance(RECURRENCE + RESPONSE);
    expect(model.apply('handoff', RECURRENCE + RESPONSE).at(-1)?.id).toBe('handoff-refused');
    expect(findings(model, RECURRENCE + RESPONSE)).toMatchObject({ potassiumMmolL: 3.1, magnesiumMmolL: 0.62, rhythm: 'sinus' });
    expect(model.snapshot(RECURRENCE + RESPONSE)).toMatchObject({ responseObserved: true, recurrenceObserved: true });
    expect(model.apply('handoff', RECURRENCE + RESPONSE).at(-1)?.id).toBe('handoff');
  });

  it('permits current recurrence handoff with replacement and delivered loss care active while recovery is pending', () => {
    const model = new RenalHypokalemia(); ownership(model, 0, false);
    model.apply('potassium', 0); model.apply('magnesium', 0); findings(model, RECURRENCE);
    model.apply('manage-losses', RECURRENCE);
    expect(model.snapshot(RECURRENCE)).toMatchObject({ responseObserved: false, recurrenceObserved: true,
      responseDueInSeconds: 3600, potassiumResponseObserved: false, magnesiumResponseObserved: false });
    expect(model.apply('handoff', RECURRENCE).at(-1)?.message).toContain('Recovery may remain pending');
    expect(model.snapshot(RECURRENCE).ended).toBe('handoff');
  });

  it('does not let late magnesium or an elapsed combined checkpoint erase continuing-loss recurrence', () => {
    const model = new RenalHypokalemia(); model.apply('potassium', 0);
    expect(findings(model, RECURRENCE)).toMatchObject({ potassiumMmolL: 2.5, magnesiumMmolL: 0.40 });
    model.apply('magnesium', RECURRENCE);
    expect(findings(model, RECURRENCE + MAGNESIUM)).toMatchObject({ potassiumMmolL: 2.5, magnesiumMmolL: 0.58 });
    expect(findings(model, RECURRENCE + RESPONSE)).toMatchObject({ potassiumMmolL: 2.5, magnesiumMmolL: 0.58,
      rhythm: 'hypokalemic-repolarization' });
    expect(model.snapshot(RECURRENCE + RESPONSE).responseObserved).toBe(false);
    model.apply('manage-losses', RECURRENCE + RESPONSE);
    expect(findings(model, RECURRENCE + 2 * RESPONSE)).toMatchObject({ potassiumMmolL: 3.1, magnesiumMmolL: 0.62 });
    expect(model.snapshot(RECURRENCE + 2 * RESPONSE).recurrenceObserved).toBe(true);
  });

  it.each([['rapid-potassium', 'rapid-potassium-refused', 'rapidPotassiumAttempted'],
    ['stop-monitoring', 'monitoring-stop-refused', 'monitoringStopAttempted']] as const)(
    'refuses %s without changing care and preserves the choice through subsequent handoff', (action, event, flag) => {
      const model = new RenalHypokalemia(); model.apply('potassium', 0); model.apply('magnesium', 0); ownership(model);
      expect(model.apply(action, 1).at(-1)?.id).toBe(event);
      expect(model.snapshot(1)[flag]).toBe(true); expect(model.snapshot(1).potassiumAtTick).toBe(0);
      findings(model, RESPONSE); model.apply('handoff', RESPONSE);
      expect(model.snapshot(RESPONSE).ended).toBe('handoff'); expect(model.snapshot(RESPONSE)[flag]).toBe(true);
    });

  it('has read-only future snapshots, detached findings, and frozen outcomes after handoff', () => {
    const model = new RenalHypokalemia(); model.apply('potassium', 0); model.apply('magnesium', 0); ownership(model);
    expect(model.snapshot(RESPONSE)).toMatchObject({ potassiumDueInSeconds: 0, magnesiumDueInSeconds: 0,
      responseDueInSeconds: 0, observation: null, responseObserved: false });
    expect(model.rhythm()).toBe('hypokalemic-repolarization'); findings(model, RESPONSE);
    const copy = model.snapshot(RESPONSE); Object.assign(copy.observation!, { magnesiumMmolL: -1 });
    Object.assign(copy.potassiumObservation!, { potassiumMmolL: -1 }); Object.assign(copy.ecgObservation!, { rhythm: 'wrong' });
    expect(model.snapshot(RESPONSE).observation?.magnesiumMmolL).toBe(0.62);
    expect(model.snapshot(RESPONSE).potassiumObservation?.potassiumMmolL).toBe(3.1);
    expect(model.snapshot(RESPONSE).ecgObservation?.rhythm).toBe('sinus');
    model.apply('handoff', RESPONSE); const ended = model.snapshot(RESPONSE);
    expect(model.advance(SESSION)).toEqual([]);
    for (const action of RENAL_HYPOKALEMIA_ACTIONS) expect(model.apply(action, SESSION).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(SESSION)).toEqual(ended);
  });

  it.each([0, 60000, 90000])('matches sparse and fine checkpoint ordering with magnesium starting at %s', (magnesiumAt) => {
    const fine = new RenalHypokalemia(); const coarse = new RenalHypokalemia();
    for (const model of [fine, coarse]) model.apply('potassium', 0);
    const events: ReturnType<RenalHypokalemia['advance']> = [];
    for (let tick = 1; tick <= magnesiumAt; tick++) events.push(...fine.advance(tick));
    expect(coarse.advance(magnesiumAt)).toEqual(events);
    fine.apply('magnesium', magnesiumAt); coarse.apply('magnesium', magnesiumAt);
    events.length = 0;
    const lossesAt = RECURRENCE + 6000;
    const next = Math.max(magnesiumAt, lossesAt);
    for (let tick = magnesiumAt + 1; tick <= next; tick++) events.push(...fine.advance(tick));
    expect(coarse.advance(next)).toEqual(events);
    fine.apply('manage-losses', next); coarse.apply('manage-losses', next);
    events.length = 0;
    for (let tick = next + 1; tick <= SESSION + RESPONSE; tick++) events.push(...fine.advance(tick));
    expect(coarse.advance(SESSION + RESPONSE)).toEqual(events);
    expect(coarse.snapshot(SESSION + RESPONSE)).toEqual(fine.snapshot(SESSION + RESPONSE));
    expect(coarse.vitals()).toEqual(fine.vitals()); expect(coarse.rhythm()).toEqual(fine.rhythm());
  });

  it('caps sparse advancement at the terminal boundary before future replacement or recovery checkpoints', () => {
    const fine = new RenalHypokalemia(); const coarse = new RenalHypokalemia();
    for (const model of [fine, coarse]) {
      model.apply('potassium', 0); model.apply('magnesium', SESSION - 1); model.apply('manage-losses', SESSION - 1);
    }
    expect(coarse.advance(SESSION + RESPONSE)).toEqual(fine.advance(SESSION));
    expect(coarse.snapshot(SESSION + RESPONSE)).toEqual(fine.snapshot(SESSION));
    expect(coarse.snapshot(SESSION + RESPONSE).responseObserved).toBe(false);
    expect(coarse.rhythm()).toBe('hypokalemic-repolarization');
    const noPotassium = new RenalHypokalemia(); ownership(noPotassium); noPotassium.apply('magnesium', TAKEOVER - 1);
    expect(noPotassium.apply('potassium', TAKEOVER).at(-1)?.id).toBe('action-refused');
    expect(noPotassium.snapshot(TAKEOVER)).toMatchObject({ potassiumAtTick: null, ended: 'instructor-takeover' });
    const invalid = new RenalHypokalemia();
    for (const action of [null, {}, '__proto__', 1]) expect(invalid.apply(action, 0).at(-1)?.id).toBe('action-refused');
  });

  it('binds reference transcripts and deterministically reproduces the complete model trace for each course', () => {
    expect(FIXTURES).toMatchObject({ scenarioId: 'hypokalemia-magnesium-and-ongoing-losses', contentVersion: '0.1.0', seed: 4951 });
    expect(FIXTURES.expert).toHaveLength(10); expect(FIXTURES.recovery).toHaveLength(14);
    for (const name of ['expert', 'recovery', 'commonError', 'noAction'] as const) {
      const run = () => {
        const model = new RenalHypokalemia(); const hash = createHash('sha256'); const actions = FIXTURES[name];
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
      if (name === 'expert') expect(first.state).toMatchObject({ potassiumResponseObserved: true, magnesiumResponseObserved: true,
        responseObserved: true, recurrenceObserved: false, rapidPotassiumAttempted: false, monitoringStopAttempted: false });
      if (name === 'recovery') expect(first.state).toMatchObject({ potassiumResponseObserved: true, magnesiumResponseObserved: true,
        responseObserved: true, recurrenceObserved: true, rapidPotassiumAttempted: true, monitoringStopAttempted: true });
      if (name === 'commonError') expect(first.state).toMatchObject({ potassiumAtTick: null, magnesiumAtTick: 0,
        observation: null, responseObserved: false, potassiumObservation: { potassiumMmolL: 2.3 } });
    }
  }, 20000);
});

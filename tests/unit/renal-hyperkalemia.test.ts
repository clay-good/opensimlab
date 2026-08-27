import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RenalHyperkalemia, supportsRenalHyperkalemia, RENAL_HYPERKALEMIA_ACTIONS,
  RENAL_HYPERKALEMIA_CALCIUM_TICKS as CALCIUM, RENAL_HYPERKALEMIA_SHIFT_TICKS as SHIFT,
  RENAL_HYPERKALEMIA_REMOVAL_TICKS as REMOVAL, RENAL_HYPERKALEMIA_REBOUND_TICKS as REBOUND,
  RENAL_HYPERKALEMIA_DELAY_TICKS as DELAY, RENAL_HYPERKALEMIA_TAKEOVER_TICKS as TAKEOVER,
  RENAL_HYPERKALEMIA_SESSION_TICKS as SESSION,
} from '../../src/modules/renal-electrolyte/hyperkalemia';
import { RENAL_HYPERKALEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hyperkalemia-fixtures';

function ownership(model: RenalHyperkalemia, tick = 0) {
  for (const action of ['call-support', 'review-context', 'plan-removal', 'monitor']) model.apply(action, tick);
}
function findings(model: RenalHyperkalemia, tick: number) {
  model.apply('reassess', tick); return model.snapshot(tick).observation;
}

describe('Renal hyperkalemia: finite cardiac protection, temporary shifting, and separate delivered removal', () => {
  it('binds only the declared narrative scenario and literal authored clocks', () => {
    const scenario = { ...ROUTINE_INDUCTION, metadata: { ...ROUTINE_INDUCTION.metadata,
      id: 'hyperkalemia-cardioprotection-and-rebound' }, timeline: ['renal-hyperkalemia', 'renal-hyperkalemia-boundary']
      .map((target) => ({ id: target, type: 'narrative' as const, atTick: 0, target, message: 'Authored boundary' })) };
    expect(supportsRenalHyperkalemia(scenario)).toBe(true);
    for (const other of [ROUTINE_INDUCTION, { ...scenario, timeline: [] },
      { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsRenalHyperkalemia(other)).toBe(false);
    }
    expect([CALCIUM, SHIFT, REMOVAL, REBOUND, DELAY, TAKEOVER, SESSION])
      .toEqual([27000, 18000, 36000, 90000, 36000, 72000, 216000]);
    expect(RENAL_HYPERKALEMIA_ACTIONS).toHaveLength(13);
  });

  it('starts without care or requested findings and supplies only qualitative live ECG and vital signs', () => {
    const model = new RenalHyperkalemia();
    expect(model.snapshot(0)).toEqual({ supportActive: false, contextReviewedAtTick: null, removalPlanAtTick: null,
      monitoringAtTick: null, calciumAtTick: null, lastCalciumAtTick: null, calciumRequests: 0,
      shiftAtTick: null, removalAtTick: null, calciumDueInSeconds: null, shiftDueInSeconds: null,
      removalDueInSeconds: null, reboundDueInSeconds: null, shiftResponseObserved: false,
      removalResponseObserved: false, reboundObserved: false, ecgResolvedAttempted: false,
      glucoseMonitoringStopAttempted: false, ecgObservation: null, glucoseObservation: null, observation: null,
      alertness: 'awake with generalized weakness', choiceFeedback: null, ended: null,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false });
    expect(model.rhythm()).toBe('hyperkalemic-conduction');
    expect(model.vitals()).toEqual({ systolicMmHg: 110, diastolicMmHg: 64, meanArterialMmHg: 79,
      heartRateBpm: 48, respiratoryRateBpm: 18, spo2Percent: 98, coreTemperatureC: 36.7,
      alertness: 'awake with generalized weakness' });
    expect(findings(model, 0)).toMatchObject({ potassiumMmolL: 6.9, glucoseMgDl: 108 });
    expect(model.snapshot(0).observation).not.toHaveProperty('qrsMs');
  });

  it('changes ECG after calcium without lowering potassium, expires exactly, and permits a reviewed later repeat', () => {
    const model = new RenalHyperkalemia();
    expect(model.apply('calcium', 0).at(-1)?.id).toBe('calcium-care');
    expect(model.apply('calcium', 0)).toEqual([]);
    expect(model.rhythm()).toBe('sinus');
    expect(findings(model, 0)).toMatchObject({ potassiumMmolL: 6.9, glucoseMgDl: 108, rhythm: 'sinus' });
    expect(model.snapshot(0)).toMatchObject({ calciumRequests: 1, calciumAtTick: 0, lastCalciumAtTick: 0 });
    model.advance(CALCIUM - 1); expect(model.rhythm()).toBe('sinus');
    expect(model.snapshot(CALCIUM - 1).calciumDueInSeconds).toBe(1);
    expect(model.advance(CALCIUM).map(({ id }) => id)).toEqual(['calcium-review-checkpoint']);
    expect(model.rhythm()).toBe('hyperkalemic-conduction'); expect(model.snapshot(CALCIUM).calciumDueInSeconds).toBeNull();
    expect(model.snapshot(CALCIUM).observation?.rhythm).toBe('sinus');
    model.apply('calcium', CALCIUM);
    expect(model.snapshot(CALCIUM)).toMatchObject({ calciumAtTick: 0, lastCalciumAtTick: CALCIUM, calciumRequests: 2 });
    expect(findings(model, CALCIUM)).toMatchObject({ potassiumMmolL: 6.9, rhythm: 'sinus' });
  });

  it.each(['call-support', 'review-context', 'plan-removal', 'monitor'])('accepts %s once without lowering potassium or pretending to deliver removal', (action) => {
    const model = new RenalHyperkalemia();
    expect(model.apply(action, 0)).toHaveLength(1); expect(model.apply(action, 1)).toEqual([]);
    expect(model.snapshot(1)).toMatchObject({ shiftAtTick: null, removalAtTick: null, observation: null });
    expect(findings(model, DELAY)).toMatchObject({ potassiumMmolL: 6.9, glucoseMgDl: 108,
      heartRateBpm: 42, systolicMmHg: 98, diastolicMmHg: 58, meanArterialMmHg: 71, respiratoryRateBpm: 20 });
  });

  it.each([['calcium', 'shift', 'deliver-removal'], ['shift', 'deliver-removal', 'calcium'],
    ['deliver-removal', 'calcium', 'shift']] as const)('accepts independent urgent care in the order %s, %s, %s', (...actions) => {
    const model = new RenalHyperkalemia();
    for (const action of actions) model.apply(action, 0);
    expect(model.snapshot(0)).toMatchObject({ calciumAtTick: 0, shiftAtTick: 0, removalAtTick: 0,
      supportActive: false, removalPlanAtTick: null, observation: null, shiftDueInSeconds: 1800, removalDueInSeconds: 3600 });
    expect(findings(model, REMOVAL)).toMatchObject({ potassiumMmolL: 5.1, glucoseMgDl: 100 });
    expect(model.apply('handoff', REMOVAL).at(-1)?.id).toBe('handoff-refused');
    ownership(model, REMOVAL); expect(model.apply('handoff', REMOVAL).at(-1)?.id).toBe('handoff');
  });

  it('keeps calcium expiry from implying toxic ECG when shifting has produced the authored lower-potassium phase', () => {
    const model = new RenalHyperkalemia(); model.apply('calcium', 0); model.apply('shift', 0);
    expect(findings(model, SHIFT)).toMatchObject({ potassiumMmolL: 5.6, glucoseMgDl: 104, rhythm: 'sinus' });
    expect(model.snapshot(SHIFT).shiftResponseObserved).toBe(true);
    const event = model.advance(CALCIUM).find(({ id }) => id === 'calcium-review-checkpoint');
    expect(event?.message).toContain('does not prove recurrent toxicity');
    expect(model.rhythm()).toBe('sinus'); expect(model.vitals().heartRateBpm).toBe(64);
  });

  it('allows ECG-only and glucose-only findings while keeping full potassium findings and response credit historical', () => {
    const model = new RenalHyperkalemia(); findings(model, 0); const initial = model.snapshot(0).observation;
    model.apply('calcium', 0); model.apply('check-ecg', 1);
    expect(model.snapshot(1)).toMatchObject({ ecgObservation: { atTick: 1, rhythm: 'sinus' }, observation: initial,
      glucoseObservation: { atTick: 0, glucoseMgDl: 108 }, shiftResponseObserved: false });
    model.apply('shift', 1); model.apply('check-glucose', SHIFT + 1);
    expect(model.snapshot(SHIFT + 1)).toMatchObject({ glucoseObservation: { atTick: SHIFT + 1, glucoseMgDl: 104 },
      observation: initial, shiftResponseObserved: false });
    model.apply('check-ecg', REBOUND + 1);
    expect(model.snapshot(REBOUND + 1)).toMatchObject({ ecgObservation: { rhythm: 'hyperkalemic-conduction' },
      observation: initial, reboundObserved: false });
  });

  it('keeps new laboratory values and rebound learning history private until full requested reassessment', () => {
    const model = new RenalHyperkalemia(); model.apply('calcium', 0); model.apply('shift', 0);
    findings(model, SHIFT); const previous = model.snapshot(SHIFT).observation;
    const events = model.advance(REBOUND);
    expect(model.snapshot(REBOUND)).toMatchObject({ observation: previous, reboundObserved: false });
    expect(JSON.stringify({ events, snapshot: model.snapshot(REBOUND), vitals: model.vitals() })).not.toContain('6.6');
    expect(events.find(({ id }) => id === 'rebound-review-checkpoint')?.message).not.toContain('6.6');
    expect(model.apply('reassess', REBOUND).at(-1)?.id).toBe('rebound-reassessment');
    expect(model.snapshot(REBOUND)).toMatchObject({ reboundObserved: true, observation: { potassiumMmolL: 6.6 } });
  });

  it('plans removal without preventing rebound, then accepts delivered care and retains observed recurrence after recovery', () => {
    const model = new RenalHyperkalemia(); ownership(model); model.apply('calcium', 0); model.apply('shift', 0);
    findings(model, SHIFT); expect(findings(model, REBOUND)).toMatchObject({ potassiumMmolL: 6.6, rhythm: 'hyperkalemic-conduction' });
    model.apply('calcium', REBOUND); model.apply('deliver-removal', REBOUND);
    expect(findings(model, REBOUND + REMOVAL)).toMatchObject({ potassiumMmolL: 5.1, glucoseMgDl: 100,
      rhythm: 'sinus', heartRateBpm: 68, systolicMmHg: 114, diastolicMmHg: 68, meanArterialMmHg: 83 });
    expect(model.snapshot(REBOUND + REMOVAL)).toMatchObject({ reboundObserved: true, shiftResponseObserved: true,
      removalResponseObserved: true });
    expect(model.apply('handoff', REBOUND + REMOVAL).at(-1)?.id).toBe('handoff');
  });

  it('permits a fresh observed rebound handoff with delivered removal still pending, without forcing repeated calcium', () => {
    const model = new RenalHyperkalemia(); ownership(model); model.apply('calcium', 0); model.apply('shift', 0);
    findings(model, REBOUND); model.apply('deliver-removal', REBOUND);
    expect(model.snapshot(REBOUND)).toMatchObject({ calciumRequests: 1, calciumDueInSeconds: null,
      removalDueInSeconds: 3600, removalResponseObserved: false, shiftResponseObserved: false, reboundObserved: true });
    expect(model.rhythm()).toBe('hyperkalemic-conduction');
    expect(model.apply('handoff', REBOUND).at(-1)?.message).toContain('hyperkalemia may remain unresolved');
    expect(model.snapshot(REBOUND).ended).toBe('handoff');
  });

  it('requires a current full phase, not a recent timestamp or separate ECG/glucose clicks, before handoff', () => {
    const model = new RenalHyperkalemia(); ownership(model); model.apply('calcium', 0); model.apply('shift', 0);
    findings(model, SHIFT); model.advance(REBOUND); model.apply('deliver-removal', REBOUND);
    model.apply('check-ecg', REBOUND); model.apply('check-glucose', REBOUND);
    expect(model.apply('handoff', REBOUND).at(-1)?.id).toBe('handoff-refused');
    findings(model, REBOUND); model.apply('calcium', REBOUND);
    expect(model.apply('handoff', REBOUND).at(-1)?.id).toBe('handoff-refused');
    findings(model, REBOUND); model.advance(REBOUND + CALCIUM);
    expect(model.apply('handoff', REBOUND + CALCIUM).at(-1)?.id).toBe('handoff-refused');
    findings(model, REBOUND + CALCIUM);
    expect(model.apply('handoff', REBOUND + CALCIUM).at(-1)?.id).toBe('handoff');
  });

  it('does not let a late shifting checkpoint overwrite delivered removal, or invent an observed early response', () => {
    const model = new RenalHyperkalemia(); model.apply('deliver-removal', 0);
    expect(findings(model, REMOVAL)).toMatchObject({ potassiumMmolL: 5.1, glucoseMgDl: 100 });
    model.apply('shift', REMOVAL);
    expect(findings(model, REMOVAL + SHIFT)).toMatchObject({ potassiumMmolL: 5.1, glucoseMgDl: 100 });
    expect(findings(model, REMOVAL + REBOUND)).toMatchObject({ potassiumMmolL: 5.1, glucoseMgDl: 100 });
    expect(model.snapshot(REMOVAL + REBOUND)).toMatchObject({ shiftResponseObserved: false,
      removalResponseObserved: true, reboundObserved: false });
  });

  it.each([['ecg-resolved', 'ecg-resolution-refused', 'ecgResolvedAttempted'],
    ['stop-glucose-monitoring', 'glucose-monitoring-stop-refused', 'glucoseMonitoringStopAttempted']] as const)(
    'refuses %s, retains its history, and still allows later care and handoff', (action, event, flag) => {
      const model = new RenalHyperkalemia();
      expect(model.apply(action, 0).at(-1)?.id).toBe(event); expect(model.snapshot(0)[flag]).toBe(true);
      ownership(model); for (const care of ['calcium', 'shift', 'deliver-removal']) model.apply(care, 0);
      findings(model, REMOVAL); model.apply('handoff', REMOVAL);
      expect(model.snapshot(REMOVAL).ended).toBe('handoff'); expect(model.snapshot(REMOVAL)[flag]).toBe(true);
    });

  it('keeps snapshots read-only and detached, does not advance by reading future clocks, and freezes ended state', () => {
    const model = new RenalHyperkalemia(); model.apply('calcium', 0); model.apply('shift', 0); model.apply('deliver-removal', 0);
    expect(model.snapshot(REMOVAL)).toMatchObject({ calciumDueInSeconds: 0, shiftDueInSeconds: 0,
      removalDueInSeconds: 0, observation: null, removalResponseObserved: false });
    expect(model.rhythm()).toBe('sinus'); expect(model.vitals().heartRateBpm).toBe(64);
    findings(model, REMOVAL); const copy = model.snapshot(REMOVAL);
    Object.assign(copy.observation!, { potassiumMmolL: -1 }); Object.assign(copy.glucoseObservation!, { glucoseMgDl: -1 });
    Object.assign(copy.ecgObservation!, { rhythm: 'wrong' });
    expect(model.snapshot(REMOVAL).observation?.potassiumMmolL).toBe(5.1);
    expect(model.snapshot(REMOVAL).glucoseObservation?.glucoseMgDl).toBe(100);
    expect(model.snapshot(REMOVAL).ecgObservation?.rhythm).toBe('sinus');
    ownership(model, REMOVAL); model.apply('handoff', REMOVAL); const end = model.snapshot(REMOVAL);
    expect(model.advance(SESSION)).toEqual([]);
    for (const action of RENAL_HYPERKALEMIA_ACTIONS) expect(model.apply(action, SESSION).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(SESSION)).toEqual(end);
  });

  it('has separate no-action and unfinished stops without treating administrative care or calcium as potassium removal', () => {
    const model = new RenalHyperkalemia(); ownership(model); model.apply('calcium', 0);
    model.advance(DELAY); expect(model.vitals().heartRateBpm).toBe(42);
    model.advance(TAKEOVER - 1); expect(model.snapshot(TAKEOVER - 1).ended).toBeNull();
    expect(model.apply('shift', TAKEOVER).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(TAKEOVER)).toMatchObject({ ended: 'instructor-takeover', shiftAtTick: null });
    const treated = new RenalHyperkalemia(); treated.apply('deliver-removal', TAKEOVER - 1);
    treated.advance(TAKEOVER); expect(treated.snapshot(TAKEOVER).ended).toBeNull();
    treated.advance(SESSION); expect(treated.snapshot(SESSION).ended).toBe('instructor-takeover');
    const invalid = new RenalHyperkalemia();
    for (const action of [null, {}, '__proto__', 2]) expect(invalid.apply(action, 0).at(-1)?.id).toBe('action-refused');
  });

  it.each([0, 60000, 100000])('keeps sparse checkpoint ordering and results identical to individual ticks with removal initiated at %s', (removalAt) => {
    const fine = new RenalHyperkalemia(); const coarse = new RenalHyperkalemia();
    for (const model of [fine, coarse]) { model.apply('calcium', 0); model.apply('shift', 0); }
    const events: ReturnType<RenalHyperkalemia['advance']> = [];
    for (let tick = 1; tick <= removalAt; tick++) events.push(...fine.advance(tick));
    expect(coarse.advance(removalAt)).toEqual(events);
    fine.apply('deliver-removal', removalAt); coarse.apply('deliver-removal', removalAt);
    events.length = 0;
    const stop = removalAt + REBOUND;
    for (let tick = removalAt + 1; tick <= stop; tick++) events.push(...fine.advance(tick));
    expect(coarse.advance(stop)).toEqual(events);
    expect(coarse.snapshot(stop)).toEqual(fine.snapshot(stop));
    expect(coarse.vitals()).toEqual(fine.vitals()); expect(coarse.rhythm()).toBe(fine.rhythm());
    expect(findings(coarse, stop)).toEqual(findings(fine, stop));
    expect(coarse.snapshot(stop).observation?.potassiumMmolL).toBe(5.1);
  });

  it('does not execute post-terminal calcium or removal responses when a coarse advance crosses the teaching stop', () => {
    const fine = new RenalHyperkalemia(); const coarse = new RenalHyperkalemia();
    for (const model of [fine, coarse]) {
      model.apply('shift', 0); model.apply('deliver-removal', SESSION - 1); model.apply('calcium', SESSION - 1);
    }
    const events = fine.advance(SESSION);
    expect(coarse.advance(SESSION + REMOVAL)).toEqual(events);
    expect(coarse.snapshot(SESSION + REMOVAL)).toEqual(fine.snapshot(SESSION));
    expect(coarse.rhythm()).toBe(fine.rhythm());
    expect(events.map(({ id }) => id)).toEqual(['instructor-takeover']);
  });

  it('binds reference fixture identities and reproduces complete model traces for all four courses', () => {
    expect(FIXTURES).toMatchObject({ scenarioId: 'hyperkalemia-cardioprotection-and-rebound', contentVersion: '0.1.0', seed: 4941 });
    expect(FIXTURES.expert).toHaveLength(11); expect(FIXTURES.recovery).toHaveLength(14);
    for (const name of ['expert', 'recovery', 'commonError', 'noAction'] as const) {
      const run = () => {
        const model = new RenalHyperkalemia(); const hash = createHash('sha256'); const actions = FIXTURES[name];
        const stop = name === 'expert' || name === 'recovery' ? actions.at(-1)![0] : TAKEOVER;
        for (let tick = 0; tick <= stop; tick++) {
          const events = model.advance(tick);
          for (const [at, action] of actions) if (at === tick) events.push(...model.apply(action, tick));
          hash.update(JSON.stringify({ tick, events, vitals: model.vitals(), rhythm: model.rhythm(), state: model.snapshot(tick) }));
        }
        return { digest: hash.digest('hex'), state: model.snapshot(stop) };
      };
      const first = run(); expect(run()).toEqual(first);
      expect(first.state.ended).toBe(name === 'expert' || name === 'recovery' ? 'handoff' : 'instructor-takeover');
      if (name === 'expert') expect(first.state).toMatchObject({ shiftResponseObserved: true,
        removalResponseObserved: true, reboundObserved: false, calciumRequests: 1 });
      if (name === 'recovery') expect(first.state).toMatchObject({ shiftResponseObserved: true, removalResponseObserved: true,
        reboundObserved: true, calciumRequests: 2, ecgResolvedAttempted: true, glucoseMonitoringStopAttempted: true });
    }
  }, 20000);
});

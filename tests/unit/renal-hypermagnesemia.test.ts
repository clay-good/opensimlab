import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RenalHypermagnesemia, supportsRenalHypermagnesemia, RENAL_HYPERMAGNESEMIA_ACTIONS,
  RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS as CALCIUM, RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS as REMOVAL,
  RENAL_HYPERMAGNESEMIA_DELAY_TICKS as DELAY, RENAL_HYPERMAGNESEMIA_TAKEOVER_TICKS as TAKEOVER,
  RENAL_HYPERMAGNESEMIA_SESSION_TICKS as SESSION,
} from '../../src/modules/renal-electrolyte/hypermagnesemia';
import { RENAL_HYPERMAGNESEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypermagnesemia-fixtures';

const OWNERSHIP = ['stop-magnesium', 'call-support', 'review-context', 'monitor'] as const;
function ownership(model: RenalHypermagnesemia, tick = 0) {
  for (const action of OWNERSHIP) model.apply(action, tick);
}
function full(model: RenalHypermagnesemia, tick: number) {
  model.apply('reassess', tick); return model.snapshot(tick).observation;
}
function care(model: RenalHypermagnesemia, tick = 0) {
  ownership(model, tick); model.apply('support-breathing', tick); model.apply('deliver-removal', tick);
}

describe('Renal hypermagnesemia: support, antagonism, and removal remain distinct', () => {
  it('binds the narrative identity and explicitly authored clocks', () => {
    const scenario = { ...ROUTINE_INDUCTION, metadata: { ...ROUTINE_INDUCTION.metadata,
      id: 'hypermagnesemia-antagonism-and-removal' }, timeline: ['renal-hypermagnesemia', 'renal-hypermagnesemia-boundary']
      .map((target) => ({ id: target, type: 'narrative' as const, target, atTick: 0, message: 'Authored boundary' })) };
    expect(supportsRenalHypermagnesemia(scenario)).toBe(true);
    for (const invalid of [ROUTINE_INDUCTION, { ...scenario, timeline: [] },
      { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsRenalHypermagnesemia(invalid)).toBe(false);
    }
    expect([CALCIUM, REMOVAL, DELAY, TAKEOVER, SESSION]).toEqual([18000, 36000, 3000, 18000, 108000]);
    expect(RENAL_HYPERMAGNESEMIA_ACTIONS).toHaveLength(13);
  });

  it('starts with no requested findings and no hidden current magnesium in the snapshot', () => {
    const model = new RenalHypermagnesemia();
    expect(model.snapshot(0)).toEqual({ supportActive: false, stopMagnesiumAtTick: null, breathingAtTick: null,
      calciumAtTick: null, lastCalciumAtTick: null, calciumRequests: 0, contextReviewedAtTick: null,
      removalAtTick: null, monitoringAtTick: null, calciumDueInSeconds: null, removalDueInSeconds: null,
      calciumResponseObserved: false, removalResponseObserved: false, recurrenceObserved: false,
      calciumClearanceAttempted: false, routineDiuresisAttempted: false, magnesiumObservation: null,
      neuromuscularObservation: null, observation: null, alertness: 'drowsy', choiceFeedback: null, ended: null,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false });
    expect(model.vitals()).toEqual({ heartRateBpm: 44, systolicMmHg: 86, diastolicMmHg: 48, meanArterialMmHg: 61,
      respiratoryRateBpm: 8, spo2Percent: 90, coreTemperatureC: 36.3, alertness: 'drowsy' });
    expect(full(model, 0)).toMatchObject({ magnesiumMmolL: 4.6, reflexesPresent: false, severeWeakness: true });
    expect(model.rhythm()).toBe('sinus');
  });

  it.each(OWNERSHIP)('accepts %s without supplying respiratory, calcium, or removal treatment', (action) => {
    const model = new RenalHypermagnesemia();
    expect(model.apply(action, 0)).toHaveLength(1); expect(model.apply(action, 1)).toEqual([]);
    expect(full(model, DELAY)).toMatchObject({ magnesiumMmolL: 4.6, heartRateBpm: 38, systolicMmHg: 78,
      diastolicMmHg: 42, meanArterialMmHg: 54, respiratoryRateBpm: 6, spo2Percent: 86 });
    model.advance(TAKEOVER); expect(model.snapshot(TAKEOVER).ended).toBe('instructor-takeover');
  });

  it('supports breathing immediately without a calcium, laboratory, or administrative gate', () => {
    const model = new RenalHypermagnesemia();
    expect(model.apply('support-breathing', 0).at(-1)?.id).toBe('breathing-support');
    expect(model.apply('support-breathing', 1)).toEqual([]);
    expect(full(model, DELAY)).toMatchObject({ magnesiumMmolL: 4.6, reflexesPresent: false, severeWeakness: true,
      respiratoryRateBpm: 14, spo2Percent: 96, heartRateBpm: 38 });
    model.advance(TAKEOVER); expect(model.snapshot(TAKEOVER).ended).toBeNull();
    model.advance(SESSION); expect(model.snapshot(SESSION).ended).toBe('instructor-takeover');
  });

  it('calcium has an immediate finite circulatory effect but no magnesium, reflex, or breathing effect', () => {
    const model = new RenalHypermagnesemia();
    expect(model.apply('calcium', 0).at(-1)?.id).toBe('calcium-antagonism');
    expect(full(model, 0)).toMatchObject({ magnesiumMmolL: 4.6, heartRateBpm: 62, systolicMmHg: 104,
      diastolicMmHg: 60, meanArterialMmHg: 75, respiratoryRateBpm: 8, spo2Percent: 90,
      reflexesPresent: false, severeWeakness: true });
    expect(model.snapshot(CALCIUM - 1).calciumDueInSeconds).toBe(1);
    expect(model.advance(CALCIUM).map((event) => event.id)).toEqual(['calcium-review-checkpoint']);
    expect(model.snapshot(CALCIUM)).toMatchObject({ calciumResponseObserved: true, recurrenceObserved: false,
      calciumDueInSeconds: null, observation: { atTick: 0, heartRateBpm: 62 } });
    expect(model.apply('reassess', CALCIUM).at(-1)?.id).toBe('recurrence-reassessment');
    expect(model.snapshot(CALCIUM)).toMatchObject({ recurrenceObserved: true,
      observation: { magnesiumMmolL: 4.6, heartRateBpm: 44, systolicMmHg: 86, respiratoryRateBpm: 8 } });
  });

  it('does not credit calcium with respiratory rescue after untreated deterioration', () => {
    const model = new RenalHypermagnesemia(); model.advance(DELAY); model.apply('calcium', DELAY);
    expect(full(model, DELAY)).toMatchObject({ heartRateBpm: 62, respiratoryRateBpm: 6, spo2Percent: 86 });
    expect(full(model, DELAY + CALCIUM)).toMatchObject({ heartRateBpm: 44, respiratoryRateBpm: 6, spo2Percent: 86 });
    model.apply('support-breathing', DELAY + CALCIUM);
    expect(model.vitals()).toMatchObject({ heartRateBpm: 44, respiratoryRateBpm: 14, spo2Percent: 96 });
  });

  it('counts individualized repeat calcium once per accepted tick and retains observed recurrence', () => {
    const model = new RenalHypermagnesemia(); model.apply('calcium', 0);
    expect(model.apply('calcium', 0)).toEqual([]);
    full(model, CALCIUM); model.apply('calcium', CALCIUM);
    expect(model.apply('calcium', CALCIUM)).toEqual([]);
    expect(model.snapshot(CALCIUM)).toMatchObject({ calciumAtTick: 0, lastCalciumAtTick: CALCIUM,
      calciumRequests: 2, calciumDueInSeconds: 1800, recurrenceObserved: true });
    expect(full(model, CALCIUM)).toMatchObject({ magnesiumMmolL: 4.6, heartRateBpm: 62 });
    expect(model.snapshot(CALCIUM).calciumResponseObserved).toBe(true);
  });

  it('delivers removal without other care or new measurements and leaves unsupported breathing impaired', () => {
    const model = new RenalHypermagnesemia();
    expect(model.apply('deliver-removal', 0).at(-1)?.id).toBe('removal-care');
    expect(model.apply('deliver-removal', 1)).toEqual([]);
    expect(model.advance(REMOVAL - 1)).toEqual([]);
    expect(model.snapshot(REMOVAL - 1).removalDueInSeconds).toBe(1);
    const events = model.advance(REMOVAL);
    expect(events.map((event) => event.id)).toEqual(['removal-checkpoint']);
    expect(JSON.stringify(events)).not.toMatch(/2\.4|reflexes.*present/);
    expect(model.snapshot(REMOVAL)).toMatchObject({ observation: null, magnesiumObservation: null,
      removalResponseObserved: false, alertness: 'awake with residual weakness' });
    expect(full(model, REMOVAL)).toMatchObject({ magnesiumMmolL: 2.4, reflexesPresent: true, severeWeakness: false,
      heartRateBpm: 68, systolicMmHg: 110, diastolicMmHg: 66, meanArterialMmHg: 81,
      respiratoryRateBpm: 10, spo2Percent: 92, alertness: 'awake with residual weakness' });
    expect(model.snapshot(REMOVAL)).toMatchObject({ calciumResponseObserved: false, recurrenceObserved: false,
      removalResponseObserved: true });
  });

  it.each([['support-breathing', 'deliver-removal'], ['deliver-removal', 'support-breathing']])(
    'keeps respiratory support after removal with either accepted treatment order: %s then %s', (first, second) => {
      const model = new RenalHypermagnesemia(); model.apply(first, 0); model.apply(second, 0);
      expect(full(model, REMOVAL)).toMatchObject({ magnesiumMmolL: 2.4, respiratoryRateBpm: 14, spo2Percent: 96 });
      expect(model.snapshot(REMOVAL)).toMatchObject({ breathingAtTick: 0, supportActive: false, contextReviewedAtTick: null });
    });

  it('keeps partial measurements separate from full assessment and historical phase credit', () => {
    const model = new RenalHypermagnesemia(); care(model); model.apply('calcium', 0); full(model, 0);
    model.apply('check-magnesium', CALCIUM); model.apply('check-neuromuscular', CALCIUM);
    expect(model.snapshot(CALCIUM)).toMatchObject({ recurrenceObserved: false,
      magnesiumObservation: { atTick: CALCIUM, magnesiumMmolL: 4.6 },
      neuromuscularObservation: { atTick: CALCIUM, reflexesPresent: false, severeWeakness: true },
      observation: { atTick: 0, heartRateBpm: 62 } });
    expect(model.apply('handoff', CALCIUM).at(-1)?.id).toBe('handoff-refused');
    full(model, CALCIUM); expect(model.apply('handoff', CALCIUM).at(-1)?.id).toBe('handoff');
  });

  it('requires current findings after respiratory support changes actual state', () => {
    const model = new RenalHypermagnesemia(); ownership(model); model.apply('deliver-removal', 0);
    model.apply('calcium', 0); full(model, 1); model.apply('support-breathing', 2);
    expect(model.apply('handoff', 2).at(-1)?.id).toBe('handoff-refused');
    full(model, 2); expect(model.apply('handoff', 2).at(-1)?.id).toBe('handoff');
  });

  it('does not invalidate a current full panel merely for repeat calcium while already protected', () => {
    const model = new RenalHypermagnesemia(); care(model); model.apply('calcium', 0); full(model, 1);
    model.apply('calcium', 2);
    expect(model.apply('handoff', 2).at(-1)?.id).toBe('handoff');
  });

  it('allows removal-first handoff without unnecessary late calcium or backfilled calcium observations', () => {
    const model = new RenalHypermagnesemia(); care(model); full(model, 0);
    expect(model.apply('handoff', 0).at(-1)?.id).toBe('handoff-refused');
    expect(model.apply('reassess', REMOVAL).at(-1)?.id).toBe('removal-reassessment');
    expect(model.snapshot(REMOVAL)).toMatchObject({ calciumAtTick: null, calciumResponseObserved: false,
      recurrenceObserved: false, removalResponseObserved: true });
    expect(model.apply('handoff', REMOVAL).at(-1)?.id).toBe('handoff');
  });

  it('expiry after removal and calcium given after removal cannot manufacture a stale full assessment', () => {
    const model = new RenalHypermagnesemia(); care(model); model.apply('calcium', CALCIUM + 1);
    full(model, REMOVAL);
    const state = model.vitals();
    expect(model.advance(REMOVAL + 1).map((event) => event.id)).toEqual(['calcium-review-checkpoint']);
    expect(model.vitals()).toEqual(state);
    model.apply('calcium', REMOVAL + 2); model.advance(REMOVAL + CALCIUM + 2);
    expect(model.vitals()).toEqual(state);
    expect(model.snapshot(REMOVAL + CALCIUM + 2)).toMatchObject({ calciumResponseObserved: false,
      recurrenceObserved: false, removalResponseObserved: true });
    expect(model.apply('handoff', REMOVAL + CALCIUM + 2).at(-1)?.id).toBe('handoff');
  });

  it('sorts calcium expiration and removal chronologically under sparse and fine advancement', () => {
    for (const calciumTick of [0, CALCIUM, CALCIUM + 1]) {
      const fine = new RenalHypermagnesemia(); const coarse = new RenalHypermagnesemia();
      for (const model of [fine, coarse]) { care(model); model.apply('calcium', calciumTick); }
      const fineEvents = [];
      for (let tick = calciumTick + 1; tick <= REMOVAL + CALCIUM; tick += 1) fineEvents.push(...fine.advance(tick));
      const coarseEvents = coarse.advance(REMOVAL + CALCIUM);
      expect(coarseEvents).toEqual(fineEvents);
      expect(coarse.snapshot(REMOVAL + CALCIUM)).toEqual(fine.snapshot(REMOVAL + CALCIUM));
      expect(full(coarse, REMOVAL + CALCIUM)).toEqual(full(fine, REMOVAL + CALCIUM));
      expect(coarse.apply('handoff', REMOVAL + CALCIUM)).toEqual(fine.apply('handoff', REMOVAL + CALCIUM));
    }
  });

  it('caps a sparse advance at the terminal boundary without processing later pending removal', () => {
    const model = new RenalHypermagnesemia(); model.apply('support-breathing', 0);
    model.apply('deliver-removal', SESSION - 1);
    const events = model.advance(SESSION + REMOVAL);
    expect(events.map((event) => event.id)).toEqual(['instructor-takeover']);
    expect(model.vitals()).toMatchObject({ heartRateBpm: 38, respiratoryRateBpm: 14 });
    expect(model.snapshot(SESSION)).toMatchObject({ removalResponseObserved: false, ended: 'instructor-takeover' });
    const ended = model.snapshot(SESSION);
    expect(model.apply('reassess', SESSION + REMOVAL).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(SESSION + REMOVAL)).toEqual(ended);
  });

  it('refuses new rescue at the exact untreated takeover boundary and records no fabricated outcome', () => {
    const model = new RenalHypermagnesemia();
    expect(model.apply('calcium', TAKEOVER).map((event) => event.id)).toEqual([
      'clinical-deterioration', 'instructor-takeover', 'action-refused']);
    expect(model.snapshot(TAKEOVER)).toMatchObject({ calciumAtTick: null, observation: null, ended: 'instructor-takeover' });
  });

  it('unknown values never invoke payload accessors or start treatment', () => {
    const model = new RenalHypermagnesemia(); let read = false;
    const payload = { get action() { read = true; throw new Error('must not inspect'); } };
    for (const action of [payload, null, undefined, 1, false, [], '__proto__']) {
      expect(model.apply(action, 0).at(-1)?.id).toBe('action-refused');
    }
    expect(read).toBe(false);
    expect(model.snapshot(0)).toMatchObject({ calciumAtTick: null, removalAtTick: null, breathingAtTick: null });
  });

  it('snapshots are detached and reading future clocks never advances private physiology', () => {
    const model = new RenalHypermagnesemia(); model.apply('deliver-removal', 0); full(model, 0);
    const snapshot = model.snapshot(REMOVAL);
    expect(snapshot.removalDueInSeconds).toBe(0);
    expect(snapshot.observation?.magnesiumMmolL).toBe(4.6);
    Object.assign(snapshot.observation!, { magnesiumMmolL: 99 });
    Object.assign(snapshot.neuromuscularObservation!, { reflexesPresent: true });
    Object.assign(snapshot.magnesiumObservation!, { magnesiumMmolL: 99 });
    expect(model.snapshot(0)).toMatchObject({ observation: { magnesiumMmolL: 4.6 },
      neuromuscularObservation: { reflexesPresent: false }, magnesiumObservation: { magnesiumMmolL: 4.6 } });
  });

  it.each(['expert', 'recovery', 'commonError', 'noAction'] as const)('replays the literal %s fixture with deterministic state and retained mistakes', (name) => {
    const hashes: string[] = [];
    for (let run = 0; run < 2; run += 1) {
      const model = new RenalHypermagnesemia(); const hash = createHash('sha256');
      for (const [tick, action] of FIXTURES[name]) {
        hash.update(JSON.stringify([model.apply(action, tick), model.snapshot(tick), model.vitals()]));
      }
      const end = name === 'expert' ? 36003 : name === 'recovery' ? 54006 : TAKEOVER;
      model.advance(end);
      const snapshot = model.snapshot(end);
      expect(snapshot.ended).toBe(name === 'expert' || name === 'recovery' ? 'handoff' : 'instructor-takeover');
      if (name === 'expert' || name === 'recovery') expect(snapshot).toMatchObject({ calciumResponseObserved: true,
        recurrenceObserved: true, removalResponseObserved: true, observation: { magnesiumMmolL: 2.4,
          respiratoryRateBpm: 14, spo2Percent: 96, severeWeakness: false, alertness: 'awake with residual weakness' } });
      expect(snapshot.calciumClearanceAttempted).toBe(name === 'recovery' || name === 'commonError');
      expect(snapshot.routineDiuresisAttempted).toBe(name === 'recovery' || name === 'commonError');
      hashes.push(hash.update(JSON.stringify(snapshot)).digest('hex'));
    }
    expect(hashes[0]).toBe(hashes[1]);
    expect(FIXTURES).toMatchObject({ scenarioId: 'hypermagnesemia-antagonism-and-removal', contentVersion: '0.1.0', seed: 4999 });
  });
});

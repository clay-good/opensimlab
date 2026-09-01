import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RenalHypocalcemia, supportsRenalHypocalcemia, RENAL_HYPOCALCEMIA_ACTIONS,
  RENAL_HYPOCALCEMIA_RESCUE_TICKS as RESCUE, RENAL_HYPOCALCEMIA_CONTINUING_TICKS as CONTINUING,
  RENAL_HYPOCALCEMIA_RECURRENCE_TICKS as RECURRENCE, RENAL_HYPOCALCEMIA_DELAY_TICKS as DELAY,
  RENAL_HYPOCALCEMIA_TAKEOVER_TICKS as TAKEOVER, RENAL_HYPOCALCEMIA_SESSION_TICKS as SESSION,
} from '../../src/modules/renal-electrolyte/hypocalcemia';
import { RENAL_HYPOCALCEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypocalcemia-fixtures';

const OWNERSHIP = ['call-support', 'review-context', 'monitor', 'coordinate-mineral-care', 'arrange-follow-up'] as const;
function ownership(model: RenalHypocalcemia, tick = 0) {
  for (const action of OWNERSHIP) model.apply(action, tick);
}
function full(model: RenalHypocalcemia, tick: number) {
  model.apply('reassess', tick); return model.snapshot(tick).observation;
}
function calcium(model: RenalHypocalcemia, tick = 0) {
  model.apply('rescue-calcium', tick); model.apply('continue-calcium', tick);
}

describe('Renal hypocalcemia: ionized calcium, rescue, continuing care, and CKD context', () => {
  it('binds the exact narrative identity and authored clocks', () => {
    const scenario = { ...ROUTINE_INDUCTION, metadata: { ...ROUTINE_INDUCTION.metadata,
      id: 'hypocalcemia-ionized-calcium-and-ckd' }, timeline: ['renal-hypocalcemia', 'renal-hypocalcemia-boundary']
      .map((target) => ({ id: target, type: 'narrative' as const, target, atTick: 0, message: 'Authored boundary' })) };
    expect(supportsRenalHypocalcemia(scenario)).toBe(true);
    for (const invalid of [ROUTINE_INDUCTION, { ...scenario, timeline: [] },
      { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsRenalHypocalcemia(invalid)).toBe(false);
    }
    expect([RESCUE, CONTINUING, RECURRENCE, DELAY, TAKEOVER, SESSION]).toEqual([9000, 36000, 27000, 3000, 18000, 108000]);
    expect(RENAL_HYPOCALCEMIA_ACTIONS).toHaveLength(14);
  });

  it('starts without care or requested ionized and symptom findings', () => {
    const model = new RenalHypocalcemia();
    expect(model.snapshot(0)).toEqual({ supportActive: false, rescueAtTick: null, continuingAtTick: null,
      contextReviewedAtTick: null, monitoringAtTick: null, mineralCareAtTick: null, followUpAtTick: null,
      rescueDueInSeconds: null, continuingDueInSeconds: null, rescueResponseObserved: false,
      continuingResponseObserved: false, recurrenceObserved: false, adjustedReassuranceAttempted: false,
      oralOnlyAttempted: false, stoppedAfterReliefAttempted: false, ionizedObservation: null,
      symptomObservation: null, observation: null, alertness: 'awake', choiceFeedback: null, ended: null,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false });
    expect(model.vitals()).toEqual({ systolicMmHg: 138, diastolicMmHg: 78, meanArterialMmHg: 98,
      heartRateBpm: 102, respiratoryRateBpm: 22, spo2Percent: 98, coreTemperatureC: 36.8, alertness: 'awake' });
    expect(full(model, 0)).toMatchObject({ ionizedCalciumMmolL: 0.86, carpopedalSpasm: true, perioralTingling: true });
    expect(model.rhythm()).toBe('sinus');
  });

  it.each(OWNERSHIP)('accepts %s independently without a rapid mineral or calcium effect', (action) => {
    const model = new RenalHypocalcemia();
    expect(model.apply(action, 0)).toHaveLength(1); expect(model.apply(action, 1)).toEqual([]);
    expect(model.snapshot(1)).toMatchObject({ rescueAtTick: null, continuingAtTick: null, observation: null });
    expect(full(model, DELAY)).toMatchObject({ ionizedCalciumMmolL: 0.86, heartRateBpm: 112,
      respiratoryRateBpm: 24, carpopedalSpasm: true, perioralTingling: true });
    model.advance(TAKEOVER); expect(model.snapshot(TAKEOVER).ended).toBe('instructor-takeover');
  });

  it('accepts rescue without administration, mineral planning, or new laboratory gates', () => {
    const model = new RenalHypocalcemia();
    expect(model.apply('rescue-calcium', 0).at(-1)?.id).toBe('calcium-rescue');
    expect(model.apply('rescue-calcium', 1)).toEqual([]);
    expect(model.advance(RESCUE - 1)).toEqual([]);
    expect(model.snapshot(RESCUE - 1).rescueDueInSeconds).toBe(1);
    expect(model.apply('reassess', RESCUE).map((event) => event.id)).toEqual(['rescue-checkpoint', 'rescue-reassessment']);
    expect(model.snapshot(RESCUE)).toMatchObject({ supportActive: false, mineralCareAtTick: null,
      rescueResponseObserved: true, continuingResponseObserved: false, recurrenceObserved: false,
      observation: { ionizedCalciumMmolL: 0.96, carpopedalSpasm: false, perioralTingling: true,
        heartRateBpm: 90, respiratoryRateBpm: 18, systolicMmHg: 138, diastolicMmHg: 78, meanArterialMmHg: 98 } });
  });

  it('allows continuing calcium in the same tick after rescue without waiting for its response', () => {
    const model = new RenalHypocalcemia();
    expect(model.apply('continue-calcium', 0).at(-1)?.id).toBe('continuing-review-refused');
    model.apply('rescue-calcium', 0);
    expect(model.apply('continue-calcium', 0).at(-1)?.id).toBe('calcium-continuation');
    expect(model.apply('continue-calcium', 1)).toEqual([]);
    expect(model.snapshot(0)).toMatchObject({ rescueAtTick: 0, continuingAtTick: 0,
      continuingDueInSeconds: 3600, observation: null, mineralCareAtTick: null, followUpAtTick: null,
      supportActive: false, monitoringAtTick: null, contextReviewedAtTick: null });
    expect(full(model, CONTINUING - 1)).toMatchObject({ ionizedCalciumMmolL: 0.96, carpopedalSpasm: false });
    expect(model.apply('reassess', CONTINUING).at(-1)?.id).toBe('continuing-reassessment');
    expect(model.snapshot(CONTINUING)).toMatchObject({ continuingResponseObserved: true, recurrenceObserved: false,
      observation: { ionizedCalciumMmolL: 1.03, carpopedalSpasm: false, perioralTingling: true,
        heartRateBpm: 86, respiratoryRateBpm: 18, alertness: 'awake' } });
  });

  it('separates transient relief, unobserved recurrence, and later requested recurrent findings', () => {
    const model = new RenalHypocalcemia(); model.apply('rescue-calcium', 0); full(model, RESCUE);
    const events = model.advance(RECURRENCE);
    expect(events.map((event) => event.id)).toEqual(['recurrence-review-checkpoint']);
    expect(JSON.stringify(events)).not.toMatch(/0\.88|spasm/);
    expect(model.snapshot(RECURRENCE)).toMatchObject({ recurrenceObserved: false,
      observation: { atTick: RESCUE, ionizedCalciumMmolL: 0.96, carpopedalSpasm: false } });
    expect(model.apply('reassess', RECURRENCE).at(-1)?.id).toBe('recurrence-reassessment');
    expect(model.snapshot(RECURRENCE)).toMatchObject({ rescueResponseObserved: true, recurrenceObserved: true,
      observation: { ionizedCalciumMmolL: 0.88, carpopedalSpasm: true, perioralTingling: true,
        heartRateBpm: 104, respiratoryRateBpm: 22 } });
  });

  it('retains recurrence after recovery and never backfills the missed early panel', () => {
    const model = new RenalHypocalcemia(); model.apply('rescue-calcium', 0); full(model, RECURRENCE);
    model.apply('continue-calcium', RECURRENCE + 1);
    expect(full(model, RECURRENCE + CONTINUING)?.ionizedCalciumMmolL).toBe(0.88);
    expect(full(model, RECURRENCE + CONTINUING + 1)).toMatchObject({ ionizedCalciumMmolL: 1.03,
      carpopedalSpasm: false, perioralTingling: true });
    expect(model.snapshot(RECURRENCE + CONTINUING + 1)).toMatchObject({ recurrenceObserved: true,
      continuingResponseObserved: true, rescueResponseObserved: false });
    ownership(model, RECURRENCE + CONTINUING + 1);
    expect(model.apply('handoff', RECURRENCE + CONTINUING + 1).at(-1)?.id).toBe('handoff');
  });

  it('keeps partial ionized and symptom findings separate and refuses stale full recurrence handoff', () => {
    const model = new RenalHypocalcemia(); model.apply('rescue-calcium', 0); ownership(model); full(model, RESCUE);
    model.apply('check-symptoms', RECURRENCE);
    expect(model.snapshot(RECURRENCE)).toMatchObject({ ionizedObservation: { atTick: RESCUE, ionizedCalciumMmolL: 0.96 },
      symptomObservation: { atTick: RECURRENCE, carpopedalSpasm: true }, recurrenceObserved: false });
    model.apply('check-ionized', RECURRENCE + 1);
    expect(model.snapshot(RECURRENCE + 1)).toMatchObject({ ionizedObservation: { ionizedCalciumMmolL: 0.88 },
      observation: { atTick: RESCUE, ionizedCalciumMmolL: 0.96, carpopedalSpasm: false }, recurrenceObserved: false });
    model.apply('continue-calcium', RECURRENCE + 1);
    expect(model.apply('handoff', RECURRENCE + 1).at(-1)?.id).toBe('handoff-refused');
    full(model, RECURRENCE + 1);
    expect(model.snapshot(RECURRENCE + 1)).toMatchObject({ recurrenceObserved: true, continuingResponseObserved: false,
      continuingDueInSeconds: 3600 });
    expect(model.apply('handoff', RECURRENCE + 1).at(-1)?.id).toBe('handoff');
  });

  it('allows final-only full findings without all prior panels but requires a current post-response phase', () => {
    const model = new RenalHypocalcemia(); calcium(model); ownership(model); full(model, 0);
    model.apply('check-ionized', CONTINUING); model.apply('check-symptoms', CONTINUING);
    expect(model.snapshot(CONTINUING)).toMatchObject({ rescueResponseObserved: false, continuingResponseObserved: false });
    expect(model.apply('handoff', CONTINUING).at(-1)?.id).toBe('handoff-refused');
    full(model, CONTINUING);
    expect(model.snapshot(CONTINUING)).toMatchObject({ rescueResponseObserved: false, continuingResponseObserved: true });
    expect(model.apply('handoff', CONTINUING).at(-1)?.id).toBe('handoff');
  });

  it.each(OWNERSHIP)('requires %s at handoff without making it a calcium-response gate', (missing) => {
    const model = new RenalHypocalcemia(); calcium(model);
    for (const action of OWNERSHIP) if (action !== missing) model.apply(action, 0);
    expect(full(model, CONTINUING)?.ionizedCalciumMmolL).toBe(1.03);
    expect(model.apply('handoff', CONTINUING).at(-1)?.id).toBe('handoff-refused');
    model.apply(missing, CONTINUING);
    expect(model.apply('handoff', CONTINUING).at(-1)?.id).toBe('handoff');
  });

  it('retains refused reassurance, oral-only substitution, and stopping shortcuts through recovery', () => {
    const model = new RenalHypocalcemia();
    for (const action of ['trust-adjusted-total', 'oral-only', 'stop-after-relief']) {
      expect(model.apply(action, 0).at(-1)?.id).toContain('refused');
    }
    calcium(model); ownership(model); full(model, CONTINUING);
    expect(model.apply('handoff', CONTINUING).at(-1)?.id).toBe('handoff');
    const ended = model.snapshot(CONTINUING);
    expect(ended).toMatchObject({ adjustedReassuranceAttempted: true, oralOnlyAttempted: true,
      stoppedAfterReliefAttempted: true, ended: 'handoff' });
    expect(model.advance(SESSION)).toEqual([]);
    expect(model.apply('rescue-calcium', SESSION).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(SESSION)).toEqual(ended);
  });

  it('does not expose new labs, symptoms, or numerical QT through unrequested checkpoints and protects snapshots', () => {
    const model = new RenalHypocalcemia(); calcium(model); full(model, 0);
    expect(model.snapshot(SESSION).continuingDueInSeconds).toBe(0);
    expect(model.vitals().heartRateBpm).toBe(102);
    expect(model.snapshot(SESSION).observation?.ionizedCalciumMmolL).toBe(0.86);
    const events = model.advance(CONTINUING);
    expect(JSON.stringify(events)).not.toMatch(/0\.96|1\.03|spasm absent/);
    expect(model.snapshot(CONTINUING)).toMatchObject({ rescueResponseObserved: false, continuingResponseObserved: false,
      observation: { ionizedCalciumMmolL: 0.86, carpopedalSpasm: true } });
    for (const field of ['totalCalciumMgDl', 'adjustedCalciumMgDl', 'albuminGdl', 'pH', 'phosphateMgDl', 'egfr', 'qtcMs']) {
      expect(model.snapshot(CONTINUING)).not.toHaveProperty(field);
      expect(model.snapshot(CONTINUING).observation).not.toHaveProperty(field);
    }
    const copy = model.snapshot(CONTINUING);
    Object.assign(copy.observation!, { ionizedCalciumMmolL: 999 });
    Object.assign(copy.ionizedObservation!, { ionizedCalciumMmolL: 999 });
    Object.assign(copy.symptomObservation!, { carpopedalSpasm: false });
    expect(model.snapshot(CONTINUING).observation?.ionizedCalciumMmolL).toBe(0.86);
    expect(model.snapshot(CONTINUING).ionizedObservation?.ionizedCalciumMmolL).toBe(0.86);
    expect(model.snapshot(CONTINUING).symptomObservation?.carpopedalSpasm).toBe(true);
  });

  it('orders early, recurrent, and late continuing checkpoints identically for fine and sparse advancement', () => {
    const fine = new RenalHypocalcemia(); const coarse = new RenalHypocalcemia();
    for (const model of [fine, coarse]) model.apply('rescue-calcium', 0);
    const events = [];
    for (let tick = 1; tick <= RECURRENCE; tick++) events.push(...fine.advance(tick));
    expect(coarse.advance(RECURRENCE)).toEqual(events);
    expect(coarse.snapshot(RECURRENCE)).toEqual(fine.snapshot(RECURRENCE));
    for (const model of [fine, coarse]) model.apply('continue-calcium', RECURRENCE + 1);
    const later = [];
    for (let tick = RECURRENCE + 2; tick <= SESSION + CONTINUING; tick++) later.push(...fine.advance(tick));
    expect(coarse.advance(SESSION + CONTINUING)).toEqual(later);
    expect(coarse.snapshot(SESSION + CONTINUING)).toEqual(fine.snapshot(SESSION + CONTINUING));
    expect(coarse.vitals()).toEqual(fine.vitals());
  });

  it('processes only checkpoints before terminal stops and accepts delayed rescue without a grading cutoff', () => {
    const untreated = new RenalHypocalcemia();
    expect(untreated.apply('rescue-calcium', TAKEOVER).map((event) => event.id))
      .toEqual(['clinical-deterioration', 'instructor-takeover', 'action-refused']);
    expect(untreated.snapshot(TAKEOVER).rescueAtTick).toBe(null);
    const late = new RenalHypocalcemia(); calcium(late, TAKEOVER - 1); ownership(late, TAKEOVER - 1);
    expect(full(late, TAKEOVER - 1 + CONTINUING)?.ionizedCalciumMmolL).toBe(1.03);
    expect(late.apply('handoff', TAKEOVER - 1 + CONTINUING).at(-1)?.id).toBe('handoff');
    const capped = new RenalHypocalcemia(); capped.apply('rescue-calcium', 0);
    capped.apply('continue-calcium', SESSION - 1);
    expect(capped.advance(SESSION + CONTINUING).map((event) => event.id)).toEqual(['instructor-takeover']);
    expect(capped.snapshot(SESSION + CONTINUING)).toMatchObject({ continuingDueInSeconds: null,
      continuingResponseObserved: false, ended: 'instructor-takeover' });
    expect(capped.vitals().heartRateBpm).toBe(104);
  });

  it('rejects unknown actions without executing payload properties or initiating care', () => {
    const model = new RenalHypocalcemia();
    const malicious = { get action() { throw new Error('must not read'); } };
    for (const action of [null, undefined, {}, malicious, '__proto__', 1, false]) {
      expect(model.apply(action, 0).at(-1)?.id).toBe('action-refused');
    }
    expect(model.snapshot(0)).toMatchObject({ rescueAtTick: null, continuingAtTick: null, observation: null });
  });

  it('binds literal fixtures and deterministically reproduces every model frame for four courses', () => {
    expect(FIXTURES).toMatchObject({ scenarioId: 'hypocalcemia-ionized-calcium-and-ckd', contentVersion: '0.1.0', seed: 4987 });
    expect(FIXTURES.expert).toHaveLength(10); expect(FIXTURES.recovery).toHaveLength(14);
    for (const name of ['expert', 'recovery', 'commonError', 'noAction'] as const) {
      const run = () => {
        const model = new RenalHypocalcemia(); const hash = createHash('sha256'); const actions = FIXTURES[name];
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
      if (name === 'expert' || name === 'recovery') expect(first.state).toMatchObject({ rescueResponseObserved: true,
        continuingResponseObserved: true, observation: { ionizedCalciumMmolL: 1.03, carpopedalSpasm: false, perioralTingling: true } });
      if (name === 'recovery') expect(first.state).toMatchObject({ recurrenceObserved: true, adjustedReassuranceAttempted: true,
        oralOnlyAttempted: true, stoppedAfterReliefAttempted: true });
      if (name === 'commonError') expect(first.state).toMatchObject({ rescueAtTick: null, observation: null,
        ionizedObservation: { atTick: 9000, ionizedCalciumMmolL: 0.86 } });
    }
  });
});

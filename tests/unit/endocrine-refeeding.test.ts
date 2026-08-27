import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import {
  Refeeding, supportsRefeeding, REFEEDING_ACTIONS, type RefeedingAction,
  REFEEDING_ELECTROLYTE_TICKS as EARLY, REFEEDING_RECURRENCE_TICKS as RECURRENCE,
  REFEEDING_RESPONSE_TICKS as RESPONSE, REFEEDING_DELAY_TICKS as DELAY,
  REFEEDING_TAKEOVER_TICKS as TAKEOVER, REFEEDING_SESSION_TICKS as SESSION,
} from '../../src/modules/endocrine-metabolic/refeeding';
import { REFEEDING_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/refeeding-fixtures';

const ownership = (model: Refeeding, tick = 0) => {
  for (const action of ['call-support', 'review-context', 'monitor', 'thiamine']) model.apply(action, tick);
};
const findings = (model: Refeeding, tick: number) => {
  model.apply('reassess', tick); return model.snapshot(tick).observation;
};

describe('Feeding-related electrolyte deterioration: separate care, findings, and retained learning', () => {
  it('binds the bounded narrative model, literal authored times, and reference transcript identity', () => {
    const scenario = { ...ROUTINE_INDUCTION, metadata: { ...ROUTINE_INDUCTION.metadata, id: FIXTURES.scenarioId },
      timeline: ['refeeding', 'refeeding-boundary'].map((target) => ({ id: target, atTick: 0,
        type: 'narrative' as const, target, message: 'Authored scenario boundary' })) };
    expect(supportsRefeeding(scenario)).toBe(true);
    for (const other of [ROUTINE_INDUCTION, { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsRefeeding(other)).toBe(false);
    }
    expect(FIXTURES).toMatchObject({ scenarioId: 'refeeding-electrolyte-shift', contentVersion: '0.1.0', seed: 4921 });
    expect([EARLY, RECURRENCE, RESPONSE, DELAY, TAKEOVER, SESSION]).toEqual([18000, 36000, 36000, 18000, 72000, 144000]);
    expect(REFEEDING_ACTIONS).toHaveLength(11); expect(FIXTURES.expert).toHaveLength(9);
    expect(FIXTURES.recovery).toHaveLength(13);
  });

  it('starts with no selected care or invented fresh observation and keeps labs out of live vitals', () => {
    const model = new Refeeding();
    expect(model.snapshot(0)).toMatchObject({ supportActive: false, contextReviewedAtTick: null, monitoringAtTick: null,
      thiamineAtTick: null, phosphateAtTick: null, completeElectrolytesAtTick: null, nutritionPlanAtTick: null,
      electrolyteDueInSeconds: null, responseDueInSeconds: null, electrolyteResponseObserved: false,
      responseObserved: false, recurrentDeclineObserved: false, feedingAdvanceAttempted: false,
      monitoringStopAttempted: false, observation: null, choiceFeedback: null, ended: null,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false });
    expect(model.vitals()).toEqual({ systolicMmHg: 102, diastolicMmHg: 64, meanArterialMmHg: 77,
      heartRateBpm: 112, respiratoryRateBpm: 22, spo2Percent: 97, coreTemperatureC: 36.7,
      alertness: 'awake with generalized weakness' });
    expect(findings(model, 0)).toMatchObject({ phosphateMmolL: 0.30, potassiumMmolL: 2.7, magnesiumMmolL: 0.48 });
  });

  it.each(['call-support', 'review-context', 'monitor', 'thiamine'])('accepts %s independently once without an immediate clinical or laboratory effect', (action) => {
    const model = new Refeeding(); const initial = model.vitals();
    expect(model.apply(action, 0)).toHaveLength(1); expect(model.apply(action, 1)).toEqual([]);
    expect(model.vitals()).toEqual(initial); expect(model.snapshot(1).observation).toBeNull();
    expect(model.snapshot(1).responseDueInSeconds).toBeNull();
  });

  it.each([['replace-electrolytes', 'review-nutrition'], ['review-nutrition', 'replace-electrolytes']] as const)('accepts %s then %s without administrative, vitamin, or laboratory gates', (first, second) => {
    const model = new Refeeding(); model.apply(first, 0); model.apply(second, 0);
    expect(model.snapshot(0)).toMatchObject({ completeElectrolytesAtTick: 0, nutritionPlanAtTick: 0,
      supportActive: false, contextReviewedAtTick: null, monitoringAtTick: null, thiamineAtTick: null,
      observation: null, responseDueInSeconds: 3600, electrolyteDueInSeconds: 1800 });
    expect(findings(model, RESPONSE)).toMatchObject({ phosphateMmolL: 0.55, potassiumMmolL: 3.3, magnesiumMmolL: 0.65 });
    expect(model.snapshot(RESPONSE).responseObserved).toBe(true);
    expect(model.apply('handoff', RESPONSE).at(-1)?.id).toBe('handoff-refused');
    ownership(model, RESPONSE); model.apply('handoff', RESPONSE);
    expect(model.snapshot(RESPONSE).ended).toBe('handoff');
  });

  it('accepts phosphate-focused care as a partial non-error step without improving potassium, magnesium, or vital signs', () => {
    const model = new Refeeding(); const initial = model.vitals();
    expect(model.apply('phosphate-only', 0).at(-1)?.id).toBe('phosphate-only');
    expect(model.advance(EARLY - 1)).toEqual([]); expect(model.snapshot(EARLY - 1).electrolyteDueInSeconds).toBe(1);
    expect(model.advance(EARLY).map(({ id }) => id)).toEqual(['phosphate-checkpoint']);
    expect(model.snapshot(EARLY)).toMatchObject({ observation: null, electrolyteResponseObserved: false,
      feedingAdvanceAttempted: false, monitoringStopAttempted: false, completeElectrolytesAtTick: null });
    expect(model.vitals()).toEqual(initial);
    expect(findings(model, EARLY)).toMatchObject({ phosphateMmolL: 0.45, potassiumMmolL: 2.7, magnesiumMmolL: 0.48 });
    expect(model.snapshot(EARLY)).toMatchObject({ electrolyteResponseObserved: true, responseObserved: false });
    model.advance(TAKEOVER); expect(model.snapshot(TAKEOVER).ended).toBe('instructor-takeover');
  });

  it('upgrades partial care without a waiting or error gate and gives each simultaneous checkpoint a unique event ID', () => {
    const model = new Refeeding(); model.apply('phosphate-only', 0); model.apply('replace-electrolytes', 0);
    expect(model.apply('phosphate-only', 1)).toEqual([]);
    const events = model.advance(EARLY);
    expect(events.map(({ id }) => id)).toEqual(['phosphate-checkpoint', 'electrolyte-checkpoint']);
    expect(new Set(events.map(({ id }) => id)).size).toBe(events.length);
    expect(findings(model, EARLY)).toMatchObject({ phosphateMmolL: 0.50, potassiumMmolL: 3.1, magnesiumMmolL: 0.60 });
    expect(model.snapshot(EARLY)).toMatchObject({ feedingAdvanceAttempted: false, monitoringStopAttempted: false });
    const alreadyComplete = new Refeeding(); alreadyComplete.apply('replace-electrolytes', 0);
    expect(alreadyComplete.apply('phosphate-only', 0).at(-1)?.id).toBe('action-refused');
    expect(alreadyComplete.snapshot(0).phosphateAtTick).toBeNull();
  });

  it('keeps laboratory changes and response status private until reassessment, despite visible vital-sign changes', () => {
    const model = new Refeeding(); findings(model, 0); model.apply('replace-electrolytes', 0);
    const initial = model.snapshot(0).observation; const events = model.advance(EARLY);
    expect(model.snapshot(EARLY)).toMatchObject({ observation: initial, electrolyteResponseObserved: false,
      responseObserved: false, recurrentDeclineObserved: false });
    expect(model.vitals()).toMatchObject({ systolicMmHg: 106, diastolicMmHg: 66, meanArterialMmHg: 79,
      heartRateBpm: 100, respiratoryRateBpm: 20 });
    expect(JSON.stringify({ snapshot: model.snapshot(EARLY), events, vitals: model.vitals() })).not.toMatch(/0\.5|3\.1|0\.6/);
    findings(model, EARLY); expect(model.snapshot(EARLY).electrolyteResponseObserved).toBe(true);
  });

  it('does not convert a phosphate-only finding into comprehensive-response evidence merely by accepting complete care', () => {
    const model = new Refeeding(); model.apply('phosphate-only', 0);
    expect(model.apply('reassess', EARLY).at(-1)?.id).toBe('electrolyte-reassessment');
    model.apply('replace-electrolytes', EARLY + 1);
    expect(model.apply('reassess', EARLY + 1).at(-1)?.id).toBe('electrolyte-reassessment');
    expect(model.snapshot(EARLY + 1).observation).toMatchObject({ phosphateMmolL: 0.45, potassiumMmolL: 2.7, magnesiumMmolL: 0.48 });
    expect(model.apply('reassess', 2 * EARLY + 1).at(-1)?.id).toBe('complete-electrolyte-reassessment');
    expect(model.snapshot(2 * EARLY + 1).observation).toMatchObject({ phosphateMmolL: 0.50, potassiumMmolL: 3.1, magnesiumMmolL: 0.60 });
  });

  it('shows recurrent incomplete-care decline only in a requested finding and permits later recovery without erasing it', () => {
    const model = new Refeeding(); ownership(model); model.apply('replace-electrolytes', 0); findings(model, EARLY);
    const early = model.snapshot(EARLY).observation;
    expect(model.advance(RECURRENCE - 1)).toEqual([]);
    const events = model.advance(RECURRENCE);
    expect(events.map(({ id }) => id)).toEqual(['nutrition-reassessment-checkpoint']);
    expect(events[0]!.message).not.toMatch(/0\.35|2\.8|0\.50|recurr/);
    expect(model.snapshot(RECURRENCE)).toMatchObject({ observation: early, recurrentDeclineObserved: false });
    expect(model.vitals()).toMatchObject({ systolicMmHg: 102, heartRateBpm: 112, respiratoryRateBpm: 22 });
    expect(findings(model, RECURRENCE)).toMatchObject({ phosphateMmolL: 0.35, potassiumMmolL: 2.8, magnesiumMmolL: 0.50 });
    expect(model.snapshot(RECURRENCE).recurrentDeclineObserved).toBe(true);
    model.apply('review-nutrition', RECURRENCE);
    expect(model.snapshot(RECURRENCE).responseDueInSeconds).toBe(3600);
    model.advance(RECURRENCE + RESPONSE);
    expect(model.apply('handoff', RECURRENCE + RESPONSE).at(-1)?.id).toBe('handoff-refused');
    findings(model, RECURRENCE + RESPONSE); model.apply('handoff', RECURRENCE + RESPONSE);
    expect(model.snapshot(RECURRENCE + RESPONSE)).toMatchObject({ ended: 'handoff', recurrentDeclineObserved: true,
      electrolyteResponseObserved: true, responseObserved: true,
      observation: { phosphateMmolL: 0.55, potassiumMmolL: 3.3, magnesiumMmolL: 0.65 } });
  });

  it('has identical public response timers and notifications across an unrequested recurrent boundary', () => {
    const early = new Refeeding(); const late = new Refeeding();
    for (const model of [early, late]) { model.apply('replace-electrolytes', 0); findings(model, EARLY); }
    const before = early.apply('review-nutrition', RECURRENCE - 1).at(-1);
    const after = late.apply('review-nutrition', RECURRENCE).at(-1);
    expect(before).toEqual(after);
    const comparable = (model: Refeeding, tick: number) => ({ ...model.snapshot(tick), nutritionPlanAtTick: 0 });
    expect(comparable(early, RECURRENCE - 1)).toEqual(comparable(late, RECURRENCE));
    early.advance(RECURRENCE); // Both have now emitted the public scheduled reassessment reminder.
    expect(early.advance(RECURRENCE - 1 + RESPONSE)).toEqual(late.advance(RECURRENCE + RESPONSE));
    expect(comparable(early, RECURRENCE - 1 + RESPONSE)).toEqual(comparable(late, RECURRENCE + RESPONSE));
    expect(late.snapshot(RECURRENCE + RESPONSE).recurrentDeclineObserved).toBe(false);
    // A late final assessment must not backfill a never-requested recurrence.
    findings(late, RECURRENCE + RESPONSE); expect(late.snapshot(RECURRENCE + RESPONSE).recurrentDeclineObserved).toBe(false);
  });

  it('preserves an explicit final-only observation without inventing an earlier assessment or blocking current handoff', () => {
    const model = new Refeeding(); ownership(model); model.apply('replace-electrolytes', 0); model.apply('review-nutrition', 0);
    expect(model.snapshot(RESPONSE)).toMatchObject({ responseDueInSeconds: 0, responseObserved: false, observation: null });
    expect(findings(model, RESPONSE)).toMatchObject({ phosphateMmolL: 0.55, potassiumMmolL: 3.3, magnesiumMmolL: 0.65 });
    expect(model.snapshot(RESPONSE)).toMatchObject({ electrolyteResponseObserved: false, responseObserved: true });
    model.apply('handoff', RESPONSE); expect(model.snapshot(RESPONSE).ended).toBe('handoff');
  });

  it.each(['call-support', 'review-context', 'monitor', 'thiamine'] as const)('requires missing %s for ownership, not for electrolyte or combined-care response', (missing) => {
    const model = new Refeeding();
    for (const action of ['call-support', 'review-context', 'monitor', 'thiamine']) if (action !== missing) model.apply(action, 0);
    model.apply('replace-electrolytes', 0); model.apply('review-nutrition', 0); findings(model, RESPONSE);
    expect(model.snapshot(RESPONSE).responseObserved).toBe(true);
    expect(model.apply('handoff', RESPONSE).at(-1)?.id).toBe('handoff-refused');
    model.apply(missing, RESPONSE); model.apply('handoff', RESPONSE);
    expect(model.snapshot(RESPONSE).ended).toBe('handoff');
  });

  it('retains refused shortcuts without stopping surveillance, advancing nutrition, or irreversibly blocking handoff', () => {
    const model = new Refeeding(); ownership(model); const initial = model.vitals();
    expect(model.apply('advance-feeding', 0).at(-1)?.id).toBe('feeding-advance-refused');
    expect(model.apply('stop-monitoring', 0).at(-1)?.id).toBe('monitoring-stop-refused');
    expect(model.vitals()).toEqual(initial);
    expect(model.snapshot(0)).toMatchObject({ nutritionPlanAtTick: null, monitoringAtTick: 0,
      feedingAdvanceAttempted: true, monitoringStopAttempted: true });
    model.apply('replace-electrolytes', 0); model.apply('review-nutrition', 0); findings(model, RESPONSE);
    model.apply('handoff', RESPONSE);
    expect(model.snapshot(RESPONSE)).toMatchObject({ ended: 'handoff', feedingAdvanceAttempted: true,
      monitoringStopAttempted: true });
  });

  it('deteriorates without either replacement pathway but does not disclose the new laboratory values automatically', () => {
    const model = new Refeeding(); findings(model, 0); const initial = model.snapshot(0).observation;
    expect(model.advance(DELAY - 1)).toEqual([]);
    const events = model.advance(DELAY); expect(events.map(({ id }) => id)).toEqual(['clinical-deterioration']);
    expect(model.snapshot(DELAY).observation).toEqual(initial);
    expect(model.vitals()).toMatchObject({ systolicMmHg: 94, diastolicMmHg: 58, meanArterialMmHg: 70,
      heartRateBpm: 124, respiratoryRateBpm: 26, spo2Percent: 97, coreTemperatureC: 36.7 });
    expect(events[0]!.message).not.toMatch(/0\.22|2\.5|0\.42/);
    expect(findings(model, DELAY)).toMatchObject({ phosphateMmolL: 0.22, potassiumMmolL: 2.5, magnesiumMmolL: 0.42 });
  });

  it('accepts complete care before the instructor boundary, refuses at it, and bounds incomplete nutrition care at four hours', () => {
    const before = new Refeeding(); before.apply('replace-electrolytes', TAKEOVER - 1); before.advance(TAKEOVER);
    expect(before.snapshot(TAKEOVER).ended).toBeNull();
    const exact = new Refeeding();
    expect(exact.apply('replace-electrolytes', TAKEOVER).at(-1)?.id).toBe('action-refused');
    expect(exact.snapshot(TAKEOVER)).toMatchObject({ ended: 'instructor-takeover', completeElectrolytesAtTick: null });
    const incomplete = new Refeeding(); incomplete.apply('replace-electrolytes', 0); incomplete.advance(SESSION);
    expect(incomplete.snapshot(SESSION)).toMatchObject({ ended: 'instructor-takeover', observation: null,
      responseObserved: false, recurrentDeclineObserved: false });
  });

  it('keeps observation copies isolated, never advances on snapshot reads, and freezes all ended state', () => {
    const model = new Refeeding(); model.apply('replace-electrolytes', 0);
    expect(model.snapshot(SESSION)).toMatchObject({ electrolyteDueInSeconds: 0, responseObserved: false, ended: null });
    for (const action of [null, '__proto__', { action: 'replace-electrolytes', private: 'private-token' }]) {
      expect(model.apply(action, 0).at(-1)?.id).toBe('action-refused');
      expect(JSON.stringify(model.snapshot(0))).not.toContain('private-token');
    }
    findings(model, 0); (model.snapshot(0).observation as { phosphateMmolL: number }).phosphateMmolL = 999;
    expect(model.snapshot(0).observation?.phosphateMmolL).toBe(0.30);
    model.advance(SESSION); const ended = model.snapshot(SESSION);
    expect(model.advance(SESSION + 1)).toEqual([]); model.apply('review-nutrition', SESSION + 1);
    expect(model.snapshot(SESSION + 1)).toEqual(ended);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays %s identically with coarse or incremental advancement', (course) => {
    const run = (incremental: boolean) => {
      const model = new Refeeding(); let previous = 0;
      for (const [tick, action] of FIXTURES[course] as readonly (readonly [number, RefeedingAction])[]) {
        if (incremental) for (let now = previous; now < tick; now++) model.advance(now);
        model.apply(action, tick); previous = tick;
      }
      if (course === 'commonError' || course === 'noAction') model.advance(SESSION);
      return model.snapshot(course === 'commonError' || course === 'noAction' ? SESSION : previous);
    };
    const expected = run(false); expect(run(true)).toEqual(expected);
    const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
    expect(hash(run(false))).toBe(hash(expected));
    expect(expected.ended).toBe(course === 'expert' || course === 'recovery' ? 'handoff' : 'instructor-takeover');
    if (course === 'recovery') expect(expected).toMatchObject({ feedingAdvanceAttempted: true, monitoringStopAttempted: true,
      recurrentDeclineObserved: true, electrolyteResponseObserved: true, responseObserved: true });
  });
});

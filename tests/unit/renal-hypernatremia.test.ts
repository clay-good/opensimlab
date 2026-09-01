import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RenalHypernatremia, supportsRenalHypernatremia, RENAL_HYPERNATREMIA_ACTIONS,
  RENAL_HYPERNATREMIA_VOLUME_TICKS as VOLUME, RENAL_HYPERNATREMIA_WATER_TICKS as WATER,
  RENAL_HYPERNATREMIA_COMBINED_TICKS as COMBINED, RENAL_HYPERNATREMIA_RECURRENCE_TICKS as RECURRENCE,
  RENAL_HYPERNATREMIA_DELAY_TICKS as DELAY, RENAL_HYPERNATREMIA_TAKEOVER_TICKS as TAKEOVER,
  RENAL_HYPERNATREMIA_SESSION_TICKS as SESSION,
} from '../../src/modules/renal-electrolyte/hypernatremia';
import { RENAL_HYPERNATREMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypernatremia-fixtures';

function ownership(model: RenalHypernatremia, tick = 0, access = true) {
  for (const action of ['call-support', 'review-context', 'monitor']) model.apply(action, tick);
  if (access) model.apply('assist-water-access', tick);
}
function full(model: RenalHypernatremia, tick: number) {
  model.apply('reassess', tick); return model.snapshot(tick).observation;
}
function circulation(model: RenalHypernatremia) {
  model.apply('restore-volume', 0); model.advance(VOLUME);
}

describe('Renal hypernatremia: circulation, replacement, ongoing losses, and access', () => {
  it('binds the exact narrative model and literal authored clock durations', () => {
    const scenario = { ...ROUTINE_INDUCTION, metadata: { ...ROUTINE_INDUCTION.metadata,
      id: 'hypernatremia-water-access-and-losses' }, timeline: ['renal-hypernatremia', 'renal-hypernatremia-boundary']
      .map((target) => ({ id: target, type: 'narrative' as const, target, atTick: 0, message: 'Authored boundary' })) };
    expect(supportsRenalHypernatremia(scenario)).toBe(true);
    for (const invalid of [ROUTINE_INDUCTION, { ...scenario, timeline: [] },
      { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsRenalHypernatremia(invalid)).toBe(false);
    }
    expect([VOLUME, WATER, COMBINED, RECURRENCE, DELAY, TAKEOVER, SESSION])
      .toEqual([9000, 72000, 144000, 144000, 18000, 36000, 360000]);
    expect(RENAL_HYPERNATREMIA_ACTIONS).toHaveLength(13);
  });

  it('starts without care or requested lab and balance findings', () => {
    const model = new RenalHypernatremia();
    expect(model.snapshot(0)).toEqual({ supportActive: false, volumeAtTick: null, waterAtTick: null,
      lossManagementAtTick: null, waterAccessAtTick: null, contextReviewedAtTick: null, monitoringAtTick: null,
      volumeDueInSeconds: null, waterDueInSeconds: null, combinedDueInSeconds: null,
      circulationRestored: false, volumeObserved: false, waterResponseObserved: false,
      combinedResponseObserved: false, recurrenceObserved: false, empiricDesmopressinAttempted: false,
      normalizationAttempted: false, sodiumObservation: null, fluidBalanceObservation: null, observation: null,
      alertness: 'awake, thirsty, and fatigued', choiceFeedback: null, ended: null,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false });
    expect(model.vitals()).toEqual({ systolicMmHg: 88, diastolicMmHg: 52, meanArterialMmHg: 64,
      heartRateBpm: 112, respiratoryRateBpm: 20, spo2Percent: 98, coreTemperatureC: 37.1, alertness: 'awake, thirsty, and fatigued' });
    expect(full(model, 0)).toMatchObject({ sodiumMmolL: 164, changeFromBaselineMmolL: 0,
      urineOutputMlPerHour: 20, ongoingDiarrhea: true });
    expect(model.rhythm()).toBe('sinus');
  });

  it.each(['call-support', 'review-context', 'monitor', 'assist-water-access'])('accepts %s independently without inventing resuscitation or replacement', (action) => {
    const model = new RenalHypernatremia();
    expect(model.apply(action, 0)).toHaveLength(1); expect(model.apply(action, 1)).toEqual([]);
    expect(model.snapshot(1)).toMatchObject({ volumeAtTick: null, waterAtTick: null, observation: null });
    expect(full(model, DELAY)).toMatchObject({ sodiumMmolL: 164, urineOutputMlPerHour: 20, ongoingDiarrhea: true,
      systolicMmHg: 78, diastolicMmHg: 44, meanArterialMmHg: 55, heartRateBpm: 124, respiratoryRateBpm: 22 });
    model.advance(TAKEOVER); expect(model.snapshot(TAKEOVER).ended).toBe('instructor-takeover');
  });

  it('accepts urgent circulation care without administrative or laboratory gates and does not normalize sodium', () => {
    const model = new RenalHypernatremia();
    expect(model.apply('restore-volume', 0).at(-1)?.id).toBe('volume-restoration');
    expect(model.apply('restore-volume', 1)).toEqual([]);
    expect(model.advance(VOLUME - 1)).toEqual([]);
    expect(model.snapshot(VOLUME - 1).volumeDueInSeconds).toBe(1);
    expect(model.apply('reassess', VOLUME).map((event) => event.id)).toEqual(['volume-checkpoint', 'volume-reassessment']);
    expect(model.snapshot(VOLUME)).toMatchObject({ supportActive: false, circulationRestored: true,
      volumeObserved: true, waterResponseObserved: false, observation: { sodiumMmolL: 164, urineOutputMlPerHour: 35,
        ongoingDiarrhea: true, systolicMmHg: 108, diastolicMmHg: 66, meanArterialMmHg: 80,
        heartRateBpm: 94, respiratoryRateBpm: 18, alertness: 'awake, thirsty, and fatigued' } });
    expect(full(model, VOLUME + COMBINED)).toMatchObject({ sodiumMmolL: 164, ongoingDiarrhea: true });
  });

  it.each(['replace-water', 'manage-losses'])('qualifies %s by visible restored circulation, not a lab or administrative click', (action) => {
    const model = new RenalHypernatremia();
    expect(model.apply(action, 0).at(-1)?.id).toContain('refused');
    model.apply('restore-volume', 0);
    expect(model.apply(action, VOLUME - 1).at(-1)?.id).toContain('refused');
    expect(model.apply(action, VOLUME).at(-1)?.id).not.toContain('refused');
    expect(model.snapshot(VOLUME)).toMatchObject({ observation: null, supportActive: false, monitoringAtTick: null,
      contextReviewedAtTick: null, waterAccessAtTick: null });
    expect(model.apply(action, VOLUME + 1)).toEqual([]);
  });

  it('shows water-only partial response independently of access or loss care, then a requested recurrence', () => {
    const model = new RenalHypernatremia(); circulation(model); model.apply('replace-water', VOLUME);
    expect(model.snapshot(VOLUME)).toMatchObject({ waterDueInSeconds: 7200, combinedDueInSeconds: null,
      waterAccessAtTick: null, lossManagementAtTick: null, supportActive: false });
    expect(full(model, VOLUME + WATER)).toMatchObject({ sodiumMmolL: 163, changeFromBaselineMmolL: -1,
      urineOutputMlPerHour: 35, ongoingDiarrhea: true });
    expect(model.snapshot(VOLUME + WATER).waterResponseObserved).toBe(true);
    const events = model.advance(VOLUME + RECURRENCE);
    expect(events.map((event) => event.id)).toEqual(['losses-review-checkpoint']);
    expect(JSON.stringify(events)).not.toMatch(/163|164/);
    expect(model.snapshot(VOLUME + RECURRENCE)).toMatchObject({ recurrenceObserved: false,
      observation: { sodiumMmolL: 163 } });
    expect(model.apply('reassess', VOLUME + RECURRENCE).at(-1)?.id).toBe('recurrence-reassessment');
    expect(model.snapshot(VOLUME + RECURRENCE)).toMatchObject({ recurrenceObserved: true,
      observation: { sodiumMmolL: 164, changeFromBaselineMmolL: 0, ongoingDiarrhea: true } });
  });

  it('does not give ongoing-loss care alone a water-deficit correction', () => {
    const model = new RenalHypernatremia(); circulation(model); model.apply('manage-losses', VOLUME);
    model.apply('assist-water-access', VOLUME);
    expect(model.snapshot(VOLUME)).toMatchObject({ waterDueInSeconds: null, combinedDueInSeconds: null });
    expect(full(model, VOLUME + COMBINED)).toMatchObject({ sodiumMmolL: 164, ongoingDiarrhea: true });
    expect(model.snapshot(VOLUME + COMBINED).combinedResponseObserved).toBe(false);
  });

  it.each([['replace-water', 'manage-losses'], ['manage-losses', 'replace-water']] as const)('accepts %s then %s and anchors combined response to the later care', (first, next) => {
    const model = new RenalHypernatremia(); circulation(model); model.apply(first, VOLUME); model.apply(next, VOLUME + 1);
    expect(model.snapshot(VOLUME + 1).combinedDueInSeconds).toBe(14400);
    const waterAt = model.snapshot(VOLUME + 1).waterAtTick!;
    expect(full(model, waterAt + WATER)).toMatchObject({ sodiumMmolL: 163, ongoingDiarrhea: true });
    expect(full(model, VOLUME + COMBINED)).toMatchObject({ sodiumMmolL: 163 });
    expect(full(model, VOLUME + COMBINED + 1)).toMatchObject({ sodiumMmolL: 162, changeFromBaselineMmolL: -2,
      urineOutputMlPerHour: 35, ongoingDiarrhea: true });
    expect(model.snapshot(VOLUME + COMBINED + 1)).toMatchObject({ waterAccessAtTick: null, supportActive: false,
      combinedResponseObserved: true, recurrenceObserved: false });
  });

  it('permits final-only full assessment and does not backfill the missed early water panel', () => {
    const model = new RenalHypernatremia(); circulation(model);
    model.apply('replace-water', VOLUME); model.apply('manage-losses', VOLUME); ownership(model, VOLUME);
    expect(model.apply('handoff', VOLUME + WATER).at(-1)?.id).toBe('handoff-refused');
    expect(model.apply('reassess', VOLUME + COMBINED).at(-1)?.id).toBe('combined-reassessment');
    expect(model.snapshot(VOLUME + COMBINED)).toMatchObject({ volumeObserved: true,
      waterResponseObserved: false, combinedResponseObserved: true, recurrenceObserved: false });
    expect(model.apply('handoff', VOLUME + COMBINED).at(-1)?.id).toBe('handoff');
  });

  it('requires actual access support for continuity, not for the biochemical response', () => {
    const model = new RenalHypernatremia(); circulation(model); ownership(model, VOLUME, false);
    model.apply('replace-water', VOLUME); model.apply('manage-losses', VOLUME);
    expect(full(model, VOLUME + COMBINED)?.sodiumMmolL).toBe(162);
    expect(model.apply('handoff', VOLUME + COMBINED).at(-1)?.id).toBe('handoff-refused');
    model.apply('assist-water-access', VOLUME + COMBINED);
    expect(model.apply('handoff', VOLUME + COMBINED).at(-1)?.id).toBe('handoff');
  });

  it('separates partial findings and refuses old full findings after recurrence', () => {
    const model = new RenalHypernatremia(); circulation(model); ownership(model, VOLUME);
    model.apply('replace-water', VOLUME); full(model, VOLUME + WATER);
    model.apply('check-fluid-balance', VOLUME + RECURRENCE);
    expect(model.snapshot(VOLUME + RECURRENCE)).toMatchObject({ sodiumObservation: { atTick: VOLUME + WATER, sodiumMmolL: 163 },
      fluidBalanceObservation: { atTick: VOLUME + RECURRENCE, ongoingDiarrhea: true }, recurrenceObserved: false });
    model.apply('check-sodium', VOLUME + RECURRENCE + 1);
    expect(model.snapshot(VOLUME + RECURRENCE + 1)).toMatchObject({ sodiumObservation: { sodiumMmolL: 164 },
      observation: { sodiumMmolL: 163 }, recurrenceObserved: false });
    model.apply('manage-losses', VOLUME + RECURRENCE + 1);
    expect(model.apply('handoff', VOLUME + RECURRENCE + 1).at(-1)?.id).toBe('handoff-refused');
    full(model, VOLUME + RECURRENCE + 1);
    expect(model.snapshot(VOLUME + RECURRENCE + 1)).toMatchObject({ recurrenceObserved: true,
      combinedResponseObserved: false, combinedDueInSeconds: 14400 });
    expect(model.apply('handoff', VOLUME + RECURRENCE + 1).at(-1)?.id).toBe('handoff');
  });

  it('recovers after recurrence while preserving history and never pretending diarrhea ended', () => {
    const model = new RenalHypernatremia(); circulation(model); model.apply('replace-water', VOLUME);
    full(model, VOLUME + RECURRENCE);
    model.apply('manage-losses', VOLUME + RECURRENCE + 1);
    expect(full(model, VOLUME + RECURRENCE + COMBINED)?.sodiumMmolL).toBe(164);
    expect(full(model, VOLUME + RECURRENCE + COMBINED + 1)).toMatchObject({ sodiumMmolL: 162,
      ongoingDiarrhea: true, urineOutputMlPerHour: 35, alertness: 'awake, thirsty, and fatigued' });
    expect(model.snapshot(VOLUME + RECURRENCE + COMBINED + 1)).toMatchObject({ recurrenceObserved: true,
      combinedResponseObserved: true, waterResponseObserved: false });
  });

  it('retains refused shortcuts without preventing later qualified care and handoff', () => {
    const model = new RenalHypernatremia();
    expect(model.apply('empiric-desmopressin', 0).at(-1)?.id).toBe('desmopressin-refused');
    expect(model.apply('normalize-now', 0).at(-1)?.id).toBe('normalization-refused');
    circulation(model); model.apply('replace-water', VOLUME); model.apply('manage-losses', VOLUME);
    ownership(model, VOLUME); full(model, VOLUME + COMBINED);
    expect(model.apply('handoff', VOLUME + COMBINED).at(-1)?.id).toBe('handoff');
    const ended = model.snapshot(VOLUME + COMBINED);
    expect(ended).toMatchObject({ empiricDesmopressinAttempted: true, normalizationAttempted: true, ended: 'handoff' });
    expect(model.advance(SESSION)).toEqual([]);
    expect(model.apply('normalize-now', SESSION).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(SESSION)).toEqual(ended);
  });

  it('keeps snapshots read-only and excludes hidden or invented laboratory fields', () => {
    const model = new RenalHypernatremia(); circulation(model); model.apply('replace-water', VOLUME);
    full(model, VOLUME);
    expect(model.snapshot(SESSION).waterDueInSeconds).toBe(0);
    expect(model.snapshot(SESSION).observation?.sodiumMmolL).toBe(164);
    expect(model.snapshot(VOLUME).waterDueInSeconds).toBe(7200);
    const events = model.advance(VOLUME + WATER);
    expect(JSON.stringify(events)).not.toContain('163');
    expect(model.snapshot(VOLUME + WATER)).toMatchObject({ waterResponseObserved: false,
      observation: { sodiumMmolL: 164 } });
    for (const field of ['urineOsmolalityMosmPerKg', 'serumOsmolalityMosmPerKg', 'creatinineMgDl',
      'renalClearance', 'desmopressinAtTick', 'peakSodiumMmolL']) {
      expect(model.snapshot(VOLUME + WATER)).not.toHaveProperty(field);
      expect(model.snapshot(VOLUME + WATER).observation).not.toHaveProperty(field);
    }
    const copy = model.snapshot(VOLUME + WATER);
    Object.assign(copy.observation!, { sodiumMmolL: 999 });
    Object.assign(copy.sodiumObservation!, { sodiumMmolL: 999 });
    Object.assign(copy.fluidBalanceObservation!, { urineOutputMlPerHour: 999 });
    expect(model.snapshot(VOLUME + WATER).observation?.sodiumMmolL).toBe(164);
    expect(model.snapshot(VOLUME + WATER).sodiumObservation?.sodiumMmolL).toBe(164);
    expect(model.snapshot(VOLUME + WATER).fluidBalanceObservation?.urineOutputMlPerHour).toBe(35);
  });

  it('orders water, recurrence, and late combined checkpoints identically under fine and coarse advancement', () => {
    const fine = new RenalHypernatremia(); const coarse = new RenalHypernatremia();
    for (const model of [fine, coarse]) { circulation(model); model.apply('replace-water', VOLUME); }
    const events = [];
    for (let tick = VOLUME + 1; tick <= VOLUME + RECURRENCE; tick++) events.push(...fine.advance(tick));
    expect(coarse.advance(VOLUME + RECURRENCE)).toEqual(events);
    expect(coarse.snapshot(VOLUME + RECURRENCE)).toEqual(fine.snapshot(VOLUME + RECURRENCE));
    for (const model of [fine, coarse]) model.apply('manage-losses', VOLUME + RECURRENCE + 1);
    const later = [];
    for (let tick = VOLUME + RECURRENCE + 2; tick <= SESSION + COMBINED; tick++) later.push(...fine.advance(tick));
    expect(coarse.advance(SESSION + COMBINED)).toEqual(later);
    expect(coarse.snapshot(SESSION + COMBINED)).toEqual(fine.snapshot(SESSION + COMBINED));
    expect(coarse.vitals()).toEqual(fine.vitals());
  });

  it('caps future checkpoints at terminal boundaries and still allows delayed care before them', () => {
    const untreated = new RenalHypernatremia();
    expect(untreated.apply('restore-volume', TAKEOVER).map((event) => event.id))
      .toEqual(['clinical-deterioration', 'instructor-takeover', 'action-refused']);
    expect(untreated.snapshot(TAKEOVER).volumeAtTick).toBe(null);
    const late = new RenalHypernatremia(); late.apply('restore-volume', TAKEOVER - 1);
    late.advance(TAKEOVER - 1 + VOLUME); late.apply('replace-water', SESSION - 1); late.apply('manage-losses', SESSION - 1);
    expect(late.advance(SESSION + COMBINED).map((event) => event.id)).toEqual(['instructor-takeover']);
    expect(late.snapshot(SESSION + COMBINED)).toMatchObject({ waterResponseObserved: false,
      combinedResponseObserved: false, waterDueInSeconds: null, combinedDueInSeconds: null });
  });

  it('rejects unknown actions without executing payload properties or initiating care', () => {
    const model = new RenalHypernatremia();
    const malicious = { get action() { throw new Error('must not read'); } };
    for (const action of [null, undefined, {}, malicious, '__proto__', 1, false]) {
      expect(model.apply(action, 0).at(-1)?.id).toBe('action-refused');
    }
    expect(model.snapshot(0)).toMatchObject({ volumeAtTick: null, waterAtTick: null, lossManagementAtTick: null, observation: null });
  });

  it('binds reference transcripts and deterministically reproduces every model frame of all four courses', () => {
    expect(FIXTURES).toMatchObject({ scenarioId: 'hypernatremia-water-access-and-losses', contentVersion: '0.1.0', seed: 4973 });
    expect(FIXTURES.expert).toHaveLength(10); expect(FIXTURES.recovery).toHaveLength(15);
    for (const name of ['expert', 'recovery', 'commonError', 'noAction'] as const) {
      const run = () => {
        const model = new RenalHypernatremia(); const hash = createHash('sha256'); const actions = FIXTURES[name];
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
      if (name === 'expert' || name === 'recovery') expect(first.state).toMatchObject({ combinedResponseObserved: true,
        observation: { sodiumMmolL: 162, changeFromBaselineMmolL: -2, ongoingDiarrhea: true, urineOutputMlPerHour: 35 } });
      if (name === 'expert') expect(first.state).toMatchObject({ waterResponseObserved: false, recurrenceObserved: false });
      if (name === 'recovery') expect(first.state).toMatchObject({ waterResponseObserved: true, recurrenceObserved: true,
        empiricDesmopressinAttempted: true, normalizationAttempted: true });
      if (name === 'commonError') expect(first.state).toMatchObject({ volumeAtTick: null, waterAtTick: null,
        observation: null, sodiumObservation: { atTick: 18000, sodiumMmolL: 164 } });
    }
  });
});

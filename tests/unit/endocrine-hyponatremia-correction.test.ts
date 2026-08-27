import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import {
  HyponatremiaCorrection, supportsHyponatremiaCorrection,
  HYPONATREMIA_CORRECTION_ACTIONS, HYPONATREMIA_CORRECTION_AQUARESIS_TICKS as AQUARESIS,
  HYPONATREMIA_CORRECTION_OVERCORRECTION_TICKS as BREACH,
  HYPONATREMIA_CORRECTION_RESPONSE_TICKS as RESPONSE,
  HYPONATREMIA_CORRECTION_TAKEOVER_TICKS as TAKEOVER,
  HYPONATREMIA_CORRECTION_SESSION_TICKS as SESSION,
} from '../../src/modules/endocrine-metabolic/hyponatremia-correction';
import { HYPONATREMIA_CORRECTION_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/hyponatremia-correction-fixtures';
import { HYPONATREMIA_AQUARESIS_AND_OVERCORRECTION as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hyponatremia-aquaresis-and-overcorrection';

const administration = (model: HyponatremiaCorrection, tick = 0) => {
  for (const action of ['call-support', 'review-risk', 'monitor']) model.apply(action, tick);
};

describe('Post-rescue sodium correction: observations, response, and retained history', () => {
  it('binds a valid bounded narrative scenario and exact fixture identity', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(supportsHyponatremiaCorrection(SCENARIO)).toBe(true);
    expect(FIXTURES).toMatchObject({ scenarioId: SCENARIO.metadata.id, contentVersion: SCENARIO.metadata.version, seed: 4907 });
    expect(SCENARIO.metadata.estimatedMinutes).toBe(90);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    for (const other of [ROUTINE_INDUCTION, { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsHyponatremiaCorrection(other)).toBe(false);
    }
  });

  it('starts at the supplied hour-1 value without an invented requested result', () => {
    const model = new HyponatremiaCorrection();
    expect(model.snapshot(0)).toMatchObject({ observation: null, peakObservedSodiumMmolL: 111,
      aquaresisObserved: false, overcorrectionObserved: false, responseObserved: false,
      aquaresisDueInSeconds: 1800, responseDueInSeconds: null, doseModelAvailable: false, durableRecoveryProven: false });
    expect(model.vitals()).toEqual({ systolicMmHg: 118, diastolicMmHg: 70, meanArterialMmHg: 86,
      heartRateBpm: 84, respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.8,
      alertness: 'awake but tired; no recurrent seizure is scripted' });
    expect(model.apply('reassess', 0).at(-1)?.message).toContain('total rise 5 mmol/L from the original 106');
    expect(model.snapshot(0).observation).toMatchObject({ sodiumMmolL: 111, urineOutputMlPerHour: 75, atTick: 0 });
  });

  it.each(['call-support', 'review-risk', 'monitor'])('accepts %s independently once without creating a measurement', (action) => {
    const model = new HyponatremiaCorrection(); const vitals = model.vitals();
    expect(model.apply(action, 0)).toHaveLength(1);
    expect(model.apply(action, 1)).toEqual([]);
    expect(model.snapshot(1).observation).toBeNull();
    expect(model.vitals()).toEqual(vitals);
  });

  it('keeps unrequested aquaresis, sodium, peak and excessive correction out of snapshots and automatic messages', () => {
    const model = new HyponatremiaCorrection(); model.apply('reassess', 0);
    const initial = model.snapshot(0).observation;
    expect(model.advance(AQUARESIS - 1)).toEqual([]);
    expect(model.snapshot(AQUARESIS - 1).aquaresisDueInSeconds).toBe(1);
    const events = model.advance(AQUARESIS);
    expect(events.map(({ id }) => id)).toEqual(['surveillance-checkpoint']);
    expect(model.advance(BREACH)).toEqual([]);
    expect(model.snapshot(BREACH)).toMatchObject({ observation: initial, peakObservedSodiumMmolL: 111,
      aquaresisObserved: false, overcorrectionObserved: false });
    expect(JSON.stringify({ snapshot: model.snapshot(BREACH), vitals: model.vitals(), events }))
      .not.toMatch(/115|350|total rise 9|limit crossed|overcorrection-reassessment/);
    model.apply('reassess', BREACH);
    expect(model.snapshot(BREACH)).toMatchObject({ peakObservedSodiumMmolL: 115, aquaresisObserved: true,
      overcorrectionObserved: true, observation: { sodiumMmolL: 115, urineOutputMlPerHour: 350 } });
  });

  it('snapshot reads at a future time do not advance the hidden state', () => {
    const model = new HyponatremiaCorrection();
    expect(model.snapshot(SESSION)).toMatchObject({ aquaresisDueInSeconds: 0, observation: null, ended: null });
    model.apply('reassess', 0);
    expect(model.snapshot(0).observation?.sodiumMmolL).toBe(111);
  });

  it.each(['control-water-loss', 'relower'])('does not permit %s without its observed indication or call prophylaxis clinically wrong', (action) => {
    const model = new HyponatremiaCorrection(); model.advance(BREACH);
    expect(model.apply(action, BREACH).at(-1)?.id).toMatch(/review-refused$/);
    expect(model.snapshot(BREACH)).toMatchObject({ waterLossControlAtTick: null, reloweringAtTick: null,
      aquaresisObserved: false, overcorrectionObserved: false, peakObservedSodiumMmolL: 111 });
    if (action === 'control-water-loss') expect(model.snapshot(BREACH).choiceFeedback).toContain('not declared clinically wrong');
  });

  it('prevents the later rise with early control and permits handoff without unnecessary relowering', () => {
    const model = new HyponatremiaCorrection(); administration(model);
    model.apply('reassess', AQUARESIS);
    model.apply('control-water-loss', AQUARESIS);
    expect(model.snapshot(AQUARESIS).responseDueInSeconds).toBe(3600);
    expect(model.apply('control-water-loss', AQUARESIS + 1)).toEqual([]);
    expect(model.apply('relower', AQUARESIS + 1).at(-1)?.id).toBe('relowering-review-refused');
    model.apply('reassess', BREACH);
    expect(model.snapshot(BREACH)).toMatchObject({ overcorrectionObserved: false, observation: { sodiumMmolL: 112 } });
    expect(model.advance(AQUARESIS + RESPONSE - 1)).toEqual([]);
    expect(model.snapshot(AQUARESIS + RESPONSE - 1).responseDueInSeconds).toBe(1);
    expect(model.advance(AQUARESIS + RESPONSE).map(({ id }) => id)).toEqual(['response-checkpoint']);
    expect(model.snapshot(AQUARESIS + RESPONSE)).toMatchObject({ responseObserved: false, observation: { atTick: BREACH, urineOutputMlPerHour: 350 } });
    expect(model.apply('handoff', AQUARESIS + RESPONSE).at(-1)?.id).toBe('handoff-refused');
    model.apply('reassess', AQUARESIS + RESPONSE); model.apply('handoff', AQUARESIS + RESPONSE + 1);
    expect(model.snapshot(AQUARESIS + RESPONSE + 1)).toMatchObject({ ended: 'handoff', reloweringAtTick: null,
      responseObserved: true, peakObservedSodiumMmolL: 112, observation: { sodiumMmolL: 112, urineOutputMlPerHour: 100 } });
  });

  it.each([['relower', 'control-water-loss'], ['control-water-loss', 'relower']])('accepts rescue in %s then %s order without administrative prerequisites', (first, second) => {
    const model = new HyponatremiaCorrection(); model.apply('reassess', BREACH);
    model.apply(first, BREACH); model.apply(second, BREACH + 1);
    expect(model.snapshot(BREACH + 1)).toMatchObject({ supportActive: false, riskReviewedAtTick: null,
      monitoringAtTick: null, responseDueInSeconds: 3600, overcorrectionObserved: true, peakObservedSodiumMmolL: 115 });
    expect(model.apply(second, BREACH + 2)).toEqual([]);
    model.advance(BREACH + 1 + RESPONSE);
    expect(model.snapshot(BREACH + 1 + RESPONSE)).toMatchObject({ responseObserved: false,
      peakObservedSodiumMmolL: 115, observation: { sodiumMmolL: 115, atTick: BREACH } });
    model.apply('reassess', BREACH + 1 + RESPONSE);
    expect(model.snapshot(BREACH + 1 + RESPONSE)).toMatchObject({ responseObserved: true,
      peakObservedSodiumMmolL: 115, overcorrectionObserved: true, observation: { sodiumMmolL: 112, urineOutputMlPerHour: 100 } });
    expect(model.apply('handoff', BREACH + 1 + RESPONSE).at(-1)?.id).toBe('handoff-refused');
    administration(model, BREACH + 1 + RESPONSE); model.apply('handoff', BREACH + 2 + RESPONSE);
    expect(model.snapshot(BREACH + 2 + RESPONSE).ended).toBe('handoff');
  });

  it('control alone after a breach holds the achieved sodium but never relowers it or claims a later response', () => {
    const model = new HyponatremiaCorrection(); administration(model); model.apply('reassess', BREACH);
    model.apply('control-water-loss', BREACH);
    model.advance(BREACH + RESPONSE); model.apply('reassess', BREACH + RESPONSE);
    expect(model.snapshot(BREACH + RESPONSE)).toMatchObject({ responseDueInSeconds: null, responseObserved: false,
      observation: { sodiumMmolL: 115 }, ended: null });
    expect(model.apply('handoff', BREACH + RESPONSE).at(-1)?.id).toBe('handoff-refused');
    model.advance(SESSION);
    expect(model.snapshot(SESSION).ended).toBe('instructor-takeover');
  });

  it('relowering alone neither undoes a hidden rise nor bypasses the missing-control stop', () => {
    const model = new HyponatremiaCorrection(); model.apply('reassess', BREACH); model.apply('relower', BREACH);
    expect(model.snapshot(BREACH)).toMatchObject({ responseDueInSeconds: null, observation: { sodiumMmolL: 115 } });
    model.advance(TAKEOVER);
    expect(model.snapshot(TAKEOVER)).toMatchObject({ ended: 'instructor-takeover', peakObservedSodiumMmolL: 115,
      observation: { sodiumMmolL: 115 }, responseObserved: false });
  });

  it('distinguishes control one tick before the rise from control at the rise without disclosing stale hidden results', () => {
    for (const at of [BREACH - 1, BREACH]) {
      const model = new HyponatremiaCorrection(); model.apply('reassess', AQUARESIS);
      model.apply('control-water-loss', at);
      expect(model.snapshot(at)).toMatchObject({ overcorrectionObserved: false, peakObservedSodiumMmolL: 112,
        observation: { atTick: AQUARESIS, sodiumMmolL: 112 } });
      expect(model.snapshot(at).responseDueInSeconds).toBe(3600);
      model.apply('reassess', BREACH);
      expect(model.snapshot(BREACH).observation?.sodiumMmolL).toBe(at === BREACH ? 115 : 112);
      expect(model.snapshot(BREACH).overcorrectionObserved).toBe(at === BREACH);
    }
  });

  it('schedules identical public reassessment timers and notifications despite different unrequested sodium states', () => {
    const early = new HyponatremiaCorrection(); const late = new HyponatremiaCorrection();
    for (const model of [early, late]) model.apply('reassess', AQUARESIS);
    expect(early.apply('control-water-loss', BREACH - 1)).toEqual(late.apply('control-water-loss', BREACH));
    // The accepted request timestamp differs by one tick and is public. All
    // other fields, including feedback, must be indistinguishable at equal elapsed time.
    const comparable = (model: HyponatremiaCorrection, tick: number) => ({
      ...model.snapshot(tick), waterLossControlAtTick: 0,
    });
    expect(comparable(early, BREACH - 1)).toEqual(comparable(late, BREACH));
    expect(comparable(early, BREACH - 1 + RESPONSE - 1)).toEqual(comparable(late, BREACH + RESPONSE - 1));
    expect(early.advance(BREACH - 1 + RESPONSE)).toEqual(late.advance(BREACH + RESPONSE));
    expect(comparable(early, BREACH - 1 + RESPONSE)).toEqual(comparable(late, BREACH + RESPONSE));
    expect(early.vitals()).toEqual(late.vitals());
    expect(early.snapshot(BREACH - 1 + RESPONSE)).toMatchObject({ responseDueInSeconds: null,
      responseObserved: false, overcorrectionObserved: false, observation: { atTick: AQUARESIS, sodiumMmolL: 112 } });
    expect(late.snapshot(BREACH + RESPONSE)).toMatchObject({ responseDueInSeconds: null,
      responseObserved: false, overcorrectionObserved: false, observation: { atTick: AQUARESIS, sodiumMmolL: 112 } });
    early.apply('reassess', BREACH - 1 + RESPONSE); late.apply('reassess', BREACH + RESPONSE);
    expect(early.snapshot(BREACH - 1 + RESPONSE)).toMatchObject({ responseObserved: true, observation: { sodiumMmolL: 112 } });
    expect(late.snapshot(BREACH + RESPONSE)).toMatchObject({ responseObserved: false, overcorrectionObserved: true,
      observation: { sodiumMmolL: 115 }, responseDueInSeconds: null });
    late.apply('relower', BREACH + RESPONSE);
    expect(late.snapshot(BREACH + RESPONSE).responseDueInSeconds).toBe(3600);
  });

  it('allows correction before the instructor boundary but refuses it at the exact stop', () => {
    const before = new HyponatremiaCorrection(); before.apply('reassess', BREACH);
    before.apply('control-water-loss', TAKEOVER - 1); before.apply('relower', TAKEOVER - 1);
    before.advance(TAKEOVER); expect(before.snapshot(TAKEOVER).ended).toBeNull();
    const exact = new HyponatremiaCorrection(); exact.apply('reassess', BREACH);
    expect(exact.apply('control-water-loss', TAKEOVER).at(-1)?.id).toBe('action-refused');
    expect(exact.snapshot(TAKEOVER)).toMatchObject({ ended: 'instructor-takeover', waterLossControlAtTick: null });
  });

  it.each(['call-support', 'review-risk', 'monitor'])('does not permit handoff missing %s even after a fresh response', (missing) => {
    const model = new HyponatremiaCorrection();
    for (const action of ['call-support', 'review-risk', 'monitor']) if (action !== missing) model.apply(action, 0);
    model.apply('reassess', AQUARESIS); model.apply('control-water-loss', AQUARESIS);
    model.apply('reassess', AQUARESIS + RESPONSE);
    expect(model.snapshot(AQUARESIS + RESPONSE).responseObserved).toBe(true);
    expect(model.apply('handoff', AQUARESIS + RESPONSE).at(-1)?.id).toBe('handoff-refused');
    model.apply(missing, AQUARESIS + RESPONSE); model.apply('handoff', AQUARESIS + RESPONSE);
    expect(model.snapshot(AQUARESIS + RESPONSE).ended).toBe('handoff');
  });

  it('retains unsafe choices after rescue, but does not invent a stale deferral mistake', () => {
    const model = new HyponatremiaCorrection(); model.apply('normalize-now', 0); model.apply('wait-for-symptoms', 0);
    model.apply('reassess', BREACH); model.apply('control-water-loss', BREACH); model.apply('relower', BREACH);
    expect(model.snapshot(BREACH)).toMatchObject({ normalizationAttempted: true, symptomWaitChosen: true });
    const prompt = new HyponatremiaCorrection(); prompt.apply('reassess', AQUARESIS); prompt.apply('control-water-loss', AQUARESIS);
    expect(prompt.apply('wait-for-symptoms', AQUARESIS).at(-1)?.id).toBe('action-refused');
    expect(prompt.snapshot(AQUARESIS).symptomWaitChosen).toBe(false);
    prompt.apply('normalize-now', AQUARESIS);
    expect(prompt.snapshot(AQUARESIS).normalizationAttempted).toBe(true);
  });

  it('copies requested observations, refuses hostile values without echoing them, and freezes ended state', () => {
    const model = new HyponatremiaCorrection();
    for (const action of [null, '__proto__', { action: 'relower', private: 'private-value' }]) {
      expect(model.apply(action, 0).at(-1)?.id).toBe('action-refused');
      expect(JSON.stringify(model.snapshot(0))).not.toContain('private-value');
    }
    model.apply('reassess', 0);
    (model.snapshot(0).observation as { sodiumMmolL: number }).sodiumMmolL = 999;
    expect(model.snapshot(0).observation?.sodiumMmolL).toBe(111);
    model.advance(TAKEOVER); const ended = model.snapshot(TAKEOVER);
    for (const action of HYPONATREMIA_CORRECTION_ACTIONS) model.apply(action, SESSION);
    expect(model.advance(SESSION)).toEqual([]);
    expect(model.snapshot(SESSION)).toEqual(ended);
    expect(JSON.stringify(ended)).not.toContain('116');
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s tick deterministically without manufacturing observations', (path) => {
    const run = () => {
      const model = new HyponatremiaCorrection(); const hash = createHash('sha256');
      for (let tick = 0; tick <= SESSION; tick += 1) {
        const events = model.advance(tick);
        for (const [at, action] of FIXTURES[path]) if (at === tick) events.push(...model.apply(action, tick));
        hash.update(JSON.stringify({ tick, patient: model.snapshot(tick), vitals: model.vitals(), events }));
      }
      return { hash: hash.digest('hex'), patient: model.snapshot(SESSION) };
    };
    const first = run(); expect(run()).toEqual(first);
    expect(first.patient.ended).toBe(path === 'expert' || path === 'recovery' ? 'handoff' : 'instructor-takeover');
    expect(first.patient.durableRecoveryProven).toBe(false);
    if (path === 'noAction') expect(first.patient).toMatchObject({ observation: null, peakObservedSodiumMmolL: 111, overcorrectionObserved: false });
    if (path === 'recovery') expect(first.patient).toMatchObject({ peakObservedSodiumMmolL: 115, overcorrectionObserved: true,
      normalizationAttempted: true, symptomWaitChosen: true, observation: { sodiumMmolL: 112 } });
  });
});

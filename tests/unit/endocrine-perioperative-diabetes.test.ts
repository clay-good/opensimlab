import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import {
  PerioperativeDiabetes, supportsPerioperativeDiabetes, PERIOPERATIVE_DIABETES_ACTIONS,
  PERIOPERATIVE_DIABETES_EARLY_TICKS as EARLY, PERIOPERATIVE_DIABETES_RESPONSE_TICKS as RESPONSE,
  PERIOPERATIVE_DIABETES_DELAY_TICKS as DELAY, PERIOPERATIVE_DIABETES_WORSENING_TICKS as WORSE,
  PERIOPERATIVE_DIABETES_TAKEOVER_TICKS as TAKEOVER, PERIOPERATIVE_DIABETES_SESSION_TICKS as SESSION,
} from '../../src/modules/endocrine-metabolic/perioperative-diabetes';
import { PERIOPERATIVE_DIABETES_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/perioperative-diabetes-fixtures';

function ownership(model: PerioperativeDiabetes, tick = 0) {
  for (const action of ['call-support', 'review-context', 'plan-fasting', 'monitor']) model.apply(action, tick);
}
function findings(model: PerioperativeDiabetes, tick: number) {
  model.apply('reassess', tick); return model.snapshot(tick).observation;
}

describe('Perioperative type 1 diabetes: insulin continuity without laboratory or administrative gates', () => {
  it('binds the bounded narrative model, reference identity, and authored clocks', () => {
    const scenario = { ...ROUTINE_INDUCTION, metadata: { ...ROUTINE_INDUCTION.metadata, id: FIXTURES.scenarioId },
      timeline: ['perioperative-diabetes', 'perioperative-diabetes-boundary'].map((target) => ({ id: target,
        atTick: 0, type: 'narrative' as const, target, message: 'Authored boundary' })) };
    expect(supportsPerioperativeDiabetes(scenario)).toBe(true);
    for (const invalid of [ROUTINE_INDUCTION, { ...scenario, timeline: [] },
      { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsPerioperativeDiabetes(invalid)).toBe(false);
    }
    expect([EARLY, RESPONSE, DELAY, WORSE, TAKEOVER, SESSION]).toEqual([18000, 36000, 18000, 36000, 72000, 144000]);
    expect(FIXTURES).toMatchObject({ scenarioId: 'perioperative-diabetes-insulin-continuity', contentVersion: '0.1.0', seed: 4931 });
    expect(PERIOPERATIVE_DIABETES_ACTIONS).toHaveLength(11);
    expect(FIXTURES.expert).toHaveLength(8); expect(FIXTURES.recovery).toHaveLength(13);
  });

  it('starts without selected care, current labs, unobserved deterioration, or invented acid-base findings', () => {
    const model = new PerioperativeDiabetes();
    expect(model.snapshot(0)).toEqual({ supportActive: false, contextReviewedAtTick: null, fastingPlanAtTick: null,
      monitoringAtTick: null, insulinAtTick: null, earlyDueInSeconds: null, responseDueInSeconds: null,
      earlyResponseObserved: false, responseObserved: false, deteriorationObserved: false,
      omitInsulinAttempted: false, cgmOnlyAttempted: false, clearanceAttempted: false,
      glucoseObservation: null, observation: null, alertness: 'awake and thirsty', choiceFeedback: null, ended: null,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false });
    expect(model.vitals()).toEqual({ systolicMmHg: 118, diastolicMmHg: 72, meanArterialMmHg: 87,
      heartRateBpm: 88, respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.7, alertness: 'awake and thirsty' });
    expect(findings(model, 0)).toMatchObject({ glucoseMgDl: 180, ketonesMmolL: 0.6 });
    expect(model.snapshot(0).observation).not.toHaveProperty('pH');
    expect(model.snapshot(0).observation).not.toHaveProperty('bicarbonateMmolL');
  });

  it.each(['call-support', 'review-context', 'plan-fasting', 'monitor'])('accepts %s independently once without insulin or biochemical effects', (action) => {
    const model = new PerioperativeDiabetes();
    expect(model.apply(action, 0)).toHaveLength(1); expect(model.apply(action, 1)).toEqual([]);
    expect(model.snapshot(1)).toMatchObject({ insulinAtTick: null, observation: null, glucoseObservation: null,
      earlyDueInSeconds: null, responseDueInSeconds: null });
    expect(findings(model, WORSE)).toMatchObject({ glucoseMgDl: 280, ketonesMmolL: 2.0 });
  });

  it.each([true, false])('accepts insulin before or after ownership without a fresh-lab prerequisite (ownership first: %s)', (first) => {
    const model = new PerioperativeDiabetes();
    if (first) ownership(model);
    expect(model.apply('restore-insulin', 0).at(-1)?.id).toBe('insulin-restored');
    expect(model.apply('restore-insulin', 1)).toEqual([]);
    expect(model.snapshot(1)).toMatchObject({ insulinAtTick: 0, observation: null,
      earlyDueInSeconds: 1800, responseDueInSeconds: 3600 });
    expect(findings(model, RESPONSE)).toMatchObject({ glucoseMgDl: 144, ketonesMmolL: 0.3 });
    if (!first) {
      expect(model.apply('handoff', RESPONSE).at(-1)?.id).toBe('handoff-refused');
      ownership(model, RESPONSE);
    }
    expect(model.apply('handoff', RESPONSE).at(-1)?.id).toBe('handoff');
  });

  it('keeps glucose-only checks useful and separate from historical full observations and response credit', () => {
    const model = new PerioperativeDiabetes(); findings(model, 0); model.apply('restore-insulin', 0);
    const initial = model.snapshot(0).observation;
    expect(model.apply('check-glucose', EARLY).at(-1)?.id).toBe('glucose-check');
    expect(model.snapshot(EARLY)).toMatchObject({ glucoseObservation: { atTick: EARLY, glucoseMgDl: 162 },
      observation: initial, earlyResponseObserved: false, responseObserved: false });
    expect(model.apply('check-glucose', RESPONSE).at(-1)?.message).not.toMatch(/0\.3/);
    expect(model.snapshot(RESPONSE)).toMatchObject({ glucoseObservation: { atTick: RESPONSE, glucoseMgDl: 144 },
      observation: initial, earlyResponseObserved: false, responseObserved: false });
    ownership(model, RESPONSE);
    expect(model.apply('handoff', RESPONSE).at(-1)?.id).toBe('handoff-refused');
    findings(model, RESPONSE); expect(model.apply('handoff', RESPONSE).at(-1)?.id).toBe('handoff');
  });

  it('does not expose ketone progression or observed deterioration through automatic events or a glucose check', () => {
    const model = new PerioperativeDiabetes(); const events = model.advance(WORSE);
    expect(events.map(({ id }) => id)).toEqual(['clinical-deterioration', 'clinical-worsening']);
    expect(model.snapshot(WORSE)).toMatchObject({ observation: null, glucoseObservation: null, deteriorationObserved: false });
    expect(JSON.stringify({ snapshot: model.snapshot(WORSE), events, vitals: model.vitals() })).not.toMatch(/240|280|1\.2|2\.0/);
    expect(model.apply('check-glucose', WORSE).at(-1)?.message).toContain('280 mg/dL');
    expect(model.snapshot(WORSE)).toMatchObject({ observation: null, deteriorationObserved: false });
    expect(model.apply('reassess', WORSE).at(-1)?.id).toBe('deterioration-reassessment');
    expect(model.snapshot(WORSE).deteriorationObserved).toBe(true);
  });

  it('uses accepted insulin alone for both response checkpoints and never replays untreated progression afterward', () => {
    const model = new PerioperativeDiabetes(); model.apply('restore-insulin', DELAY);
    expect(model.vitals()).toMatchObject({ heartRateBpm: 96, respiratoryRateBpm: 18 });
    expect(model.advance(DELAY + EARLY - 1)).toEqual([]);
    expect(findings(model, DELAY + EARLY - 1)).toMatchObject({ glucoseMgDl: 240, ketonesMmolL: 1.2 });
    expect(model.apply('reassess', DELAY + EARLY).at(-1)?.id).toBe('early-response-reassessment');
    expect(model.snapshot(DELAY + EARLY)).toMatchObject({ observation: { glucoseMgDl: 198, ketonesMmolL: 1.0 },
      earlyResponseObserved: true, responseObserved: false });
    expect(model.vitals()).toMatchObject({ heartRateBpm: 92, respiratoryRateBpm: 18 });
    expect(findings(model, DELAY + RESPONSE)).toMatchObject({ glucoseMgDl: 162, ketonesMmolL: 0.4 });
    expect(model.vitals()).toMatchObject({ heartRateBpm: 88, respiratoryRateBpm: 16 });
  });

  it('preserves previously observed deterioration while a final-only assessment does not invent early history', () => {
    const model = new PerioperativeDiabetes(); findings(model, WORSE); model.apply('restore-insulin', WORSE);
    expect(findings(model, WORSE + RESPONSE)).toMatchObject({ glucoseMgDl: 162, ketonesMmolL: 0.4 });
    expect(model.snapshot(WORSE + RESPONSE)).toMatchObject({ earlyResponseObserved: false,
      responseObserved: true, deteriorationObserved: true });
    ownership(model, WORSE + RESPONSE); expect(model.apply('handoff', WORSE + RESPONSE).at(-1)?.id).toBe('handoff');
    const unseen = new PerioperativeDiabetes(); unseen.apply('restore-insulin', WORSE);
    findings(unseen, WORSE + RESPONSE); expect(unseen.snapshot(WORSE + RESPONSE).deteriorationObserved).toBe(false);
  });

  it('leaves prior full findings historical during pending care and does not grant a later response from early glucose', () => {
    const model = new PerioperativeDiabetes(); findings(model, WORSE); const historical = model.snapshot(WORSE).observation;
    model.apply('restore-insulin', WORSE); model.apply('check-glucose', WORSE + EARLY);
    expect(model.snapshot(WORSE + EARLY)).toMatchObject({ observation: historical,
      glucoseObservation: { glucoseMgDl: 198 }, responseObserved: false, earlyResponseObserved: false });
    ownership(model, WORSE + RESPONSE);
    expect(model.apply('handoff', WORSE + RESPONSE).at(-1)?.id).toBe('handoff-refused');
    findings(model, WORSE + RESPONSE); expect(model.apply('handoff', WORSE + RESPONSE).at(-1)?.id).toBe('handoff');
  });

  it.each([['omit-insulin', 'insulin-omission-refused', 'omitInsulinAttempted'],
    ['cgm-only', 'cgm-only-refused', 'cgmOnlyAttempted'], ['clear-surgery', 'clearance-refused', 'clearanceAttempted']] as const)(
    'refuses %s without withdrawing care and retains the choice through later handoff', (action, event, flag) => {
      const model = new PerioperativeDiabetes(); model.apply('restore-insulin', 0);
      expect(model.apply(action, 1).at(-1)?.id).toBe(event);
      expect(model.snapshot(1)[flag]).toBe(true); expect(model.snapshot(1).insulinAtTick).toBe(0);
      ownership(model); findings(model, RESPONSE); model.apply('handoff', RESPONSE);
      expect(model.snapshot(RESPONSE).ended).toBe('handoff'); expect(model.snapshot(RESPONSE)[flag]).toBe(true);
    });

  it('makes snapshots and repeated checkpoints read-only, returns detached findings, and freezes after ending', () => {
    const model = new PerioperativeDiabetes(); model.apply('restore-insulin', 0);
    expect(model.snapshot(RESPONSE).earlyDueInSeconds).toBe(0);
    expect(model.snapshot(RESPONSE).responseDueInSeconds).toBe(0);
    expect(model.vitals().heartRateBpm).toBe(88); expect(model.snapshot(RESPONSE).responseObserved).toBe(false);
    expect(model.advance(RESPONSE).map(({ id }) => id)).toEqual(['early-checkpoint', 'response-checkpoint']);
    expect(model.advance(RESPONSE)).toEqual([]); findings(model, RESPONSE);
    const copy = model.snapshot(RESPONSE);
    Object.assign(copy.observation!, { glucoseMgDl: -1 }); Object.assign(copy.glucoseObservation!, { glucoseMgDl: -2 });
    expect(model.snapshot(RESPONSE).observation?.glucoseMgDl).toBe(144);
    expect(model.snapshot(RESPONSE).glucoseObservation?.glucoseMgDl).toBe(144);
    ownership(model, RESPONSE); model.apply('handoff', RESPONSE); const end = model.snapshot(RESPONSE);
    expect(model.advance(SESSION)).toEqual([]);
    for (const action of PERIOPERATIVE_DIABETES_ACTIONS) expect(model.apply(action, SESSION).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(SESSION)).toEqual(end);
  });

  it('rejects malformed actions, enforces only authored terminal boundaries, and permits care just before takeover', () => {
    const model = new PerioperativeDiabetes();
    for (const action of [null, {}, 'other', 1]) expect(model.apply(action, 0).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(TAKEOVER).ended).toBeNull(); model.advance(TAKEOVER - 1);
    expect(model.snapshot(TAKEOVER - 1).ended).toBeNull(); model.apply('restore-insulin', TAKEOVER - 1);
    model.advance(TAKEOVER); expect(model.snapshot(TAKEOVER).ended).toBeNull();
    model.advance(SESSION); expect(model.snapshot(SESSION).ended).toBe('instructor-takeover');
    const tooLate = new PerioperativeDiabetes();
    expect(tooLate.apply('restore-insulin', TAKEOVER).map(({ id }) => id)).toContain('action-refused');
    expect(tooLate.snapshot(TAKEOVER)).toMatchObject({ insulinAtTick: null, ended: 'instructor-takeover' });
  });

  it('gives repeatable full model traces for expert, recovery, error, and no-action transcripts', () => {
    for (const name of ['expert', 'recovery', 'commonError', 'noAction'] as const) {
      const run = () => {
        const model = new PerioperativeDiabetes(); const digest = createHash('sha256');
        const actions = FIXTURES[name]; const stop = name === 'expert' || name === 'recovery' ? actions.at(-1)![0] : TAKEOVER;
        for (let tick = 0; tick <= stop; tick++) {
          const events = model.advance(tick);
          for (const [at, action] of actions) if (at === tick) events.push(...model.apply(action, tick));
          digest.update(JSON.stringify({ tick, events, vitals: model.vitals(), snapshot: model.snapshot(tick) }));
        }
        return { hash: digest.digest('hex'), state: model.snapshot(stop) };
      };
      const first = run(); expect(run()).toEqual(first);
      expect(first.state.ended).toBe(name === 'expert' || name === 'recovery' ? 'handoff' : 'instructor-takeover');
      if (name === 'expert') expect(first.state).toMatchObject({ earlyResponseObserved: true, responseObserved: true });
      if (name === 'recovery') expect(first.state).toMatchObject({ earlyResponseObserved: false, responseObserved: true,
        deteriorationObserved: true, omitInsulinAttempted: true, cgmOnlyAttempted: true, clearanceAttempted: true });
      if (name === 'commonError') expect(first.state).toMatchObject({ observation: null, glucoseObservation: { glucoseMgDl: 280 },
        deteriorationObserved: false, responseObserved: false });
    }
  });
});

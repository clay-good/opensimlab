import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import {
  AvpDeficiency, supportsAvpDeficiency, AVP_DEFICIENCY_ACTIONS,
  AVP_DEFICIENCY_VOLUME_TICKS as VOLUME, AVP_DEFICIENCY_DELAY_TICKS as DELAY,
  AVP_DEFICIENCY_DESMOPRESSIN_TICKS as DESMOPRESSIN, AVP_DEFICIENCY_UNCONTROLLED_TICKS as UNCONTROLLED,
  AVP_DEFICIENCY_RESPONSE_TICKS as RESPONSE, AVP_DEFICIENCY_TAKEOVER_TICKS as TAKEOVER,
  AVP_DEFICIENCY_SESSION_TICKS as SESSION,
} from '../../src/modules/endocrine-metabolic/avp-deficiency';
import { AVP_DEFICIENCY_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/avp-deficiency-fixtures';
import { HYPERNATREMIC_DEHYDRATION_AVP_DEFICIENCY as scenario } from '../../src/modules/endocrine-metabolic/scenarios/hypernatremic-dehydration-avp-deficiency';

const administration = (model: AvpDeficiency, tick = 0) => {
  for (const action of ['call-support', 'review-context', 'monitor']) model.apply(action, tick);
};
const restored = () => {
  const model = new AvpDeficiency(); model.apply('restore-volume', 0); model.advance(VOLUME); return model;
};

describe('Known AVP deficiency: circulation, prescribed treatment, and observed water balance', () => {
  it('binds the narrative model and literal fixture clocks without inventing clinical approval', () => {
    expect(validateScenario(scenario)).toEqual([]);
    expect(scenario.metadata).toMatchObject({ version: '0.1.0', estimatedMinutes: 135, maturity: 'preview',
      clinicalReview: { reviewer: 'UNSIGNED', contentVersion: '0.1.0' } });
    expect(supportsAvpDeficiency(scenario)).toBe(true);
    for (const other of [ROUTINE_INDUCTION, { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsAvpDeficiency(other)).toBe(false);
    }
    expect(FIXTURES).toMatchObject({ scenarioId: 'hypernatremic-dehydration-avp-deficiency', contentVersion: '0.1.0', seed: 4919 });
    expect(FIXTURES.scenarioId).toBe(scenario.metadata.id);
    expect(FIXTURES.contentVersion).toBe(scenario.metadata.version);
    expect([VOLUME, DELAY, DESMOPRESSIN, UNCONTROLLED, RESPONSE, TAKEOVER, SESSION])
      .toEqual([9000, 18000, 18000, 72000, 72000, 36000, 180000]);
    expect(AVP_DEFICIENCY_ACTIONS).toHaveLength(10);
    expect(FIXTURES.expert).toHaveLength(9);
  });

  it('starts with supplied sodium and hypovolemia, not a fabricated requested urine result', () => {
    const model = new AvpDeficiency();
    expect(model.snapshot(0)).toMatchObject({ observation: null, peakObservedSodiumMmolL: 162,
      circulationRestored: false, volumeObserved: false, diluteLossesObserved: false, responseObserved: false,
      volumeDueInSeconds: null, responseDueInSeconds: null, doseModelAvailable: false, durableRecoveryProven: false });
    expect(model.vitals()).toEqual({ systolicMmHg: 90, diastolicMmHg: 54, meanArterialMmHg: 66,
      heartRateBpm: 112, respiratoryRateBpm: 20, spo2Percent: 98, coreTemperatureC: 37.1,
      alertness: 'awake, thirsty, and tired' });
    model.apply('reassess', 0);
    expect(model.snapshot(0).observation).toMatchObject({ sodiumMmolL: 162, urineOutputMlPerHour: 60,
      urineOsmolalityMosmPerKg: 100, atTick: 0 });
  });

  it.each(['call-support', 'review-context', 'monitor'])('accepts %s once without changing physiology or measuring results', (action) => {
    const model = new AvpDeficiency(); const initial = model.vitals();
    expect(model.apply(action, 0)).toHaveLength(1); expect(model.apply(action, 1)).toEqual([]);
    expect(model.vitals()).toEqual(initial); expect(model.snapshot(1).observation).toBeNull();
  });

  it('restores volume immediately without laboratory or administrative prerequisites and retains the request time', () => {
    const model = new AvpDeficiency();
    expect(model.apply('restore-volume', 0).at(-1)?.id).toBe('volume-restoration');
    expect(model.apply('restore-volume', 1)).toEqual([]);
    expect(model.snapshot(1)).toMatchObject({ volumeAtTick: 0, supportActive: false, monitoringAtTick: null,
      contextReviewedAtTick: null, observation: null, volumeDueInSeconds: 900 });
    expect(model.advance(VOLUME - 1)).toEqual([]);
    expect(model.snapshot(VOLUME - 1).volumeDueInSeconds).toBe(1);
    expect(model.advance(VOLUME).map(({ id }) => id)).toEqual(['volume-checkpoint']);
    expect(model.snapshot(VOLUME)).toMatchObject({ circulationRestored: true, volumeDueInSeconds: null,
      volumeObserved: false, diluteLossesObserved: false, observation: null, peakObservedSodiumMmolL: 162 });
    expect(model.vitals()).toMatchObject({ systolicMmHg: 110, diastolicMmHg: 68, meanArterialMmHg: 82, heartRateBpm: 92 });
  });

  it.each(['replace-water', 'restore-desmopressin'])('keeps %s behind the selected circulation priority, not a diagnostic test', (action) => {
    const model = new AvpDeficiency();
    expect(model.apply(action, 0).at(-1)?.id).toMatch(/review-refused$/);
    model.apply('restore-volume', 0);
    expect(model.apply(action, VOLUME - 1).at(-1)?.id).toMatch(/review-refused$/);
    expect(model.apply(action, VOLUME).at(-1)?.id).not.toMatch(/refused$/);
    expect(model.snapshot(VOLUME).observation).toBeNull();
  });

  it.each([['replace-water', 'restore-desmopressin'], ['restore-desmopressin', 'replace-water']])('accepts %s then %s with no assessment, administrative, or other-treatment gate', (first, second) => {
      const model = restored(); model.apply(first, VOLUME); model.apply(second, VOLUME);
      expect(model.snapshot(VOLUME)).toMatchObject({ waterAtTick: VOLUME, desmopressinAtTick: VOLUME,
        observation: null, supportActive: false, contextReviewedAtTick: null, monitoringAtTick: null,
        volumeObserved: false, diluteLossesObserved: false, responseDueInSeconds: 7200 });
      model.apply('reassess', VOLUME + RESPONSE);
      expect(model.snapshot(VOLUME + RESPONSE)).toMatchObject({ responseObserved: true,
        observation: { sodiumMmolL: 162, urineOutputMlPerHour: 80, urineOsmolalityMosmPerKg: 500 } });
      expect(model.apply('handoff', VOLUME + RESPONSE).at(-1)?.id).toBe('handoff-refused');
      administration(model, VOLUME + RESPONSE); model.apply('handoff', VOLUME + RESPONSE);
      expect(model.snapshot(VOLUME + RESPONSE).ended).toBe('handoff');
    });

  it('keeps unrequested sodium, urine findings and peak private while circulation is visibly restored', () => {
    const model = new AvpDeficiency(); model.apply('reassess', 0); model.apply('restore-volume', 0);
    const initial = model.snapshot(0).observation;
    const events = [...model.advance(VOLUME), ...model.advance(UNCONTROLLED)];
    expect(model.snapshot(UNCONTROLLED)).toMatchObject({ observation: initial, peakObservedSodiumMmolL: 162,
      volumeObserved: false, diluteLossesObserved: false, circulationRestored: true });
    expect(JSON.stringify({ events, snapshot: model.snapshot(UNCONTROLLED), vitals: model.vitals() }))
      .not.toMatch(/163|165|450|urine losses are high|dilute losses observed/);
    model.apply('reassess', UNCONTROLLED);
    expect(model.snapshot(UNCONTROLLED)).toMatchObject({ peakObservedSodiumMmolL: 165, volumeObserved: true,
      diluteLossesObserved: true, observation: { sodiumMmolL: 165, urineOutputMlPerHour: 450, urineOsmolalityMosmPerKg: 95 } });
  });

  it('desmopressin alone reduces authored urine losses without replacing the water deficit or automatically redosing', () => {
    const model = restored(); model.apply('restore-desmopressin', VOLUME);
    model.apply('reassess', VOLUME + DESMOPRESSIN - 1);
    expect(model.snapshot(VOLUME + DESMOPRESSIN - 1).observation).toMatchObject({ sodiumMmolL: 163, urineOutputMlPerHour: 450 });
    expect(model.advance(VOLUME + DESMOPRESSIN)).toEqual([]);
    model.apply('reassess', VOLUME + DESMOPRESSIN);
    expect(model.snapshot(VOLUME + DESMOPRESSIN)).toMatchObject({ responseDueInSeconds: null, responseObserved: false,
      waterAtTick: null, observation: { sodiumMmolL: 163, urineOutputMlPerHour: 80, urineOsmolalityMosmPerKg: 500 } });
    expect(model.apply('restore-desmopressin', UNCONTROLLED)).toEqual([]);
    expect(model.snapshot(UNCONTROLLED).desmopressinAtTick).toBe(VOLUME);
    model.apply('reassess', UNCONTROLLED);
    expect(model.snapshot(UNCONTROLLED).observation?.sodiumMmolL).toBe(163);
  });

  it('water alone neither corrects AVP deficiency nor falsely establishes sodium normalization', () => {
    const model = restored(); model.apply('replace-water', VOLUME); model.apply('reassess', UNCONTROLLED);
    expect(model.snapshot(UNCONTROLLED)).toMatchObject({ responseObserved: false, responseDueInSeconds: null,
      desmopressinAtTick: null, observation: { sodiumMmolL: 163, urineOutputMlPerHour: 450, urineOsmolalityMosmPerKg: 95 } });
    expect(model.apply('handoff', UNCONTROLLED).at(-1)?.id).toBe('handoff-refused');
  });

  it('keeps timers, messages, and historical findings identical across an unrequested sodium rise', () => {
    const early = restored(); const late = restored();
    for (const model of [early, late]) model.apply('reassess', VOLUME);
    expect(early.apply('replace-water', UNCONTROLLED - 1)).toEqual(late.apply('replace-water', UNCONTROLLED));
    expect(early.apply('restore-desmopressin', UNCONTROLLED - 1)).toEqual(late.apply('restore-desmopressin', UNCONTROLLED));
    const comparable = (model: AvpDeficiency, tick: number) => ({
      ...model.snapshot(tick), waterAtTick: 0, desmopressinAtTick: 0,
    });
    expect(comparable(early, UNCONTROLLED - 1)).toEqual(comparable(late, UNCONTROLLED));
    expect(early.advance(UNCONTROLLED - 1 + RESPONSE)).toEqual(late.advance(UNCONTROLLED + RESPONSE));
    expect(comparable(early, UNCONTROLLED - 1 + RESPONSE)).toEqual(comparable(late, UNCONTROLLED + RESPONSE));
    expect(late.snapshot(UNCONTROLLED + RESPONSE)).toMatchObject({ peakObservedSodiumMmolL: 163,
      responseObserved: false, observation: { atTick: VOLUME, sodiumMmolL: 163, urineOutputMlPerHour: 450 } });
    early.apply('reassess', UNCONTROLLED - 1 + RESPONSE); late.apply('reassess', UNCONTROLLED + RESPONSE);
    expect(early.snapshot(UNCONTROLLED - 1 + RESPONSE).observation?.sodiumMmolL).toBe(162);
    expect(late.snapshot(UNCONTROLLED + RESPONSE).observation?.sodiumMmolL).toBe(164);
    // A never-requested hidden peak is not retrospective observed history.
    expect(late.snapshot(UNCONTROLLED + RESPONSE).peakObservedSodiumMmolL).toBe(164);
  });

  it('requires a fresh combined-care assessment and retains the observed peak after partial correction', () => {
    const model = restored(); administration(model, VOLUME); model.apply('reassess', UNCONTROLLED);
    model.apply('restore-desmopressin', UNCONTROLLED); model.apply('replace-water', UNCONTROLLED);
    expect(model.advance(UNCONTROLLED + RESPONSE - 1)).toEqual([]);
    expect(model.snapshot(UNCONTROLLED + RESPONSE - 1).responseDueInSeconds).toBe(1);
    expect(model.advance(UNCONTROLLED + RESPONSE).map(({ id }) => id)).toEqual(['response-checkpoint']);
    expect(model.snapshot(UNCONTROLLED + RESPONSE)).toMatchObject({ responseObserved: false,
      peakObservedSodiumMmolL: 165, observation: { sodiumMmolL: 165 }, ended: null });
    expect(model.apply('handoff', UNCONTROLLED + RESPONSE).at(-1)?.id).toBe('handoff-refused');
    model.apply('reassess', UNCONTROLLED + RESPONSE); model.apply('handoff', UNCONTROLLED + RESPONSE + 1);
    expect(model.snapshot(UNCONTROLLED + RESPONSE + 1)).toMatchObject({ responseObserved: true,
      peakObservedSodiumMmolL: 165, observation: { sodiumMmolL: 164 }, ended: 'handoff' });
  });

  it('records a prompt observed peak even when later sodium is lower and requires fresh evidence', () => {
    const prompt = restored(); administration(prompt, VOLUME); prompt.apply('reassess', VOLUME);
    prompt.apply('replace-water', VOLUME); prompt.apply('restore-desmopressin', VOLUME + 1);
    const at = VOLUME + 1 + RESPONSE;
    prompt.advance(at); expect(prompt.apply('handoff', at).at(-1)?.id).toBe('handoff-refused');
    prompt.apply('reassess', at); prompt.apply('handoff', at + 1);
    expect(prompt.snapshot(at + 1)).toMatchObject({ ended: 'handoff', peakObservedSodiumMmolL: 163,
      observation: { sodiumMmolL: 162 }, responseObserved: true });
  });

  it('does not erase the sodium rise during delayed volume restoration', () => {
    const model = new AvpDeficiency(); model.apply('reassess', DELAY); model.apply('restore-volume', DELAY);
    model.apply('reassess', DELAY + VOLUME);
    expect(model.snapshot(DELAY + VOLUME)).toMatchObject({ volumeDelayed: true, peakObservedSodiumMmolL: 164,
      observation: { sodiumMmolL: 164, urineOutputMlPerHour: 450 } });
    model.apply('restore-desmopressin', DELAY + VOLUME); model.apply('replace-water', DELAY + VOLUME);
    model.apply('reassess', DELAY + VOLUME + RESPONSE);
    expect(model.snapshot(DELAY + VOLUME + RESPONSE)).toMatchObject({ peakObservedSodiumMmolL: 164,
      observation: { sodiumMmolL: 163 }, responseObserved: true });
  });

  it('lets the exact unfinished stop win over a simultaneous response checkpoint and refuses stale care', () => {
    const model = restored(); administration(model, VOLUME); model.apply('replace-water', SESSION - RESPONSE);
    model.apply('restore-desmopressin', SESSION - RESPONSE);
    expect(model.advance(SESSION).map(({ id }) => id)).toEqual(['response-checkpoint', 'instructor-takeover']);
    expect(model.apply('reassess', SESSION).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(SESSION)).toMatchObject({ ended: 'instructor-takeover', responseObserved: false });
  });

  it.each(['call-support', 'review-context', 'monitor'])('keeps missing %s as a handoff responsibility, never an urgent-care gate', (missing) => {
    const model = restored();
    for (const action of ['call-support', 'review-context', 'monitor']) if (action !== missing) model.apply(action, VOLUME);
    model.apply('replace-water', VOLUME); model.apply('restore-desmopressin', VOLUME);
    model.apply('reassess', VOLUME + RESPONSE);
    expect(model.snapshot(VOLUME + RESPONSE).responseObserved).toBe(true);
    expect(model.apply('handoff', VOLUME + RESPONSE).at(-1)?.id).toBe('handoff-refused');
    model.apply(missing, VOLUME + RESPONSE); model.apply('handoff', VOLUME + RESPONSE);
    expect(model.snapshot(VOLUME + RESPONSE).ended).toBe('handoff');
  });

  it('retains mistakes after rescue, refuses stale withholding, and never starts rapid normalization', () => {
    const model = restored(); model.apply('normalize-now', VOLUME); model.apply('withhold-desmopressin', VOLUME);
    model.apply('restore-desmopressin', VOLUME);
    expect(model.snapshot(VOLUME)).toMatchObject({ normalizationAttempted: true, withholdingChosen: true });
    const prompt = restored(); prompt.apply('restore-desmopressin', VOLUME);
    expect(prompt.apply('withhold-desmopressin', VOLUME).at(-1)?.id).toBe('action-refused');
    expect(prompt.snapshot(VOLUME).withholdingChosen).toBe(false);
    expect(prompt.apply('normalize-now', VOLUME).at(-1)?.id).toBe('normalization-refused');
  });

  it('deteriorates without volume, preserves masked polyuria, and enforces the exact teaching stop', () => {
    const model = new AvpDeficiency(); expect(model.advance(DELAY - 1)).toEqual([]);
    expect(model.advance(DELAY).map(({ id }) => id)).toEqual(['volume-delay']);
    expect(model.vitals()).toMatchObject({ systolicMmHg: 80, diastolicMmHg: 46, meanArterialMmHg: 57, heartRateBpm: 124 });
    model.apply('reassess', DELAY);
    expect(model.snapshot(DELAY)).toMatchObject({ volumeDelayed: true, observation: { sodiumMmolL: 164, urineOutputMlPerHour: 60 } });
    expect(model.apply('restore-volume', TAKEOVER).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(TAKEOVER)).toMatchObject({ ended: 'instructor-takeover', volumeAtTick: null });
    const before = new AvpDeficiency(); before.apply('restore-volume', TAKEOVER - 1); before.advance(TAKEOVER);
    expect(before.snapshot(TAKEOVER).ended).toBeNull();
  });

  it('copies observations, never advances by reading, rejects hostile actions without echoing, and freezes after ending', () => {
    const model = new AvpDeficiency(); model.apply('restore-volume', 0);
    expect(model.snapshot(SESSION)).toMatchObject({ circulationRestored: false, volumeDueInSeconds: 0, ended: null });
    for (const action of [null, '__proto__', { action: 'restore-volume', private: 'private-value' }]) {
      expect(model.apply(action, 0).at(-1)?.id).toBe('action-refused');
      expect(JSON.stringify(model.snapshot(0))).not.toContain('private-value');
    }
    model.apply('reassess', 0);
    (model.snapshot(0).observation as { sodiumMmolL: number }).sodiumMmolL = 999;
    expect(model.snapshot(0).observation?.sodiumMmolL).toBe(162);
    model.advance(SESSION); const ended = model.snapshot(SESSION);
    expect(model.advance(SESSION + 1)).toEqual([]); model.apply('restore-desmopressin', SESSION + 1);
    expect(model.snapshot(SESSION + 1)).toEqual(ended);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays %s deterministically with incremental and coarse advancement', (course) => {
    const run = (incremental: boolean) => {
      const model = new AvpDeficiency(); const actions = FIXTURES[course]; let previous = 0;
      for (const [tick, action] of actions) {
        if (incremental) for (let current = previous; current < tick; current++) model.advance(current);
        model.apply(action, tick); previous = tick;
      }
      if (course === 'commonError' || course === 'noAction') model.advance(SESSION);
      return model.snapshot(course === 'commonError' || course === 'noAction' ? SESSION : previous);
    };
    const first = run(false); const second = run(true);
    expect(first).toEqual(second);
    expect(createHash('sha256').update(JSON.stringify(first)).digest('hex'))
      .toBe(createHash('sha256').update(JSON.stringify(run(false))).digest('hex'));
    expect(first.ended).toBe(course === 'expert' || course === 'recovery' ? 'handoff' : 'instructor-takeover');
    if (course === 'recovery') expect(first).toMatchObject({ withholdingChosen: true, normalizationAttempted: true, volumeDelayed: true });
  });
});

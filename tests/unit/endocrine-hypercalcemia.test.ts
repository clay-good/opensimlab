import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import type { Scenario } from '@anesthesia/scenarios/types';
import {
  Hypercalcemia, supportsHypercalcemia, HYPERCALCEMIA_FLUID_RESPONSE_TICKS, HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS,
  HYPERCALCEMIA_DELAY_TICKS, HYPERCALCEMIA_TAKEOVER_TICKS, HYPERCALCEMIA_SESSION_TICKS, type HypercalcemiaAction,
} from '../../src/modules/endocrine-metabolic/hypercalcemia';
import { HYPERCALCEMIA_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/hypercalcemia-fixtures';

const packageActions: readonly HypercalcemiaAction[] = ['tailored-fluids', 'calcitonin', 'assess-cardiorenal', 'antiresorptive', 'call-support'];
function completePackage(model: Hypercalcemia, tick = 0) {
  for (const action of packageActions) model.apply(action, tick);
}

describe('Hypercalcemia: tailored volume support and a temporary calcium bridge', () => {
  it('binds the narrative lesson shape and exact fixture identity', () => {
    const scenario: Scenario = { ...ROUTINE_INDUCTION,
      metadata: { ...ROUTINE_INDUCTION.metadata, id: FIXTURES.scenarioId, version: FIXTURES.contentVersion },
      timeline: [{ id: 'presentation', type: 'narrative', target: 'hypercalcemia', atTick: 0, severity: 'critical', message: 'Fictional HCM presentation.' },
        { id: 'boundary', type: 'narrative', target: 'hypercalcemia-boundary', atTick: 0, severity: 'warning', message: 'Authored transitions.' }],
    };
    expect(supportsHypercalcemia(scenario)).toBe(true);
    for (const other of [ROUTINE_INDUCTION, { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsHypercalcemia(other)).toBe(false);
    }
    expect(FIXTURES.contentVersion).toBe('0.1.0'); expect(FIXTURES.seed).toBe(4905);
  });

  it.each(['tailored-fluids', 'calcitonin', 'call-support', 'assess-cardiorenal'] as const)('accepts %s independently without a support or review gate', (action) => {
    const model = new Hypercalcemia(); const before = model.vitals();
    expect(model.apply(action, 0).at(-1)?.id).toBe(action === 'call-support' ? 'support' : action === 'assess-cardiorenal' ? 'cardiorenal-assessment' : action);
    expect(model.vitals()).toEqual(before);
    expect(model.snapshot(0)).toMatchObject({ observation: null, antiresorptiveAtTick: null });
    expect(model.apply(action, 1)).toEqual([]);
  });

  it('requires supplied cardiorenal review before antiresorptive care, without a hydration or new-lab wait', () => {
    const model = new Hypercalcemia(); const initial = model.vitals();
    expect(model.apply('antiresorptive', 0).at(-1)?.id).toBe('antiresorptive-review-refused');
    expect(model.snapshot(0).antiresorptiveAtTick).toBeNull();
    model.apply('assess-cardiorenal', 0);
    expect(model.apply('antiresorptive', 0).at(-1)?.id).toBe('antiresorptive');
    expect(model.snapshot(0)).toMatchObject({ cardiorenalAssessedAtTick: 0, antiresorptiveAtTick: 0,
      fluidsAtTick: null, calcitoninAtTick: null, supportActive: false, observation: null });
    expect(model.vitals()).toEqual(initial); expect(model.vitals().adjustedCalciumMgDl).toBe(16.4);
    expect(model.apply('antiresorptive', 1)).toEqual([]);
    const fluidsOnly = new Hypercalcemia(); fluidsOnly.apply('tailored-fluids', 0);
    expect(fluidsOnly.apply('antiresorptive', 1).at(-1)?.id).toBe('antiresorptive-review-refused');
    expect(fluidsOnly.snapshot(1).cardiorenalAssessedAtTick).toBeNull();
  });

  it('does not hide an instantaneous antiresorptive effect behind a completed package or its bridge response', () => {
    const treated = new Hypercalcemia(); completePackage(treated);
    const noAntiresorptive = new Hypercalcemia(); noAntiresorptive.apply('tailored-fluids', 0); noAntiresorptive.apply('calcitonin', 0);
    for (const tick of [0, HYPERCALCEMIA_FLUID_RESPONSE_TICKS, HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS - 1, HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS]) {
      treated.advance(tick); noAntiresorptive.advance(tick);
      expect(treated.vitals()).toEqual(noAntiresorptive.vitals());
    }
    expect(treated.vitals().adjustedCalciumMgDl).toBe(14.8);
    expect(noAntiresorptive.snapshot(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS)).toMatchObject({ antiresorptiveAtTick: null, supportActive: false, observation: null });
    noAntiresorptive.apply('reassess', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS);
    expect(noAntiresorptive.apply('handoff', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS).at(-1)?.id).toBe('handoff-refused');
  });

  it('makes fluid support independent of bridge and antiresorptive treatment, with an exact 15-minute boundary', () => {
    const model = new Hypercalcemia(); const at = 7; const due = at + HYPERCALCEMIA_FLUID_RESPONSE_TICKS;
    model.apply('reassess', 0); model.apply('tailored-fluids', at);
    expect(model.snapshot(at).fluidDueInSeconds).toBe(900);
    model.advance(due - 1); expect(model.snapshot(due - 1).fluidDueInSeconds).toBe(1);
    expect(model.snapshot(due).fluidDueInSeconds).toBe(0);
    expect(model.vitals()).toMatchObject({ systolicMmHg: 96, heartRateBpm: 108, adjustedCalciumMgDl: 16.4 });
    expect(model.advance(due).map(({ id }) => id)).toEqual(['fluid-response']);
    expect(model.vitals()).toMatchObject({ systolicMmHg: 106, diastolicMmHg: 64, meanArterialMmHg: 78,
      heartRateBpm: 96, respiratoryRateBpm: 18, spo2Percent: 96, coreTemperatureC: 36.8, adjustedCalciumMgDl: 16.4 });
    expect(model.snapshot(due)).toMatchObject({ fluidDueInSeconds: null, fluidResponseObserved: false,
      bridgeResponseObserved: false, calcitoninAtTick: null, antiresorptiveAtTick: null,
      observation: { atTick: 0, systolicMmHg: 96, adjustedCalciumMgDl: 16.4 } });
    expect(model.apply('reassess', due).at(-1)?.id).toBe('fluid-reassessment');
    expect(model.snapshot(due)).toMatchObject({ fluidResponseObserved: true, bridgeResponseObserved: false,
      observation: { atTick: due, systolicMmHg: 106, adjustedCalciumMgDl: 16.4 } });
    expect(model.advance(due + 1)).toEqual([]);
  });

  it('times the bridge from calcitonin alone and exposes its still-severe result only after fresh reassessment', () => {
    const model = new Hypercalcemia(); model.apply('tailored-fluids', 0); model.apply('calcitonin', 11);
    const due = 11 + HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS;
    expect(model.snapshot(11).bridgeDueInSeconds).toBe(14400);
    model.apply('reassess', HYPERCALCEMIA_FLUID_RESPONSE_TICKS);
    model.advance(due - 1); expect(model.snapshot(due - 1).bridgeDueInSeconds).toBe(1);
    expect(model.snapshot(due).bridgeDueInSeconds).toBe(0);
    expect(model.vitals().adjustedCalciumMgDl).toBe(16.4);
    const events = model.advance(due);
    expect(events.map(({ id }) => id)).toEqual(['bridge-response']);
    expect(model.vitals().adjustedCalciumMgDl).toBe(14.8);
    const beforeObservation = model.snapshot(due);
    expect(beforeObservation).not.toHaveProperty('adjustedCalciumMgDl');
    expect(JSON.stringify({ beforeObservation, events })).not.toContain('14.8');
    expect(beforeObservation).toMatchObject({ fluidResponseObserved: true, bridgeResponseObserved: false,
      observation: { atTick: HYPERCALCEMIA_FLUID_RESPONSE_TICKS, adjustedCalciumMgDl: 16.4 },
      cardiorenalAssessedAtTick: null, antiresorptiveAtTick: null, supportActive: false });
    expect(model.apply('reassess', due).at(-1)?.id).toBe('bridge-reassessment');
    expect(model.snapshot(due)).toMatchObject({ bridgeResponseObserved: true, observation: { atTick: due, adjustedCalciumMgDl: 14.8 }, durableRecoveryProven: false });
  });

  it('allows a single final fresh observation to establish both responses without fabricating an earlier assessment', () => {
    const model = new Hypercalcemia(); completePackage(model); model.advance(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS);
    expect(model.snapshot(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS)).toMatchObject({ observation: null, fluidResponseObserved: false, bridgeResponseObserved: false });
    expect(model.apply('handoff', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS).at(-1)?.id).toBe('handoff-refused');
    model.apply('reassess', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS);
    expect(model.snapshot(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS)).toMatchObject({ fluidResponseObserved: true, bridgeResponseObserved: true });
    expect(model.apply('handoff', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS).at(-1)?.id).toBe('handoff');
    expect(model.snapshot(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS)).toMatchObject({ ended: 'handoff', durableRecoveryProven: false });
  });

  it.each(['tailored-fluids', 'calcitonin'] as const)('retains an urgent omission when %s is missing and never invents worse vital signs', (missing) => {
    const model = new Hypercalcemia(); for (const action of packageActions) if (action !== missing) model.apply(action, 0);
    expect(model.advance(HYPERCALCEMIA_DELAY_TICKS - 1)).toEqual([]);
    expect(model.snapshot(HYPERCALCEMIA_DELAY_TICKS - 1).urgentTreatmentDelayed).toBe(false);
    expect(model.advance(HYPERCALCEMIA_DELAY_TICKS).map(({ id }) => id)).toContain('urgent-treatment-delay');
    expect(model.snapshot(HYPERCALCEMIA_DELAY_TICKS).urgentTreatmentDelayed).toBe(true);
    expect(model.vitals()).toMatchObject({ systolicMmHg: missing === 'tailored-fluids' ? 96 : 106,
      adjustedCalciumMgDl: 16.4 });
    expect(model.advance(HYPERCALCEMIA_DELAY_TICKS + 1)).toEqual([]);
    model.advance(HYPERCALCEMIA_TAKEOVER_TICKS - 1); expect(model.snapshot(HYPERCALCEMIA_TAKEOVER_TICKS - 1).ended).toBeNull();
    expect(model.advance(HYPERCALCEMIA_TAKEOVER_TICKS).map(({ id }) => id)).toEqual(['instructor-takeover']);
  });

  it.each(['assess-cardiorenal', 'antiresorptive', 'call-support'] as const)('does not falsely complete care when %s is missing despite both observed responses', (missing) => {
    const model = new Hypercalcemia(); for (const action of packageActions) if (action !== missing) model.apply(action, 0);
    model.apply('reassess', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS);
    expect(model.snapshot(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS)).toMatchObject({ fluidResponseObserved: true, bridgeResponseObserved: true, urgentTreatmentDelayed: false });
    expect(model.apply('handoff', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS).at(-1)?.id).toBe('handoff-refused');
    model.advance(HYPERCALCEMIA_SESSION_TICKS - 1); expect(model.snapshot(HYPERCALCEMIA_SESSION_TICKS - 1).ended).toBeNull();
    expect(model.advance(HYPERCALCEMIA_SESSION_TICKS).map(({ id }) => id)).toEqual(['instructor-takeover']);
  });

  it('does not treat an earlier fluid observation as the later calcium result and bounds an omitted handoff', () => {
    const model = new Hypercalcemia(); completePackage(model); model.apply('reassess', HYPERCALCEMIA_FLUID_RESPONSE_TICKS);
    model.advance(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS);
    expect(model.snapshot(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS).observation).toMatchObject({ atTick: HYPERCALCEMIA_FLUID_RESPONSE_TICKS, adjustedCalciumMgDl: 16.4 });
    expect(model.apply('handoff', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS).at(-1)?.id).toBe('handoff-refused');
    model.apply('reassess', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS);
    model.advance(HYPERCALCEMIA_SESSION_TICKS);
    expect(model.snapshot(HYPERCALCEMIA_SESSION_TICKS)).toMatchObject({ ended: 'instructor-takeover', bridgeResponseObserved: true, durableRecoveryProven: false });
  });

  it('refuses and retains unrestricted fluids and routine calcium-lowering diuresis without claiming all diuretics are wrong', () => {
    const model = new Hypercalcemia(); const initial = model.vitals();
    expect(model.apply('unrestricted-fluids', 0).at(-1)?.id).toBe('unrestricted-fluids-refused');
    const diuretic = model.apply('routine-diuretic', 0).at(-1)!;
    expect(diuretic.id).toBe('routine-diuretic-refused'); expect(diuretic.message).toContain('may use them for fluid overload');
    expect(model.vitals()).toEqual(initial);
    completePackage(model, 1); model.apply('reassess', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS + 1);
    expect(model.snapshot(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS + 1)).toMatchObject({ unrestrictedFluidsAttempted: true,
      routineDiureticAttempted: true, fluidResponseObserved: true, bridgeResponseObserved: true });
    expect(model.apply('routine-diuretic', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS + 1).at(-1)?.id).toBe('routine-diuretic-refused');
  });

  it.each(['tailored-fluids', 'calcitonin'] as const)('records waiting for the cause while %s is missing, then refuses stale delay choices', (missing) => {
    const model = new Hypercalcemia(); for (const action of packageActions) if (action !== missing) model.apply(action, 0);
    expect(model.apply('wait-for-cause', 1).at(-1)?.id).toBe('cause-delay-choice');
    completePackage(model, 2);
    expect(model.apply('wait-for-cause', 3).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(3).waitForCauseChosen).toBe(true);
    const correct = new Hypercalcemia(); completePackage(correct);
    correct.apply('wait-for-cause', 1); expect(correct.snapshot(1).waitForCauseChosen).toBe(false);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every tick of the %s fixture with deterministic retained evidence', (path) => {
    const complete = path === 'expert' || path === 'recovery'; const mistakes = path === 'commonError' || path === 'recovery';
    const actions = FIXTURES[path]; const until = complete ? actions.at(-1)![0] + 1 : HYPERCALCEMIA_TAKEOVER_TICKS + 1;
    const run = () => {
      const model = new Hypercalcemia(); const hash = createHash('sha256'); let next = 0;
      for (let tick = 0; tick <= until; tick += 1) {
        const events = model.advance(tick);
        while (actions[next]?.[0] === tick) { events.push(...model.apply(actions[next]![1], tick)); next += 1; }
        hash.update(JSON.stringify({ tick, vitals: model.vitals(), patient: model.snapshot(tick), events }));
      }
      return { hash: hash.digest('hex'), patient: model.snapshot(until) };
    };
    const first = run(); expect(run()).toEqual(first);
    expect(first.patient).toMatchObject({ ended: complete ? 'handoff' : 'instructor-takeover',
      fluidResponseObserved: complete, bridgeResponseObserved: complete, urgentTreatmentDelayed: path !== 'expert',
      unrestrictedFluidsAttempted: mistakes, routineDiureticAttempted: mistakes, waitForCauseChosen: mistakes, durableRecoveryProven: false });
    if (complete) expect(first.patient.observation?.adjustedCalciumMgDl).toBe(14.8);
  });

  it('does not reflect hostile inputs, expose mutable observations, or mutate ended branches', () => {
    const model = new Hypercalcemia();
    for (const action of [null, {}, '__proto__', { action: 'calcitonin', private: 'private-value' }]) {
      const events = model.apply(action, 0);
      expect(events).toEqual([{ id: 'action-refused', message: 'That choice is not part of this fictional hypercalcemia lesson. Nothing changed.' }]);
      expect(JSON.stringify(events)).not.toContain('private-value');
    }
    model.apply('reassess', 0); const exposed = model.snapshot(0).observation!;
    Object.assign(exposed, { adjustedCalciumMgDl: 999, fluidTolerance: 'changed' });
    expect(model.snapshot(0).observation).toMatchObject({ adjustedCalciumMgDl: 16.4 });
    expect(model.snapshot(0).observation?.fluidTolerance).not.toBe('changed');
    model.advance(HYPERCALCEMIA_TAKEOVER_TICKS); const ended = model.snapshot(HYPERCALCEMIA_TAKEOVER_TICKS);
    for (const action of [...packageActions, 'unrestricted-fluids', 'routine-diuretic', 'wait-for-cause', 'reassess', 'handoff']) model.apply(action, HYPERCALCEMIA_SESSION_TICKS);
    expect(model.advance(HYPERCALCEMIA_SESSION_TICKS)).toEqual([]); expect(model.snapshot(HYPERCALCEMIA_SESSION_TICKS)).toEqual(ended);
  });
});

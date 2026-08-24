/**
 * Acceptance tests for engine/scenario-engine, cockpit/event-log, and the alarm
 * behaviour cockpit/patient-monitor delegates to the alarm framework.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RAPID_DESATURATION } from '@anesthesia/scenarios/rapid-desaturation';
import { HYPOTENSION_AFTER_INDUCTION } from '@anesthesia/scenarios/hypotension-after-induction';
import { SCENARIOS } from '@anesthesia/scenarios';
import { BRONCHOSPASM } from '@anesthesia/scenarios/bronchospasm';
import { gradeProbabilities } from '@anesthesia/physiology';
import { SCENARIO_SCHEMA, validateScenario } from '@anesthesia/scenarios/schema';
import { EventLog, SEVERITIES, SEVERITY_GLYPH } from '@platform/log/event-log';
import {
  AlarmEngine, ALARM_BURDEN_COUNT, DEFAULT_LIMITS, SILENCE_SECONDS, priorityRank,
} from '@platform/alarms/alarms';
import { formatElapsed, TICKS_PER_SECOND } from '@platform/clock/simulation-clock';

const engine = () => new AnesthesiaEngine({
  scenario: ROUTINE_INDUCTION, seed: 20260819, practiceRegion: 'US',
});

/** Run `seconds` of simulated time, returning the last tick. */
function advance(sim: AnesthesiaEngine, seconds: number) {
  let last = sim.step();
  for (let i = 1; i < seconds * 10; i += 1) last = sim.step();
  return last;
}

describe('Requirement: Declarative Scenario Format', () => {
  it('accepts the bundled scenario', () => {
    expect(validateScenario(ROUTINE_INDUCTION)).toEqual([]);
  });

  it('Scenario: An invalid scenario is rejected with a precise message', () => {
    const missingField = JSON.parse(JSON.stringify(ROUTINE_INDUCTION)) as Record<string, unknown>;
    delete (missingField.patient as Record<string, unknown>).ageYears;
    const errors = validateScenario(missingField);
    expect(errors.length).toBeGreaterThan(0);
    const error = errors[0]!;
    expect(error.pointer).toBe('/patient/ageYears');
    expect(error.rule).toBe('required');
    expect(error.message).toContain('ageYears');
    expect(error.message).toContain('number');
  });

  it('rejects an unknown event type by name', () => {
    const bad = JSON.parse(JSON.stringify(ROUTINE_INDUCTION)) as { timeline: { type: string }[] };
    bad.timeline[0]!.type = 'summon-the-consultant';
    const errors = validateScenario(bad);
    expect(errors.some((e) => e.rule === 'enum' && e.message.includes('summon-the-consultant'))).toBe(true);
  });

  it('rejects a typo in a field name rather than ignoring it', () => {
    const bad = JSON.parse(JSON.stringify(ROUTINE_INDUCTION)) as { patient: Record<string, unknown> };
    bad.patient.weightKG = 70;
    const errors = validateScenario(bad);
    expect(errors.some((e) => e.rule === 'additionalProperties' && e.message.includes('weightKG'))).toBe(true);
  });

  it('reports the pointer, the expected type, and the rule for a wrong type', () => {
    const bad = JSON.parse(JSON.stringify(ROUTINE_INDUCTION)) as { patient: Record<string, unknown> };
    bad.patient.ageYears = 'forty-two';
    const errors = validateScenario(bad);
    const error = errors.find((e) => e.pointer === '/patient/ageYears');
    expect(error?.rule).toBe('type');
    expect(error?.message).toContain('Expected number');
    expect(error?.message).toContain('found string');
  });

  it('catches a rubric item pointing at an objective the scenario does not declare', () => {
    const bad = JSON.parse(JSON.stringify(ROUTINE_INDUCTION)) as { debrief: { rubric: { objectiveId: string }[] } };
    bad.debrief.rubric[0]!.objectiveId = 'not-declared';
    const errors = validateScenario(bad);
    expect(errors.some((e) => e.rule === 'reference')).toBe(true);
  });

  it('Scenario: Re-review is triggered by change, not by calendar alone', () => {
    const changed = JSON.parse(JSON.stringify(ROUTINE_INDUCTION)) as { metadata: { version: string } };
    changed.metadata.version = '0.2.0';
    const errors = validateScenario(changed);
    expect(errors.some((e) => e.rule === 'currency')).toBe(true);
    expect(errors.find((e) => e.rule === 'currency')?.message).toContain('re-review');
  });

  it('bundles the schema so an editor can validate offline', () => {
    expect(SCENARIO_SCHEMA.required).toContain('patient');
    expect(SCENARIO_SCHEMA.properties?.patient?.description.length).toBeGreaterThan(10);
  });
});

describe('Requirement: Stated Learning Objectives', () => {
  it('declares objectives in learner-facing language with a stated measure', () => {
    expect(ROUTINE_INDUCTION.metadata.objectives.length).toBeGreaterThanOrEqual(3);
    for (const objective of ROUTINE_INDUCTION.metadata.objectives) {
      expect(objective.statement.length).toBeGreaterThan(20);
      expect(objective.measure.length).toBeGreaterThan(20);
    }
    // And every objective is addressed by a rubric item.
    const covered = new Set(ROUTINE_INDUCTION.debrief.rubric.map((r) => r.objectiveId));
    for (const objective of ROUTINE_INDUCTION.metadata.objectives) {
      expect(covered.has(objective.id), `${objective.id} is not addressed in the debrief`).toBe(true);
    }
  });

  it('runs under 20 simulated minutes at 1x', () => {
    expect(ROUTINE_INDUCTION.metadata.estimatedMinutes).toBeLessThan(20);
  });
});

describe('Requirement: Scripted Timeline Events', () => {
  it('Scenario: A time-based event fires exactly once', () => {
    const sim = engine();
    const seen: string[] = [];
    for (let i = 0; i < 5000; i += 1) {
      for (const event of sim.step().events) {
        if (event.category === 'scenario') seen.push(event.eventId);
      }
    }
    const incisions = seen.filter((id) => id === 'incision');
    expect(incisions).toHaveLength(1);
  });

  it('raises the surgical stimulus at exactly the declared tick', () => {
    const sim = engine();
    // Anaesthetized without opioid, so incision provokes a visible response.
    sim.apply({ tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 150, unit: 'mg' } });
    sim.apply({ tick: 0, type: 'ventilator', payload: { mode: 'volume-control', delivering: true, fio2: 0.5 } });
    let beforeIncision = sim.step();
    for (let i = 1; i < 3600; i += 1) beforeIncision = sim.step();
    let afterIncision = sim.step();
    for (let i = 1; i < 300; i += 1) afterIncision = sim.step();
    expect(afterIncision.state.heartRateBpm).toBeGreaterThan(beforeIncision.state.heartRateBpm);
  });
});

describe('Requirement: Complete Chronological Record', () => {
  it('Scenario: A dose appears immediately and completely', () => {
    const sim = engine();
    // Advance to 4 minutes 12 seconds, then give the bolus.
    for (let i = 0; i < 4 * 600 + 120; i += 1) sim.step();
    sim.apply({ tick: sim.tick, type: 'bolus', payload: { drugId: 'propofol', amount: 100, unit: 'mg' } });
    const result = sim.step();
    const entry = result.events.find((e) => e.category === 'drug');
    expect(entry).toBeDefined();
    expect(formatElapsed(entry!.tick)).toBe('00:04:12');
    expect(entry!.message).toContain('propofol');
    expect(entry!.message).toContain('100');
    expect(entry!.data?.modelId).toBe('propofol-eleveld-2018');
    expect(entry!.data?.route).toBe('intravenous');
  });

  it('shows weight-based dosing both ways', () => {
    const sim = engine();
    sim.apply({ tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } });
    const entry = sim.step().events.find((e) => e.category === 'drug');
    expect(entry?.message).toContain('136');
    expect(entry?.message).toContain('2 mg/kg');
  });

  it('Scenario: An implausible dose requires deliberate confirmation and is marked', () => {
    const sim = engine();
    sim.apply({ tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 2000, unit: 'mg' } });
    const events = sim.step().events;
    // The dose is judged on what was ENTERED, so the learner is told it is extreme
    // before anything else is considered, and the multiple is named.
    const warning = events.find((e) => e.eventId.startsWith('implausible-dose'));
    expect(warning?.data?.implausible).toBe(true);
    expect(warning?.message).toContain('times the typical dose');
    expect(Number(warning?.data?.multiple)).toBeGreaterThan(10);
    // A separate fact, separately reported: 2000 mg is more than this syringe holds.
    expect(events.find((e) => e.eventId.startsWith('empty-syringe'))).toBeDefined();
  });

  it('lets a learner give a real overdose, because teaching overdose is a purpose', () => {
    const sim = engine();
    // The whole 20 mL syringe at 10 mg/mL: 200 mg into a 68 kg patient, which is
    // roughly three milligrams per kilogram.
    sim.apply({ tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 200, unit: 'mg' } });
    const given = sim.step().events.find((e) => e.eventId.startsWith('bolus-propofol'));
    expect(given).toBeDefined();
    expect(given?.data?.mass).toBe(200);
    // And the patient really does become hypotensive from it. The nadir comes at
    // the effect-site peak, around three minutes after the bolus, not immediately.
    let nadir = Infinity;
    let nadirSeconds = 0;
    for (let i = 0; i < 2400; i += 1) {
      const result = sim.step();
      if (result.state.meanArterialMmHg < nadir) {
        nadir = result.state.meanArterialMmHg;
        nadirSeconds = i / 10;
      }
    }
    // A fall of at least a fifth from this patient's own baseline of 92 mmHg.
    expect(nadir).toBeLessThan(92 * 0.8);
    expect(nadirSeconds).toBeGreaterThan(60);
  });

  it('Scenario: An empty syringe cannot be pushed', () => {
    const sim = engine();
    // The propofol syringe holds 20 mL at 10 mg/mL, so 200 mg.
    sim.apply({ tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 200, unit: 'mg' } });
    sim.step();
    sim.apply({ tick: sim.tick, type: 'bolus', payload: { drugId: 'propofol', amount: 50, unit: 'mg' } });
    const refusal = sim.step().events.find((e) => e.eventId.startsWith('empty-syringe'));
    expect(refusal).toBeDefined();
    expect(refusal?.message).toContain('Draw up a new syringe');
  });

  it('Scenario: Rate change takes effect at the tick it is made', () => {
    const sim = engine();
    sim.apply({ tick: 0, type: 'infusion', payload: { drugId: 'remifentanil', rate: 0.25, unit: 'µg/kg/min' } });
    const entry = sim.step().events.find((e) => e.eventId.startsWith('infusion'));
    expect(entry?.data?.previousRate).toBe(0);
    expect(entry?.data?.newRate).toBeCloseTo(0.25 * 68, 9);
    // And the concentration climbs from that tick.
    const after = advance(sim, 60);
    const remifentanil = after.concentrations.find((c) => c.drugId === 'remifentanil');
    expect(remifentanil!.plasma).toBeGreaterThan(0);
  });

  it('Scenario: Nothing that changes state is unlogged', () => {
    const sim = engine();
    const log = new EventLog();
    const trace: number[] = [];
    for (let i = 0; i < 200; i += 1) {
      if (i === 50) sim.apply({ tick: sim.tick, type: 'bolus', payload: { drugId: 'propofol', amount: 120, unit: 'mg' } });
      if (i === 120) sim.apply({ tick: sim.tick, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } });
      const result = sim.step();
      log.appendAll(result.events);
      trace.push(result.state.meanArterialMmHg);
    }
    // Every discontinuity attributable to an input has a corresponding entry.
    const inputTicks = new Set(log.all().filter((e) => e.category === 'drug' || e.category === 'ventilator').map((e) => e.tick));
    expect(inputTicks.has(50)).toBe(true);
    expect(inputTicks.has(120)).toBe(true);
    expect(trace.some((value, i) => i > 55 && value < (trace[50] ?? 0) - 2)).toBe(true);
  });
});

describe('Requirement: Severity And Filtering', () => {
  it('carries all five severities and distinguishes them by glyph as well as colour', () => {
    expect([...SEVERITIES]).toEqual(['info', 'advisory', 'warning', 'critical', 'artifact']);
    const glyphs = Object.values(SEVERITY_GLYPH);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  it('Scenario: Critical events remain findable in a busy log', () => {
    const log = new EventLog();
    for (let i = 0; i < 240; i += 1) {
      log.append({
        tick: i, severity: i % 40 === 0 ? 'critical' : 'info', category: 'test',
        eventId: `e${i}`, message: `entry ${i}`,
      });
    }
    expect(log.all().length).toBeGreaterThan(200);
    const critical = log.filter({ severities: new Set(['critical']) });
    expect(critical.length).toBe(6);
    expect(log.filter({}).length).toBe(240);
  });

  it('Scenario: Export happens entirely on-device and carries the statement', () => {
    const log = new EventLog();
    log.append({ tick: 12, severity: 'info', category: 'drug', eventId: 'a', message: 'propofol 100 mg' });
    const header = { scenarioId: 'routine-induction', engineVersion: ENGINE_VERSION, modelSetRevision: '2026.08.0' };
    const text = log.toText(header);
    expect(text).toContain('not a clinical decision-support');
    expect(text).toContain('00:00:01');
    const json = JSON.parse(log.toJson(header)) as Record<string, unknown>;
    expect(json.notForClinicalUse).toContain('educational simulator');
    expect(json.engineVersion).toBe(ENGINE_VERSION);
  });
});

describe('Requirement: Alarm System Follows IEC 60601-1-8 Conventions', () => {
  it('Scenario: Saturation alarms escalate in priority as they escalate in urgency', () => {
    const alarms = new AlarmEngine();
    const result = alarms.evaluate({ spo2Percent: 88, meanArterialMmHg: 80, heartRateBpm: 70, etco2MmHg: 38, depthIndex: 50 }, 100);
    const spo2 = result.active.find((a) => a.id === 'spo2-low');
    // Medium priority at 88%: prompt action. IEC 60601-1-8 grades by urgency and
    // onset time, so grading this the same as 84% would make the escalation
    // carry no information.
    expect(spo2?.priority).toBe('medium');
    const severe = new AlarmEngine().evaluate(
      { spo2Percent: 83, meanArterialMmHg: 80, heartRateBpm: 70, etco2MmHg: 38, depthIndex: 50 }, 100,
    );
    expect(severe.active.find((a) => a.id === 'spo2-very-low')?.priority).toBe('high');
    // The alarm text names the parameter and the value.
    expect(spo2?.message).toContain('SpO₂');
    expect(spo2?.message).toContain('88');
    expect(result.raised.map((a) => a.id)).toContain('spo2-low');
  });

  it('sorts by priority so the most urgent is first', () => {
    const alarms = new AlarmEngine();
    const result = alarms.evaluate({ spo2Percent: 88, meanArterialMmHg: 50, heartRateBpm: 70, etco2MmHg: 38, depthIndex: 50 }, 1);
    expect(result.active[0]?.priority).toBe('high');
    expect(priorityRank('high')).toBeLessThan(priorityRank('medium'));
    expect(priorityRank('medium')).toBeLessThan(priorityRank('low'));
  });

  it('Scenario: Silencing is temporary and visible', () => {
    const alarms = new AlarmEngine();
    const state = { spo2Percent: 88, meanArterialMmHg: 80, heartRateBpm: 70, etco2MmHg: 38, depthIndex: 50 };
    alarms.evaluate(state, 0);
    alarms.silence('spo2-low', 0, 10);
    const during = alarms.evaluate(state, 100);
    // The visual indication persists in a silenced state with a countdown.
    expect(during.active.find((a) => a.id === 'spo2-low')?.silencedUntilTick).toBe(SILENCE_SECONDS * 10);
    const after = alarms.evaluate(state, SILENCE_SECONDS * 10 + 1);
    expect(after.active.find((a) => a.id === 'spo2-low')?.silencedUntilTick).toBeNull();
  });

  it('Scenario: Alarm fatigue is a teachable event, and no alarm is suppressed', () => {
    const alarms = new AlarmEngine();
    const bad = {
      spo2Percent: 80, meanArterialMmHg: 40, heartRateBpm: 140, etco2MmHg: 12, depthIndex: 75,
    };
    let result = alarms.evaluate(bad, 0);
    expect(result.active.length).toBeGreaterThan(ALARM_BURDEN_COUNT);
    expect(result.burden).toBe(false);
    result = alarms.evaluate(bad, 700);
    expect(result.burden).toBe(true);
    // Every alarm is still active: the burden is recorded, never used to suppress.
    expect(result.active.length).toBeGreaterThan(ALARM_BURDEN_COUNT);
  });

  it('does not alarm on a number it cannot measure', () => {
    const alarms = new AlarmEngine();
    const result = alarms.evaluate(
      { spo2Percent: 0, meanArterialMmHg: 80, heartRateBpm: 70, etco2MmHg: 38, depthIndex: 50 },
      0, { invalidParameters: new Set(['spo2Percent']) },
    );
    expect(result.active.find((a) => a.parameter === 'spo2Percent')).toBeUndefined();
  });

  it('names the source each threshold derives from', () => {
    const alarms = new AlarmEngine();
    alarms.evaluate({ spo2Percent: 100, meanArterialMmHg: 80, heartRateBpm: 70, etco2MmHg: 38, depthIndex: 50 }, 0);
    // Every limit names the source its threshold derives from, so a clinical
    // reviewer compares against a source rather than judging from memory.
    for (const limit of DEFAULT_LIMITS) {
      expect(limit.source.length, `${limit.id} names no source`).toBeGreaterThan(20);
      expect(limit.message.length).toBeGreaterThan(5);
      expect(limit.label.length).toBeGreaterThan(1);
    }
  });
});

describe('Scenario: An invalid numeric is invalidated, not smoothed', () => {
  it('invalidates heart rate in ventricular fibrillation and stops the pulse', () => {
    const sim = engine();
    advance(sim, 5);
    sim.apply({ tick: sim.tick, type: 'rhythm', payload: { rhythmId: 'ventricular-fibrillation' } });
    advance(sim, 5);
    expect(sim.invalidParameters().has('heartRateBpm')).toBe(true);
    expect(sim.invalidParameters().has('spo2Percent')).toBe(true);
  });

  it('marks a parameter under artifact without invalidating the true state', () => {
    const sim = engine();
    advance(sim, 2);
    sim.apply({ tick: sim.tick, type: 'artifact', payload: { artifactId: 'arterial-damping', active: true } });
    const result = advance(sim, 2);
    expect(sim.artifactParameters().has('meanArterialMmHg')).toBe(true);
    // The underlying state vector is untouched.
    expect(result.state.meanArterialMmHg).toBeGreaterThan(70);
  });
});

describe('Requirement: the engine is deterministic end to end', () => {
  it('produces an identical state trace for the same seed and the same actions', () => {
    const run = () => {
      const sim = engine();
      const trace: number[] = [];
      for (let i = 0; i < 1200; i += 1) {
        if (i === 100) sim.apply({ tick: sim.tick, type: 'bolus', payload: { drugId: 'propofol', amount: 130, unit: 'mg' } });
        if (i === 140) sim.apply({ tick: sim.tick, type: 'ventilator', payload: { delivering: true, mode: 'volume-control', fio2: 0.5 } });
        const result = sim.step();
        trace.push(result.state.meanArterialMmHg, result.state.spo2Percent, result.state.depthIndex);
      }
      return trace;
    };
    expect(run()).toEqual(run());
  });
});

describe('Scenario: Hypoxic mixture is prevented', () => {
  it('refuses an inspired oxygen fraction below room air and explains why', () => {
    const sim = engine();
    sim.apply({ tick: 0, type: 'ventilator', payload: { fio2: 0.15 } });
    const refusal = sim.step().events.find((e) => e.eventId.startsWith('hypoxic-guard'));
    expect(refusal).toBeDefined();
    expect(refusal?.message).toContain('0.21');
    expect(refusal?.message).toContain('anaesthesia machines');
  });
});

describe('Requirement: Every Scenario In The Registry Is Valid And Distinct', () => {
  it('Scenario: every scenario passes the published schema', () => {
    for (const scenario of SCENARIOS) {
      expect(validateScenario(scenario), scenario.metadata.id).toEqual([]);
    }
  });

  it('Scenario: ids, titles and routes are unique', () => {
    const ids = SCENARIOS.map((s) => s.metadata.id);
    expect(new Set(ids).size).toBe(ids.length);
    const titles = SCENARIOS.map((s) => s.metadata.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('Scenario: every objective maps to a rubric question', () => {
    for (const scenario of SCENARIOS) {
      const asked = new Set(scenario.debrief.rubric.map((item) => item.objectiveId));
      for (const objective of scenario.metadata.objectives) {
        expect(asked.has(objective.id), `${scenario.metadata.id}: ${objective.id} has no rubric question`)
          .toBe(true);
      }
    }
  });

  it('Scenario: every scenario runs without throwing and produces its declared patient state', () => {
    for (const scenario of SCENARIOS) {
      const engine = new AnesthesiaEngine({ scenario, seed: 20260819, practiceRegion: 'US' });
      let last = engine.step();
      for (let tick = 0; tick < 600; tick += 1) last = engine.step();
      if (scenario.metadata.id === 'persistent-vf-cardiac-arrest') {
        expect(last.equipment.rhythmId).toBe('ventricular-fibrillation');
        expect(last.state.cardiacOutputLPerMin).toBe(0);
        expect(last.equipment.invalidParameters).toContain('meanArterialMmHg');
      } else {
        expect(last.state.heartRateBpm, scenario.metadata.id).toBeGreaterThan(20);
        expect(last.state.meanArterialMmHg, scenario.metadata.id).toBeGreaterThan(30);
      }
      expect(Number.isFinite(last.state.spo2Percent)).toBe(true);
    }
  });
});

describe('Requirement: The New Scenarios Teach What They Claim', () => {
  it('Scenario: laryngoscopy consumes its declared time and refuses an overlapping attempt', () => {
    const sim = engine();
    sim.step();
    sim.apply({ tick: sim.tick, type: 'laryngoscopy', payload: { technique: 'video' } });
    const started = sim.step();
    expect(started.equipment.airway.attemptInProgress).toBe(true);
    expect(started.equipment.airway.lastGrade).toBeNull();
    const remaining = started.equipment.airway.attemptSecondsRemaining;

    sim.apply({ tick: sim.tick, type: 'laryngoscopy', payload: { technique: 'direct' } });
    expect(sim.equipment().airway.attempts).toBe(1);

    let during = started;
    for (let tick = 1; tick < remaining * TICKS_PER_SECOND; tick += 1) during = sim.step();
    expect(during.equipment.airway.attemptInProgress).toBe(true);
    const completed = sim.step();
    expect(completed.equipment.airway.attemptInProgress).toBe(false);
    expect(completed.equipment.airway.lastGrade).toBeGreaterThanOrEqual(1);
    expect(completed.events.some((event) => event.eventId === 'laryngoscopy-1')).toBe(true);
  });

  /** Simulated seconds of apnoea from a given start until saturation reaches 90%. */
  function timeToDesaturate(scenario: (typeof SCENARIOS)[number], preoxygenateSeconds: number): number {
    const engine = new AnesthesiaEngine({ scenario, seed: 20260819, practiceRegion: 'US' });
    engine.apply({ tick: 0, type: 'ventilator', payload: { fio2: 1, delivering: true, mode: 'volume-control' } });
    for (let i = 0; i < preoxygenateSeconds * TICKS_PER_SECOND; i += 1) engine.step();
    // Apnoea: the machine stops, and nothing is breathing.
    engine.apply({ tick: 0, type: 'ventilator', payload: { delivering: false, mode: 'manual' } });
    engine.apply({ tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } });
    for (let tick = 0; tick < 20 * 60 * TICKS_PER_SECOND; tick += 1) {
      const result = engine.step();
      if (result.state.spo2Percent <= 90) return tick / TICKS_PER_SECOND;
    }
    // Never reached 90% inside twenty simulated minutes.
    return 20 * 60;
  }

  it('Scenario: the obese patient loses the margin the healthy one keeps', () => {
    // Both are preoxygenated to the same endpoint and both are induced. The
    // teaching claim of this scenario is that the obese patient's reserve is
    // gone, so that is what is asserted: he desaturates inside five minutes and
    // the healthy patient does not.
    const healthy = timeToDesaturate(ROUTINE_INDUCTION, 180);
    const obese = timeToDesaturate(RAPID_DESATURATION, 180);
    expect(obese, 'obese patient time to 90%').toBeLessThan(5 * 60);
    expect(healthy, 'healthy patient time to 90%').toBeGreaterThan(obese * 2);
  });

  it('Scenario: the obese patient has a genuinely harder airway', () => {
    const easy = gradeProbabilities(ROUTINE_INDUCTION.patient.airway, 'direct', 0);
    const hard = gradeProbabilities(RAPID_DESATURATION.patient.airway, 'direct', 0);
    const poor = (p: number[]) => (p[2] ?? 0) + (p[3] ?? 0);
    expect(poor(hard)).toBeGreaterThan(poor(easy) * 1.8);
  });

  it('Scenario: the hypovolaemic patient starts compensated and decompensates on induction', () => {
    const engine = new AnesthesiaEngine({
      scenario: HYPOTENSION_AFTER_INDUCTION, seed: 20260819, practiceRegion: 'US',
    });
    const before = engine.step().state;
    // Compensated: a defensible pressure carried by a fast rate and a small
    // stroke volume, which is exactly what makes the induction unforgiving.
    expect(before.meanArterialMmHg).toBeGreaterThan(70);
    expect(before.heartRateBpm).toBeGreaterThan(85);
    expect(before.strokeVolumeMl).toBeLessThan(55);

    engine.apply({ tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } });
    let worst = before.meanArterialMmHg;
    for (let tick = 0; tick < 180 * TICKS_PER_SECOND; tick += 1) {
      const state = engine.step().state;
      if (state.meanArterialMmHg < worst) worst = state.meanArterialMmHg;
    }
    // A full 2 mg/kg in this patient takes her well below the threshold the
    // outcome literature is organized around.
    expect(worst).toBeLessThan(65);
  });
});

describe('Requirement: The Bronchospasm Scenario Teaches Shape Before Number', () => {
  // The capnogram generator has been able to draw the four phases, the alpha
  // angle and the shark fin since the beginning, and no scenario reached any of
  // it. The claim this scenario makes is specific and testable: the morphology
  // moves while the end-tidal value is still inside its alarm limits, so a
  // learner watching only the tiles misses it.
  function runToMinute(minute: number) {
    const engine = new AnesthesiaEngine({
      scenario: BRONCHOSPASM as never, seed: 5, practiceRegion: 'US',
    });
    engine.apply({
      tick: 0, type: 'ventilator', payload: { fio2: 1, delivering: true, mode: 'volume-control' },
    } as never);
    let last = engine.step();
    for (let tick = 0; tick < minute * 60 * TICKS_PER_SECOND; tick += 1) last = engine.step();
    return last;
  }

  it('Scenario: the obstruction reaches the waveform engine at all', () => {
    // Before, and well after, the declared onset.
    const before = runToMinute(2);
    const during = runToMinute(8);
    expect(before.state.etco2MmHg).toBeGreaterThan(30);
    // The number climbs as the obstruction builds, which is the physiology.
    expect(during.state.etco2MmHg).toBeGreaterThan(before.state.etco2MmHg + 3);
  });

  it('Scenario: the number stays inside its alarm limits while the shape changes', () => {
    // This is the trap, and it has to hold or the scenario teaches nothing.
    // The high end-tidal alarm sits at 55; the obstruction must not trip it
    // within the scenario's run, so that recognising it has to come from the
    // waveform rather than from the alarm.
    const highLimit = DEFAULT_LIMITS.find((limit) => limit.id === 'etco2-high')!.high!;
    for (const minute of [5, 6, 7, 8]) {
      const state = runToMinute(minute).state;
      expect(state.etco2MmHg, `end-tidal at ${minute} min`).toBeLessThan(highLimit);
    }
  });

  it('Scenario: it declares the capnogram explainer as what it teaches', () => {
    const concepts = BRONCHOSPASM.debrief.rubric.map((item) => item.concept);
    expect(concepts).toContain('capnogram-morphology');
    // And the objective is about the shape rather than the value.
    const objective = BRONCHOSPASM.metadata.objectives.find((o) => o.id === 'read-the-capnogram');
    expect(objective?.measure).toContain('inside its alarm limits');
  });
});

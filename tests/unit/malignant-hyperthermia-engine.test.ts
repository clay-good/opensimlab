import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, DANTROLENE_DOSE_MG_PER_KG, type Scenario } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { replay } from '@anesthesia/debrief/replay';
import type { LearnerAction } from '@platform/kernel/protocol';

const mhScenario = (armed = true): Scenario => ({
  ...ROUTINE_INDUCTION,
  timeline: armed ? [{
    id: 'latent-mh', type: 'malignant-hyperthermia', target: 'volatile-trigger', value: 1, atTick: 0,
  }] : [],
});

function makeEngine(armed = true) {
  const engine = new AnesthesiaEngine({ scenario: mhScenario(armed), seed: 73, practiceRegion: 'US' });
  engine.apply({
    tick: 0, type: 'ventilator', payload: {
      delivering: true, mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12,
      fio2: 0.5, freshGasFlowLPerMin: 1, sevofluranePercent: 4,
    },
  });
  return engine;
}

function advance(engine: AnesthesiaEngine, seconds: number) {
  let result = engine.step();
  for (let tick = 1; tick < seconds * 10; tick += 1) result = engine.step();
  return result;
}

describe('malignant hyperthermia engine foundation', () => {
  it('requires both latent susceptibility and genuine volatile exposure', () => {
    const susceptibleWithoutExposure = makeEngine();
    susceptibleWithoutExposure.apply({
      tick: 0, type: 'ventilator', payload: { sevofluranePercent: 0 },
    });
    const noExposure = advance(susceptibleWithoutExposure, 600);

    const exposedWithoutSusceptibility = advance(makeEngine(false), 600);

    expect(noExposure.state.etco2MmHg).toBeLessThan(45);
    expect(noExposure.state.coreTemperatureC).toBeCloseTo(36.6, 5);
    expect(noExposure.state.muscleRigidityFraction).toBe(0);
    expect(exposedWithoutSusceptibility.state.etco2MmHg).toBeLessThan(45);
    expect(exposedWithoutSusceptibility.state.muscleRigidityFraction).toBe(0);
  });

  it('derives early carbon dioxide, then tachycardia and rigidity, with temperature later', () => {
    const engine = makeEngine();
    let co2Tick = Number.POSITIVE_INFINITY;
    let heartRateTick = Number.POSITIVE_INFINITY;
    let rigidityTick = Number.POSITIVE_INFINITY;
    let temperatureTick = Number.POSITIVE_INFINITY;
    const attributed = new Set<string>();
    let result = engine.step();
    for (let tick = 1; tick < 10 * 60 * 10; tick += 1) {
      result = engine.step();
      for (const entry of result.attribution) {
        for (const term of entry.terms) {
          expect(Number.isFinite(term.contribution)).toBe(true);
          expect(term.contribution).not.toBe(0);
          attributed.add(`${entry.variable}:${term.termId}`);
        }
      }
      if (result.state.etco2MmHg > 45 && !Number.isFinite(co2Tick)) co2Tick = tick;
      if (result.state.heartRateBpm > 100 && !Number.isFinite(heartRateTick)) heartRateTick = tick;
      if (result.state.muscleRigidityFraction > 0.25 && !Number.isFinite(rigidityTick)) rigidityTick = tick;
      if (result.state.coreTemperatureC > 37.3 && !Number.isFinite(temperatureTick)) temperatureTick = tick;
    }

    const ordering = JSON.stringify({ co2Tick, heartRateTick, rigidityTick, temperatureTick });
    expect(co2Tick, ordering).toBeLessThan(heartRateTick);
    expect(heartRateTick, ordering).toBeLessThan(rigidityTick);
    expect(rigidityTick, ordering).toBeLessThan(temperatureTick);
    expect(result.state.etco2MmHg).toBeGreaterThan(55);
    expect(result.state.coreTemperatureC).toBeGreaterThan(37.3);
    expect(attributed).toContain('heartRateBpm:hypermetabolic-tachycardia');
    expect(attributed).toContain('muscleRigidityFraction:hypermetabolic-rigidity');
    expect(attributed).toContain('coreTemperatureC:hypermetabolic-heat');
    expect([...attributed].some((term) => term.startsWith('etco2MmHg:') && term.includes('hyper')))
      .toBe(false);
  });

  it('makes high flow change real volatile wash-in and washout', () => {
    const slow = makeEngine(false);
    const fast = makeEngine(false);
    fast.apply({ tick: 0, type: 'ventilator', payload: { freshGasFlowLPerMin: 8 } });
    const slowIn = advance(slow, 60);
    const fastIn = advance(fast, 60);
    expect(fastIn.state.endTidalSevofluranePercent)
      .toBeGreaterThan(slowIn.state.endTidalSevofluranePercent + 1);

    slow.apply({ tick: 600, type: 'ventilator', payload: { sevofluranePercent: 0 } });
    fast.apply({ tick: 600, type: 'ventilator', payload: { sevofluranePercent: 0 } });
    const slowOut = advance(slow, 60);
    const fastOut = advance(fast, 60);
    expect(fastOut.state.endTidalSevofluranePercent)
      .toBeLessThan(slowOut.state.endTidalSevofluranePercent - 0.5);
  });

  it('records exact repeated IV dantrolene and does not model prophylaxis', () => {
    const engine = makeEngine();
    engine.apply({
      tick: 0, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: DANTROLENE_DOSE_MG_PER_KG },
    });
    let result = advance(engine, 1);
    expect(result.equipment.resuscitation.dantroleneTotalMg)
      .toBe(ROUTINE_INDUCTION.patient.weightKg * DANTROLENE_DOSE_MG_PER_KG);
    expect(result.equipment.resuscitation.dantroleneEffectFraction).toBe(0);

    result = advance(engine, 180);
    const before = result.state;
    engine.apply({
      tick: 1800, type: 'ventilator', payload: { sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
    });
    engine.apply({
      tick: 1800, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 },
    });
    engine.apply({
      tick: 1800, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 },
    });
    result = advance(engine, 180);
    expect(result.equipment.resuscitation.dantroleneTotalMg)
      .toBe(ROUTINE_INDUCTION.patient.weightKg * DANTROLENE_DOSE_MG_PER_KG * 3);
    expect(result.equipment.resuscitation.lastDantroleneTick).not.toBeNull();
    expect(result.state.muscleRigidityFraction).toBeLessThan(before.muscleRigidityFraction);
    expect(result.state.heartRateBpm).toBeLessThan(before.heartRateBpm);
  });

  it('requires trigger control, high-flow oxygen, hyperventilation, and dantrolene for complete response', () => {
    const run = (treatment: 'support-only' | 'dantrolene-only' | 'complete') => {
      const engine = makeEngine();
      const crisis = advance(engine, 180);
      if (treatment !== 'dantrolene-only') engine.apply({
        tick: 1800, type: 'ventilator', payload: {
          sevofluranePercent: 0, freshGasFlowLPerMin: 10, fio2: 1,
          tidalVolumeMl: 700, respiratoryRateBpm: 24, delivering: true,
        },
      });
      if (treatment !== 'support-only') {
        for (let dose = 0; dose < 2; dose += 1) engine.apply({
          tick: 1800, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 },
        });
      }
      return { crisis, result: advance(engine, 180) };
    };
    const supportOnly = run('support-only');
    const dantroleneOnly = run('dantrolene-only');
    const complete = run('complete');

    expect(supportOnly.result.state.heartRateBpm).toBeGreaterThan(100);
    expect(supportOnly.result.state.muscleRigidityFraction)
      .toBeGreaterThan(supportOnly.crisis.state.muscleRigidityFraction);
    expect(dantroleneOnly.result.state.etco2MmHg).toBeGreaterThan(55);
    expect(complete.result.state.etco2MmHg).toBeLessThan(dantroleneOnly.result.state.etco2MmHg);
    expect(complete.result.state.heartRateBpm).toBeLessThan(supportOnly.result.state.heartRateBpm);
    expect(complete.result.state.muscleRigidityFraction)
      .toBeLessThan(supportOnly.result.state.muscleRigidityFraction);
  });

  it('starts cooling only above 39 C and stops it below 38 C', () => {
    const atThreshold = new AnesthesiaEngine({
      scenario: {
        ...mhScenario(false), patient: {
          ...mhScenario(false).patient,
          baseline: { ...mhScenario(false).patient.baseline, coreTemperatureC: 39 },
        },
      },
      seed: 1, practiceRegion: 'US',
    });
    let result = atThreshold.step();
    atThreshold.apply({ tick: 1, type: 'active-cooling', payload: { active: true } });
    result = atThreshold.step();
    expect(result.equipment.resuscitation.activeCooling).toBe(false);

    const aboveThreshold = new AnesthesiaEngine({
      scenario: {
        ...mhScenario(false), patient: {
          ...mhScenario(false).patient,
          baseline: { ...mhScenario(false).patient.baseline, coreTemperatureC: 39.1 },
        },
      },
      seed: 1, practiceRegion: 'US',
    });
    result = aboveThreshold.step();
    expect(result.alarms.some((alarm) => alarm.id === 'temperature-high')).toBe(true);
    aboveThreshold.apply({ tick: 1, type: 'active-cooling', payload: { active: true } });
    result = advance(aboveThreshold, 70);
    expect(result.state.coreTemperatureC).toBeLessThan(38);
    expect(result.state.coreTemperatureC).toBeGreaterThan(37.9);
    expect(result.equipment.resuscitation.activeCooling).toBe(false);
  });

  it('replays volatile triggering and treatment deterministically', () => {
    const actions: LearnerAction[] = [
      { tick: 0, type: 'ventilator', payload: {
        delivering: true, tidalVolumeMl: 500, respiratoryRateBpm: 12,
        fio2: 0.5, freshGasFlowLPerMin: 1, sevofluranePercent: 4,
      } },
      { tick: 1800, type: 'ventilator', payload: {
        sevofluranePercent: 0, freshGasFlowLPerMin: 10, fio2: 1,
        tidalVolumeMl: 700, respiratoryRateBpm: 24,
      } },
      { tick: 1800, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 } },
      { tick: 1801, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 } },
    ];
    const options = {
      scenario: mhScenario(), seed: 73, practiceRegion: 'US', ticks: 3600,
    };
    expect(replay(actions, options)).toEqual(replay(actions, options));
  });

  it('refuses malformed treatment and event values without poisoning state', () => {
    const scenario = {
      ...mhScenario(),
      timeline: [{
        id: 'hostile-mh', type: 'malignant-hyperthermia' as const,
        target: 'volatile-trigger', value: Number.NaN, atTick: 0,
      }],
    };
    const engine = new AnesthesiaEngine({ scenario, seed: 2, practiceRegion: 'US' });
    for (const action of [
      { tick: 0, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: Number.NaN } },
      { tick: 0, type: 'dantrolene', payload: { route: 'im', doseMgPerKg: 2.5 } },
      { tick: 0, type: 'active-cooling', payload: { active: 'yes' } },
      { tick: 0, type: 'ventilator', payload: { freshGasFlowLPerMin: Number.POSITIVE_INFINITY } },
    ] as unknown as LearnerAction[]) engine.apply(action);
    const result = advance(engine, 30);
    expect(result.equipment.resuscitation.dantroleneTotalMg).toBe(0);
    expect(result.equipment.resuscitation.activeCooling).toBe(false);
    expect(Object.values(result.state).every(Number.isFinite)).toBe(true);
  });

  it('keeps a prolonged untreated crisis finite and bounded', () => {
    const engine = makeEngine();
    const result = advance(engine, 30 * 60);
    expect(Object.values(result.state).every(Number.isFinite)).toBe(true);
    expect(result.state.coreTemperatureC).toBeLessThanOrEqual(43);
    expect(result.state.etco2MmHg).toBeLessThanOrEqual(120);
    expect(result.state.muscleRigidityFraction).toBeGreaterThanOrEqual(0);
    expect(result.state.muscleRigidityFraction).toBeLessThanOrEqual(1);
  });
});

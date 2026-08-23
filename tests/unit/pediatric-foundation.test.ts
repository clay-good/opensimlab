import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, type Scenario } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import {
  PAEDFUSOR_RATE_CONSTANTS, PROPOFOL_PAEDFUSOR_2005,
} from '@anesthesia/pharmacology/models/propofol-paedfusor-2005';
import { parametersFor, selectDefaultModel } from '@anesthesia/pharmacology/registry';
import { CompartmentSolver } from '@platform/kernel/compartments';
import {
  CO2_STORE_ML_PER_MMHG, RESPIRATORY_PROFILES, healthyChildRespiratoryProfile,
  initialGasState, stepGas,
} from '@anesthesia/physiology';
import { replay } from '@anesthesia/debrief/replay';
import type { LearnerAction } from '@platform/kernel/protocol';

const CHILD = { ageYears: 6, weightKg: 20, heightCm: 115, sex: 'female' as const };

const CHILD_SCENARIO: Scenario = {
  ...ROUTINE_INDUCTION,
  patient: {
    ...ROUTINE_INDUCTION.patient,
    ...CHILD,
    baseline: {
      ...ROUTINE_INDUCTION.patient.baseline,
      heartRateBpm: 90,
      meanArterialMmHg: 75,
      strokeVolumeMl: 35,
      bloodVolumeMl: 1_600,
      hemoglobinGPerDl: 12.5,
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    ...ROUTINE_INDUCTION.equipment,
    ventilator: {
      ...ROUTINE_INDUCTION.equipment.ventilator,
      tidalVolumeMl: 160,
      respiratoryRateBpm: 20,
    },
  },
};

describe('Requirement: published pediatric propofol PK', () => {
  it('transcribes the Paedfusor age 1–12 microconstants without changing their kinetics', () => {
    const p = parametersFor(PROPOFOL_PAEDFUSOR_2005, CHILD);
    expect(p.v1).toBeCloseTo(9.168, 12);
    expect(p.peripheralVolumes[0]).toBeCloseTo(19.002763636363635, 12);
    expect(p.peripheralVolumes[1]).toBeCloseTo(116.40581818181818, 12);
    expect(p.cl / p.v1).toBeCloseTo(
      PAEDFUSOR_RATE_CONSTANTS.k10Coefficient * 20 ** -0.3, 12,
    );
    expect(p.intercompartmentalClearances[0]! / p.v1)
      .toBeCloseTo(PAEDFUSOR_RATE_CONSTANTS.k12, 12);
    expect(p.intercompartmentalClearances[0]! / p.peripheralVolumes[0]!)
      .toBeCloseTo(PAEDFUSOR_RATE_CONSTANTS.k21, 12);
    expect(p.intercompartmentalClearances[1]! / p.v1)
      .toBeCloseTo(PAEDFUSOR_RATE_CONSTANTS.k13, 12);
    expect(p.intercompartmentalClearances[1]! / p.peripheralVolumes[1]!)
      .toBeCloseTo(PAEDFUSOR_RATE_CONSTANTS.k31, 12);
    expect(p.ke0).toBe(PAEDFUSOR_RATE_CONSTANTS.ke0);
    expect(PROPOFOL_PAEDFUSOR_2005.pd).toBeNull();
  });

  it('selects Paedfusor only inside its full pediatric age-and-weight envelope', () => {
    expect(selectDefaultModel('propofol', CHILD).model.id).toBe('propofol-paedfusor-2005');
    for (const ageYears of [0.9, 12.1, 35]) {
      expect(selectDefaultModel('propofol', { ...CHILD, ageYears }).model.id)
        .toBe('propofol-eleveld-2018');
    }
    for (const weightKg of [4.9, 61.1]) {
      const selection = selectDefaultModel('propofol', { ...CHILD, weightKg });
      expect(selection.model.id).toBe('propofol-eleveld-2018');
      expect(selection.reason).toContain('pediatric patient');
      expect(selection.reason).toContain('outside 5–61 kg');
      expect(selection.reason).not.toContain('for an adult');
    }
  });

  it('has a transparent deterministic solver trajectory, not an invented clinical target', () => {
    const solver = new CompartmentSolver(parametersFor(PROPOFOL_PAEDFUSOR_2005, CHILD));
    solver.bolus(50);
    solver.step(0);
    expect(solver.plasma).toBeCloseTo(5.451770490073555, 12);
    for (let tick = 1; tick < 600; tick += 1) solver.step(0);
    expect(solver.plasma).toBeCloseTo(4.40008633627058, 12);
    expect(solver.effectSite).toBeCloseTo(1.1178386018060016, 12);
  });
});

describe('Requirement: bounded healthy-child respiratory physiology', () => {
  it('derives the 6-year-old, 20 kg profile from its pediatric source equations', () => {
    const profile = healthyChildRespiratoryProfile(6, 20);
    expect(profile.frcLitres).toBeCloseTo(9.51 * 20 ** 1.31 / 1000, 12);
    expect(profile.vo2LitresPerMin).toBeCloseTo(0.1198, 12);
    expect(profile.vco2LitresPerMin).toBeCloseTo(0.1024, 12);
    expect(profile.deadSpaceMl).toBeCloseTo(20 * (3.28 - 0.56 * Math.log(7)), 12);
    expect(profile.co2StoreMlPerMmHg).toBeCloseTo(CO2_STORE_ML_PER_MMHG * 20 / 70, 12);
    expect(profile.spontaneousTidalVolumeMl).toBe(120);
    expect(profile.spontaneousRespiratoryRateBpm).toBe(29);
  });

  it('does not alter any adult respiratory constant', () => {
    expect(RESPIRATORY_PROFILES.healthy).toEqual({
      frcLitres: 2.5, vo2LitresPerMin: 0.25, vco2LitresPerMin: 0.2, deadSpaceMl: 150,
      co2StoreMlPerMmHg: 66,
      spontaneousTidalVolumeMl: 500, spontaneousRespiratoryRateBpm: 14, aaGradientMmHg: 10,
    });
  });

  it('keeps controlled pediatric ventilation near baseline and accumulates CO2 faster in apnea', () => {
    const child = healthyChildRespiratoryProfile(6, 20);
    const childGas = initialGasState(child, 1);
    let ventilated = stepGas(childGas, {
      tidalVolumeMl: 160, respiratoryRateBpm: 20, fio2: 1, cardiacOutputRatio: 1,
      obstructionFraction: 0, hemoglobinGPerDl: 12.5, bloodVolumeMl: 1_600,
    }, child, 1 / 600);
    for (let tick = 1; tick < 10 * 60 * 10; tick += 1) {
      // stepGas intentionally advances the supplied store in place; reusing this
      // object is the ten-minute trajectory, not a series of one-tick resets.
      ventilated = stepGas(childGas, {
        tidalVolumeMl: 160, respiratoryRateBpm: 20, fio2: 1, cardiacOutputRatio: 1,
        obstructionFraction: 0, hemoglobinGPerDl: 12.5, bloodVolumeMl: 1_600,
      }, child, 1 / 600);
    }
    expect(childGas.paco2MmHg).toBe(ventilated.paco2MmHg);
    expect(ventilated.paco2MmHg).toBeGreaterThan(35);
    expect(ventilated.paco2MmHg).toBeLessThan(45);

    const childApnea = initialGasState(child, 1);
    const adultApnea = initialGasState(RESPIRATORY_PROFILES.healthy, 1);
    let childResult = ventilated;
    let adultResult = ventilated;
    for (let tick = 0; tick < 60 * 10; tick += 1) {
      childResult = stepGas(childApnea, {
        tidalVolumeMl: 0, respiratoryRateBpm: 0, fio2: 1, cardiacOutputRatio: 1,
        obstructionFraction: 0, hemoglobinGPerDl: 12.5, bloodVolumeMl: 1_600,
      }, child, 1 / 600);
      adultResult = stepGas(adultApnea, {
        tidalVolumeMl: 0, respiratoryRateBpm: 0, fio2: 1, cardiacOutputRatio: 1,
        obstructionFraction: 0, hemoglobinGPerDl: 14, bloodVolumeMl: 5_000,
      }, RESPIRATORY_PROFILES.healthy, 1 / 600);
    }
    expect(childApnea.paco2MmHg).toBe(childResult.paco2MmHg);
    expect(adultApnea.paco2MmHg).toBe(adultResult.paco2MmHg);
    expect(childResult.paco2MmHg - 40).toBeGreaterThan(adultResult.paco2MmHg - 40);
    expect(childResult.spo2Percent).toBeLessThan(adultResult.spo2Percent);
  });

  it('bounds hostile direct profile inputs to finite physiology', () => {
    const hostileInputs: [number, number][] = [
      [Number.NaN, Number.POSITIVE_INFINITY], [-9, -20], [999, 999],
    ];
    for (const [age, weight] of hostileInputs) {
      const profile = healthyChildRespiratoryProfile(age, weight);
      expect(Object.values(profile).every(Number.isFinite)).toBe(true);
      expect(profile.frcLitres).toBeGreaterThan(0);
      expect(profile.co2StoreMlPerMmHg).toBeGreaterThan(0);
    }
  });
});

describe('Requirement: pediatric engine integration', () => {
  it('refuses invented and non-positive bolus units before they reach the solver', () => {
    const engine = new AnesthesiaEngine({
      scenario: CHILD_SCENARIO, practiceRegion: 'US', seed: 79,
    });
    engine.apply({
      tick: 0, type: 'bolus',
      payload: { drugId: 'propofol', amount: 3.5, unit: 'banana' },
    });
    engine.apply({
      tick: 0, type: 'bolus',
      payload: { drugId: 'propofol', amount: 0, unit: 'mg/kg' },
    });

    const frame = engine.step();
    const propofol = frame.concentrations.find((entry) => entry.drugId === 'propofol');
    expect(propofol?.plasma).toBe(0);
    expect(frame.events.map((event) => event.eventId)).toEqual(expect.arrayContaining([
      'bad-dose-unit-propofol-0', 'non-positive-dose-propofol-0',
    ]));
  });

  it('selects Paedfusor and uses child spontaneous ventilation in the actual engine', () => {
    const engine = new AnesthesiaEngine({ scenario: CHILD_SCENARIO, practiceRegion: 'US', seed: 71 });
    const tick = engine.step();
    const propofol = tick.concentrations.find((entry) => entry.drugId === 'propofol');
    expect(propofol?.modelId).toBe('propofol-paedfusor-2005');
    expect(tick.state.tidalVolumeMl).toBe(120);
    expect(tick.state.respiratoryRateBpm).toBe(29);
    expect(tick.events.find((event) => event.eventId === 'model-propofol')?.message)
      .toContain('1–12 year');
  });

  it('runs a finite pediatric induction trajectory through the engine', () => {
    const engine = new AnesthesiaEngine({ scenario: CHILD_SCENARIO, practiceRegion: 'US', seed: 73 });
    engine.apply({
      tick: 0, type: 'bolus',
      payload: { drugId: 'propofol', amount: 3.5, unit: 'mg/kg' },
    });
    let peakCe = 0;
    let minimumDepth = 100;
    let minimumRate = Number.POSITIVE_INFINITY;
    for (let tick = 0; tick < 5 * 60 * 10; tick += 1) {
      const result = engine.step();
      const ce = result.concentrations.find((entry) => entry.drugId === 'propofol')?.effectSite ?? 0;
      peakCe = Math.max(peakCe, ce);
      minimumDepth = Math.min(minimumDepth, result.state.depthIndex);
      minimumRate = Math.min(minimumRate, result.state.respiratoryRateBpm);
      expect(Object.values(result.state).every(Number.isFinite)).toBe(true);
    }
    expect(peakCe).toBeCloseTo(3.1364749093479136, 12);
    expect(minimumDepth).toBeCloseTo(45.851498947474184, 12);
    expect(minimumRate).toBe(6);
  });

  it('replays the child model and physiology deterministically', () => {
    const actions: LearnerAction[] = [
      { tick: 10, type: 'bolus', payload: { drugId: 'propofol', amount: 50, unit: 'mg' } },
      { tick: 80, type: 'ventilator', payload: { delivering: true, mode: 'volume-control', tidalVolumeMl: 160, respiratoryRateBpm: 20, fio2: 1 } },
    ];
    const options = { scenario: CHILD_SCENARIO, practiceRegion: 'US' as const, seed: 72, ticks: 500 };
    expect(replay(actions, options)).toEqual(replay(actions, options));
  });
});

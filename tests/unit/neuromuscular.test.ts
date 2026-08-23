import { describe, expect, it } from 'vitest';
import { CompartmentSolver, STEP_MINUTES } from '@platform/kernel/compartments';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import {
  RESPIRATORY_PROFILES, VirtualPatient, neuromuscularState, type PatientProfile,
  type ScenarioDrive, type VentilatorSettings,
} from '@anesthesia/physiology';
import { evaluateEnvelope } from '@anesthesia/pharmacology/envelope';
import { parametersFor } from '@anesthesia/pharmacology/registry';
import { ROCURONIUM_CLINICAL_COURSE_TEACHING } from '@anesthesia/pharmacology/models/rocuronium-clinical-course-teaching';
import { createRng } from '@platform/kernel/rng';

const ADULT = { ageYears: 35, weightKg: 70, heightCm: 170, sex: 'male' as const };

function rocuroniumCourse(doseMgPerKg: number, minutes: number) {
  const solver = new CompartmentSolver(
    parametersFor(ROCURONIUM_CLINICAL_COURSE_TEACHING, ADULT), STEP_MINUTES,
  );
  solver.bolus(doseMgPerKg * ADULT.weightKg);
  const trace: { minute: number; ratio: number; count: number }[] = [];
  const ticks = Math.round(minutes / STEP_MINUTES);
  for (let tick = 1; tick <= ticks; tick += 1) {
    solver.step(0);
    if (tick % 600 === 0) {
      const state = neuromuscularState(solver.effectSite);
      trace.push({ minute: tick / 600, ratio: state.trainOfFourRatio, count: state.trainOfFourCount });
    }
  }
  return trace;
}

describe('rocuronium clinical-course teaching model', () => {
  it('is visibly a teaching model with a resolvable clinical source', () => {
    expect(ROCURONIUM_CLINICAL_COURSE_TEACHING.isTeachingModel).toBe(true);
    expect(ROCURONIUM_CLINICAL_COURSE_TEACHING.citation.pmid).toBe('8460753');
    expect(evaluateEnvelope(ROCURONIUM_CLINICAL_COURSE_TEACHING, ADULT).label).toBe('teaching');
  });

  it('produces profound block promptly and spontaneous recovery after 0.6 mg/kg', () => {
    const trace = rocuroniumCourse(0.6, 90);
    expect(trace[0]?.count).toBe(0);
    expect(trace[0]?.ratio).toBe(0);

    const fourTwitches = trace.find((point) => point.count === 4);
    expect(fourTwitches?.minute).toBeGreaterThanOrEqual(20);
    expect(fourTwitches?.minute).toBeLessThanOrEqual(45);
    const recovered = trace.find((point) => point.ratio >= 0.9);
    expect(recovered?.minute).toBeGreaterThan(fourTwitches?.minute ?? 0);
    expect(recovered?.minute).toBeLessThanOrEqual(90);
  });

  it('makes a larger dose last longer', () => {
    const firstFour = (dose: number) => rocuroniumCourse(dose, 120)
      .find((point) => point.count === 4)?.minute ?? Infinity;
    expect(firstFour(1.2)).toBeGreaterThan(firstFour(0.6));
  });

  it('keeps ratio, count, and respiratory muscle function bounded', () => {
    for (const ce of [Number.NaN, -1, 0, 0.5, 2, 10, 1e6, Number.POSITIVE_INFINITY]) {
      const state = neuromuscularState(ce);
      expect(state.trainOfFourRatio).toBeGreaterThanOrEqual(0);
      expect(state.trainOfFourRatio).toBeLessThanOrEqual(1);
      expect(state.trainOfFourCount).toBeGreaterThanOrEqual(0);
      expect(state.trainOfFourCount).toBeLessThanOrEqual(4);
      expect(Number.isInteger(state.trainOfFourCount)).toBe(true);
      expect(state.respiratoryMuscleFraction).toBeGreaterThanOrEqual(0);
      expect(state.respiratoryMuscleFraction).toBeLessThanOrEqual(1);
    }
  });
});

const PROFILE: PatientProfile = {
  hemodynamics: {
    baselineHeartRateBpm: 72, baselineMapMmHg: 90, baselineStrokeVolumeMl: 70,
    arterialStiffness: 1, fixedStrokeVolume: false, baroreflexGain: 1,
    bloodVolumeMl: 5000, hemoglobinGPerDl: 14,
  },
  respiratory: RESPIRATORY_PROFILES.healthy,
  airway: { difficulty: 0, difficultMaskVentilation: false },
  coreTemperatureC: 36.6,
  ageYears: 35,
};
const QUIET: ScenarioDrive = {
  surgicalStimulus: 0, obstructionFraction: 0, bloodLossMl: 0, crystalloidMl: 0,
};
const SPONTANEOUS: VentilatorSettings = {
  mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 12, fio2: 0.21,
  freshGasFlowLPerMin: 1, peep: 0, delivering: false, sevofluranePercent: 0,
};
const VENTILATED: VentilatorSettings = {
  ...SPONTANEOUS, mode: 'volume-control', delivering: true, fio2: 0.5,
};

describe('neuromuscular physiology boundaries', () => {
  const drugs = (rocuroniumCe: number) => ({
    propofolCe: 0, remifentanilCe: 0, rocuroniumCe, vasopressorEffect: 0,
  });

  it('abolishes spontaneous breathing at profound block', () => {
    const patient = new VirtualPatient(PROFILE, createRng(1));
    const state = patient.tick(drugs(10), SPONTANEOUS, QUIET).state;
    expect(state.trainOfFourCount).toBe(0);
    expect(state.respiratoryRateBpm).toBe(0);
    expect(state.tidalVolumeMl).toBe(0);
  });

  it('does not impede machine-delivered ventilation', () => {
    const unblocked = new VirtualPatient(PROFILE, createRng(2)).tick(drugs(0), VENTILATED, QUIET).state;
    const blocked = new VirtualPatient(PROFILE, createRng(2)).tick(drugs(10), VENTILATED, QUIET).state;
    expect(blocked.respiratoryRateBpm).toBe(unblocked.respiratoryRateBpm);
    expect(blocked.tidalVolumeMl).toBe(unblocked.tidalVolumeMl);
    expect(blocked.etco2MmHg).toBe(unblocked.etco2MmHg);
  });

  it('provides no hypnosis or haemodynamic effect', () => {
    const unblocked = new VirtualPatient(PROFILE, createRng(3)).tick(drugs(0), VENTILATED, QUIET).state;
    const blocked = new VirtualPatient(PROFILE, createRng(3)).tick(drugs(10), VENTILATED, QUIET).state;
    expect(blocked.depthIndex).toBe(unblocked.depthIndex);
    expect(blocked.heartRateBpm).toBe(unblocked.heartRateBpm);
    expect(blocked.meanArterialMmHg).toBe(unblocked.meanArterialMmHg);
  });
});

describe('engine rocuronium plumbing', () => {
  it('delivers effect-site concentration, TOF state, and teaching attribution', () => {
    const scenario = {
      ...ROUTINE_INDUCTION,
      formulary: [...ROUTINE_INDUCTION.formulary, {
        drugId: 'rocuronium', concentration: 10, concentrationUnit: 'mg/mL',
        syringeVolumeMl: 10, typicalDose: 42,
        presets: [{ label: '0.6 mg/kg', amount: 0.6, unit: 'mg/kg' }],
      }],
    };
    const engine = new AnesthesiaEngine({ scenario: scenario as never, seed: 4, practiceRegion: 'US' });
    engine.apply({ tick: 0, type: 'bolus', payload: { drugId: 'rocuronium', amount: 0.6, unit: 'mg/kg' } });
    let result = engine.step();
    for (let tick = 1; tick < 600; tick += 1) result = engine.step();

    const concentration = result.concentrations.find((entry) => entry.drugId === 'rocuronium');
    expect(concentration?.modelId).toBe('rocuronium-clinical-course-teaching');
    expect(concentration?.confidence).toBe('teaching');
    expect(concentration?.effectSite).toBeGreaterThan(0);
    expect(result.state.trainOfFourCount).toBe(0);
    expect(result.state.trainOfFourRatio).toBe(0);
    expect(result.attribution.find((entry) => entry.variable === 'trainOfFourRatio')?.terms[0]?.teachingModel)
      .toBe(true);
  });

  it('refuses a rocuronium infusion when the scenario stocks it for bolus use only', () => {
    const scenario = {
      ...ROUTINE_INDUCTION,
      formulary: [...ROUTINE_INDUCTION.formulary, {
        drugId: 'rocuronium', concentration: 10, concentrationUnit: 'mg/mL',
        deliveryModes: ['bolus'], syringeVolumeMl: 10, typicalDose: 42,
        presets: [{ label: '0.6 mg/kg', amount: 0.6, unit: 'mg/kg' }],
      }],
    };
    const engine = new AnesthesiaEngine({ scenario: scenario as never, seed: 5, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: engine.tick, type: 'infusion', payload: {
      drugId: 'rocuronium', rate: 1, unit: 'mg/kg/min',
    } });
    const result = engine.step();
    expect(result.equipment.drugs.find((drug) => drug.drugId === 'rocuronium')?.infusionRate).toBe(0);
    expect(result.events.some((event) => event.eventId.startsWith('unsupported-infusion-rocuronium'))).toBe(true);
  });
});

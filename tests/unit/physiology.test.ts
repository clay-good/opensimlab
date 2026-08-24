/**
 * Acceptance tests for engine/physiology and the benchmarks in engine/validation.
 */
import { describe, expect, it } from 'vitest';
import {
  FIELDS, RESPIRATORY_PROFILES, TICK_MINUTES, VirtualPatient, baselineSvr, cardiacOutput,
  clampState, effectiveStimulus, gradeProbabilities, meanArterialPressure, saturationFromPo2,
  stepGas, initialGasState, timeToDesaturationMinutes, type MutableState, type PatientProfile,
  type ScenarioDrive, type VentilatorSettings,
} from '@anesthesia/physiology';
import { createRng } from '@platform/kernel/rng';
import {
  arterialOxygenContentMlPerDl, oxygenDeliveryMlPerMin,
} from '@anesthesia/physiology/oxygen-delivery';

const HEALTHY_ADULT: PatientProfile = {
  hemodynamics: {
    baselineHeartRateBpm: 72,
    baselineMapMmHg: 90,
    baselineStrokeVolumeMl: 70,
    arterialStiffness: 1,
    fixedStrokeVolume: false,
    baroreflexGain: 1,
    bloodVolumeMl: 5000,
    hemoglobinGPerDl: 14,
  },
  respiratory: RESPIRATORY_PROFILES.healthy,
  airway: { difficulty: 0, difficultMaskVentilation: false },
  coreTemperatureC: 36.6,
  ageYears: 35,
};

const ELDERLY_ASA3: PatientProfile = {
  ...HEALTHY_ADULT,
  hemodynamics: {
    ...HEALTHY_ADULT.hemodynamics,
    baselineHeartRateBpm: 64,
    // Treated hypertension: the profile's own baseline, not a fixed 120/80.
    baselineMapMmHg: 104,
    baselineStrokeVolumeMl: 62,
    arterialStiffness: 1.5,
    bloodVolumeMl: 4200,
    hemoglobinGPerDl: 12.4,
  },
  ageYears: 72,
};

const VENTILATED: VentilatorSettings = {
  peep: 0, mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12,
  fio2: 0.5, freshGasFlowLPerMin: 1, delivering: true, sevofluranePercent: 0,
};
const QUIET: ScenarioDrive = {
  surgicalStimulus: 0, obstructionFraction: 0, bloodLossMl: 0, crystalloidMl: 0,
};
const NO_DRUGS = { propofolCe: 0, remifentanilCe: 0, vasopressorEffect: 0 };

function run(
  patient: VirtualPatient,
  seconds: number,
  drugs = NO_DRUGS,
  ventilator = VENTILATED,
  scenario = QUIET,
) {
  let result = patient.tick(drugs, ventilator, scenario);
  for (let i = 1; i < seconds * 10; i += 1) result = patient.tick(drugs, ventilator, scenario);
  return result;
}

describe('Requirement: Canonical Patient State Vector', () => {
  it('calculates oxygen content and delivery from hemoglobin, saturation, tension, and flow', () => {
    expect(arterialOxygenContentMlPerDl(10, 100, 100)).toBeCloseTo(13.7, 8);
    expect(oxygenDeliveryMlPerMin({
      cardiacOutputLPerMin: 5, hemoglobinGPerDl: 10, spo2Percent: 100, pao2MmHg: 100,
    })).toBeCloseTo(685, 8);
  });

  it('isolates the packed-red-cell hemoglobin change from simultaneous plasma leak', () => {
    const patient = new VirtualPatient(HEALTHY_ADULT, createRng(20));
    const result = patient.tick(NO_DRUGS, VENTILATED, {
      ...QUIET, capillaryLeakMl: 100, packedRedCellVolumeMl: 300,
      packedRedCellHemoglobinG: 60,
    });
    expect(result.transfusion?.volumeMl).toBe(300);
    expect(result.transfusion?.hemoglobinG).toBe(60);
    expect(result.transfusion?.hemoglobinAfterGPerDl)
      .toBeGreaterThan(result.transfusion?.hemoglobinBeforeGPerDl ?? Infinity);
    expect(result.state.hemoglobinGPerDl).toBeCloseTo(
      result.transfusion?.hemoglobinAfterGPerDl ?? 0, 8,
    );
  });

  it('dilutes coagulation factors with retained crystalloid and restores them with plasma', () => {
    const patient = new VirtualPatient(HEALTHY_ADULT, createRng(21));
    const diluted = patient.tick(NO_DRUGS, VENTILATED, { ...QUIET, crystalloidMl: 4000 });
    expect(diluted.state.prothrombinTimeRatio).toBeGreaterThan(1.15);
    expect(diluted.state.fibrinogenGPerL).toBeLessThan(2.6);
    const treated = patient.tick(NO_DRUGS, VENTILATED, {
      ...QUIET, freshFrozenPlasmaVolumeMl: 1100,
    });
    expect(treated.plasmaTransfusion?.prothrombinTimeRatioAfter)
      .toBeLessThan(treated.plasmaTransfusion?.prothrombinTimeRatioBefore ?? 0);
    expect(treated.plasmaTransfusion?.fibrinogenAfterGPerL)
      .toBeGreaterThan(treated.plasmaTransfusion?.fibrinogenBeforeGPerL ?? Infinity);
  });

  it('Scenario: Every state variable is typed and bounded', () => {
    for (const [name, spec] of Object.entries(FIELDS)) {
      expect(spec.unit, `${name} needs a unit`).toBeDefined();
      expect(spec.max).toBeGreaterThan(spec.min);
      expect(spec.label.length).toBeGreaterThan(2);
      expect(spec.precision).toBeGreaterThanOrEqual(0);
    }
  });

  it('clamps an out-of-bound value and logs it as a warning rather than rendering it', () => {
    const state = { ...new VirtualPatient(HEALTHY_ADULT, createRng(1)).snapshot() } as MutableState;
    state.heartRateBpm = 900;
    state.spo2Percent = -5;
    const warnings = clampState(state);
    expect(state.heartRateBpm).toBe(FIELDS.heartRateBpm.max);
    expect(state.spo2Percent).toBe(FIELDS.spo2Percent.min);
    expect(warnings.map((w) => w.field)).toEqual(['heartRateBpm', 'spo2Percent']);
    expect(warnings[0]?.message).toContain('bound');
  });

  it('Scenario: Baseline reflects the patient profile', () => {
    // A 72 y ASA III patient with treated hypertension, not a fixed 120/80 at 70 bpm.
    const patient = new VirtualPatient(ELDERLY_ASA3, createRng(2));
    const state = patient.snapshot();
    expect(state.heartRateBpm).toBeCloseTo(64, 6);
    expect(state.meanArterialMmHg).toBeCloseTo(104, 6);
    expect(state.systolicMmHg).toBeGreaterThan(140);
    expect(state.hemoglobinGPerDl).toBeCloseTo(12.4, 6);
    // And a different profile really does start somewhere else.
    expect(new VirtualPatient(HEALTHY_ADULT, createRng(2)).snapshot().meanArterialMmHg).toBeCloseTo(90, 6);
  });
});

describe('Requirement: Hemodynamic Response Model', () => {
  it('derives mean arterial pressure rather than setting it', () => {
    expect(meanArterialPressure(5, 1360)).toBeCloseTo((5 * 1360) / 80 + 5, 9);
    expect(cardiacOutput(72, 70)).toBeCloseTo(5.04, 9);
    // Baseline resistance is whatever makes the profile's own numbers consistent.
    const svr = baselineSvr(HEALTHY_ADULT.hemodynamics);
    expect(meanArterialPressure(cardiacOutput(72, 70), svr)).toBeCloseTo(90, 6);
  });

  it('Scenario: Propofol induction produces vasodilatory hypotension', () => {
    const patient = new VirtualPatient(HEALTHY_ADULT, createRng(3));
    const before = patient.snapshot();
    const result = run(patient, 90, { propofolCe: 4.0, remifentanilCe: 0, vasopressorEffect: 0 });
    expect(result.state.meanArterialMmHg).toBeLessThan(before.meanArterialMmHg * 0.85);
    // Resistance fell: the mechanism is vasodilation, not an unattributed drop.
    expect(result.state.svrDynSCm5).toBeLessThan(before.svrDynSCm5);
    const mapAttribution = result.attribution.find((a) => a.variable === 'meanArterialMmHg');
    expect(mapAttribution).toBeDefined();
    expect(mapAttribution?.terms.map((t) => t.termId)).toContain('propofol-vasodilation');
  });

  it('Scenario: Vasopressor treats the right mechanism', () => {
    const patient = new VirtualPatient(HEALTHY_ADULT, createRng(4));
    const dilated = run(patient, 90, { propofolCe: 4.0, remifentanilCe: 0, vasopressorEffect: 0 });
    const treated = run(patient, 60, { propofolCe: 4.0, remifentanilCe: 0, vasopressorEffect: 0.7 });
    expect(treated.state.svrDynSCm5).toBeGreaterThan(dilated.state.svrDynSCm5);
    expect(treated.state.meanArterialMmHg).toBeGreaterThan(dilated.state.meanArterialMmHg);
    // And the baroreflex slows the heart as the pressure recovers.
    expect(treated.state.heartRateBpm).toBeLessThan(dilated.state.heartRateBpm);
  });

  it('Scenario: Vasopressor is insufficient for hypovolemia', () => {
    const bleed = (patient: VirtualPatient) => {
      // Remove 25% of circulating volume over one minute.
      for (let i = 0; i < 600; i += 1) {
        patient.tick(NO_DRUGS, VENTILATED, { ...QUIET, bloodLossMl: 1250 / 600 });
      }
    };
    const patient = new VirtualPatient(HEALTHY_ADULT, createRng(5));
    // Anaesthetized, so the reflex cannot mask the loss.
    const anesthetized = { propofolCe: 3.0, remifentanilCe: 3.0, vasopressorEffect: 0 };
    run(patient, 60, anesthetized);
    bleed(patient);
    const hypotensive = run(patient, 30, anesthetized);
    const pressed = run(patient, 45, { ...anesthetized, vasopressorEffect: 0.8 });
    // Pressure rises but cardiac output stays depressed, because the deficit is volume.
    expect(pressed.state.meanArterialMmHg).toBeGreaterThan(hypotensive.state.meanArterialMmHg);
    expect(pressed.state.cardiacOutputLPerMin).toBeLessThan(
      cardiacOutput(HEALTHY_ADULT.hemodynamics.baselineHeartRateBpm, HEALTHY_ADULT.hemodynamics.baselineStrokeVolumeMl) * 0.9,
    );
  });
});

describe('Requirement: Baroreflex And Autonomic Regulation', () => {
  const bleed500 = (patient: VirtualPatient, drugs: typeof NO_DRUGS) => {
    for (let i = 0; i < 600; i += 1) {
      patient.tick(drugs, VENTILATED, { ...QUIET, bloodLossMl: 500 / 600 });
    }
    return run(patient, 60, drugs);
  };

  it('Scenario: Awake patient compensates for blood loss', () => {
    const patient = new VirtualPatient(HEALTHY_ADULT, createRng(6));
    const baseline = patient.snapshot();
    const after = bleed500(patient, NO_DRUGS);
    expect(after.state.heartRateBpm).toBeGreaterThan(baseline.heartRateBpm);
    expect(Math.abs(after.state.meanArterialMmHg - baseline.meanArterialMmHg) / baseline.meanArterialMmHg)
      .toBeLessThan(0.10);
  });

  it('Scenario: Anesthetized patient does not compensate', () => {
    const awake = new VirtualPatient(HEALTHY_ADULT, createRng(7));
    const awakeBaseline = awake.snapshot();
    const awakeAfter = bleed500(awake, NO_DRUGS);
    const awakeRise = awakeAfter.state.heartRateBpm - awakeBaseline.heartRateBpm;

    const asleep = new VirtualPatient(HEALTHY_ADULT, createRng(7));
    // A predicted depth index near 45 with remifentanil running.
    const drugs = { propofolCe: 3.1, remifentanilCe: 3.0, vasopressorEffect: 0 };
    const settled = run(asleep, 120, drugs);
    expect(settled.state.depthIndex).toBeGreaterThan(25);
    expect(settled.state.depthIndex).toBeLessThan(60);
    const before = settled.state;
    const after = bleed500(asleep, drugs);
    const asleepRise = after.state.heartRateBpm - before.heartRateBpm;

    // The reflex tachycardia is markedly blunted.
    expect(asleepRise).toBeLessThan(awakeRise * 0.5);
    // And the pressure falls substantially instead of being held.
    expect((before.meanArterialMmHg - after.state.meanArterialMmHg) / before.meanArterialMmHg)
      .toBeGreaterThan(0.06);
  });
});

describe('Requirement: Respiratory And Gas Exchange Model', () => {
  it('Scenario: Hypoventilation raises end-tidal carbon dioxide', () => {
    const patient = new VirtualPatient(HEALTHY_ADULT, createRng(8));
    const normal = run(patient, 600, NO_DRUGS, VENTILATED);
    const halved = { ...VENTILATED, respiratoryRateBpm: 6 };
    // One minute in, the value has moved but is nowhere near its new steady state:
    // it follows the body's carbon dioxide stores rather than jumping.
    const afterOneMinute = run(patient, 60, NO_DRUGS, halved);
    const afterAnHour = run(patient, 3600, NO_DRUGS, halved);
    expect(afterOneMinute.state.paco2MmHg).toBeGreaterThan(normal.state.paco2MmHg);
    expect(afterOneMinute.state.paco2MmHg).toBeLessThan(
      normal.state.paco2MmHg + (afterAnHour.state.paco2MmHg - normal.state.paco2MmHg) * 0.4,
    );
    // Halving alveolar ventilation roughly doubles the steady-state tension.
    expect(afterAnHour.state.paco2MmHg / normal.state.paco2MmHg).toBeGreaterThan(1.7);
    expect(afterAnHour.state.paco2MmHg / normal.state.paco2MmHg).toBeLessThan(2.3);
  });

  it('Scenario: Apnea desaturation reproduces published times', () => {
    // Benumof, Dagg and Benumof, Anesthesiology 1997;87:979-82 (PMID 9357902):
    // about 8, 5 and 2.7 minutes to 90% after preoxygenation.
    const BENCHMARK = { healthy: 8, 'moderately-ill': 5, obese: 2.7 } as const;
    /** Declared tolerance, published in the validation report. */
    const TOLERANCE = 0.2;
    for (const [name, expected] of Object.entries(BENCHMARK)) {
      const observed = timeToDesaturationMinutes(
        RESPIRATORY_PROFILES[name as keyof typeof RESPIRATORY_PROFILES], { preoxygenated: true },
      );
      const error = Math.abs(observed - expected) / expected;
      expect(error, `${name}: ${observed.toFixed(2)} min against a benchmark of ${expected} min`)
        .toBeLessThanOrEqual(TOLERANCE);
    }
  });

  it('Scenario: Desaturation follows the dissociation curve, not a straight line', () => {
    const profile = RESPIRATORY_PROFILES.healthy;
    const gas = initialGasState(profile, 1.0);
    const breathing = {
      tidalVolumeMl: 500, respiratoryRateBpm: 12, fio2: 1, cardiacOutputRatio: 1,
      obstructionFraction: 0, hemoglobinGPerDl: 15, bloodVolumeMl: 5000,
    };
    for (let i = 0; i < 1800; i += 1) stepGas(gas, breathing, profile, TICK_MINUTES);
    const apnea = { ...breathing, tidalVolumeMl: 0, respiratoryRateBpm: 0 };
    const marks: Record<number, number> = {};
    let previous = 100;
    for (let i = 1; i <= 20 * 600; i += 1) {
      const result = stepGas(gas, apnea, profile, TICK_MINUTES);
      for (const level of [95, 90, 80]) {
        if (previous > level && result.spo2Percent <= level) marks[level] = i / 600;
      }
      previous = result.spo2Percent;
    }
    const plateauRate = 5 / (marks[95] ?? 1);
    const steepRate = 10 / ((marks[80] ?? 1) - (marks[90] ?? 0));
    expect(steepRate).toBeGreaterThan(plateauRate * 5);
  });

  it('Scenario: Failure to preoxygenate shortens the margin visibly', () => {
    const withPreox = timeToDesaturationMinutes(RESPIRATORY_PROFILES.healthy, { preoxygenated: true });
    const without = timeToDesaturationMinutes(RESPIRATORY_PROFILES.healthy, { preoxygenated: false });
    expect(without).toBeLessThan(withPreox * 0.2);
  });

  it('uses the published dissociation curve shape', () => {
    // Standard anchor points a clinician recognizes.
    expect(saturationFromPo2(27)).toBeGreaterThan(48);
    expect(saturationFromPo2(27)).toBeLessThan(52);
    expect(saturationFromPo2(60)).toBeGreaterThan(88);
    expect(saturationFromPo2(60)).toBeLessThan(92);
    expect(saturationFromPo2(100)).toBeGreaterThan(97);
    // Monotone everywhere.
    let previous = -1;
    for (let po2 = 0; po2 <= 600; po2 += 1) {
      const value = saturationFromPo2(po2);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});

describe('Requirement: Surgical Stimulus', () => {
  it('Scenario: Incision without opioid provokes a response', () => {
    const patient = new VirtualPatient(HEALTHY_ADULT, createRng(9));
    const drugs = { propofolCe: 3.4, remifentanilCe: 0, vasopressorEffect: 0 };
    const settled = run(patient, 180, drugs);
    expect(settled.state.depthIndex).toBeGreaterThan(40);
    expect(settled.state.depthIndex).toBeLessThan(70);
    const incised = run(patient, 40, drugs, VENTILATED, { ...QUIET, surgicalStimulus: 0.9 });
    expect(incised.state.heartRateBpm).toBeGreaterThan(settled.state.heartRateBpm);
    expect(incised.state.meanArterialMmHg).toBeGreaterThan(settled.state.meanArterialMmHg);
  });

  it('Scenario: Adequate opioid blunts the response', () => {
    const measure = (remifentanilCe: number) => {
      const patient = new VirtualPatient(HEALTHY_ADULT, createRng(10));
      const drugs = { propofolCe: 3.4, remifentanilCe, vasopressorEffect: 0 };
      const settled = run(patient, 180, drugs);
      const incised = run(patient, 40, drugs, VENTILATED, { ...QUIET, surgicalStimulus: 0.9 });
      return {
        rate: incised.state.heartRateBpm - settled.state.heartRateBpm,
        map: incised.state.meanArterialMmHg - settled.state.meanArterialMmHg,
      };
    };
    const bare = measure(0);
    const covered = measure(6);
    expect(covered.rate).toBeLessThan(bare.rate * 0.4);
    expect(covered.map).toBeLessThan(bare.map * 0.4);
  });

  it('opposes raw stimulus by hypnotic and by opioid, opioid more strongly', () => {
    expect(effectiveStimulus(1, 0, 0)).toBeCloseTo(1, 9);
    expect(effectiveStimulus(1, 1, 0)).toBeLessThan(1);
    expect(effectiveStimulus(1, 0, 1)).toBeLessThan(effectiveStimulus(1, 1, 0));
    expect(effectiveStimulus(1, 1, 1)).toBeLessThan(0.05);
  });
});

describe('Requirement: Physiology Is Reproducible And Attributable', () => {
  it('Scenario: Debrief explains a pressure drop', () => {
    const patient = new VirtualPatient(HEALTHY_ADULT, createRng(11));
    const result = run(patient, 45, { propofolCe: 4.5, remifentanilCe: 2, vasopressorEffect: 0 });
    const map = result.attribution.find((a) => a.variable === 'meanArterialMmHg');
    expect(map).toBeDefined();
    expect(map!.terms.length).toBeGreaterThan(1);
    // Terms are RANKED, each carries its share, and the shares sum to one.
    const shares = map!.terms.map((t) => t.share);
    for (let i = 1; i < shares.length; i += 1) {
      expect(shares[i]!).toBeLessThanOrEqual(shares[i - 1]! + 1e-12);
    }
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    expect(map!.terms[0]?.label.length).toBeGreaterThan(4);
  });

  it('marks teaching-model contributors so the Why panel can say so', () => {
    const patient = new VirtualPatient(HEALTHY_ADULT, createRng(12));
    const result = run(patient, 30, { propofolCe: 3, remifentanilCe: 0, vasopressorEffect: 0.6 });
    const svr = result.attribution.find((a) => a.variable === 'svrDynSCm5');
    const vasopressor = svr?.terms.find((t) => t.termId === 'vasopressor');
    expect(vasopressor?.teachingModel).toBe(true);
  });

  it('Scenario: Noise is seeded — the same seed reproduces the same trace exactly', () => {
    const trace = (seed: number) => {
      const patient = new VirtualPatient(HEALTHY_ADULT, createRng(seed));
      const out: number[] = [];
      for (let i = 0; i < 600; i += 1) {
        const result = patient.tick(
          { propofolCe: i / 300, remifentanilCe: i / 600, vasopressorEffect: 0 }, VENTILATED, QUIET,
        );
        out.push(result.state.meanArterialMmHg, result.state.spo2Percent, result.state.depthIndex);
      }
      return out;
    };
    expect(trace(99)).toEqual(trace(99));
  });
});

describe('Requirement: Laryngoscopy', () => {
  it('Scenario: Laryngoscopy reports a Cormack-Lehane grade', () => {
    const patient = new VirtualPatient(HEALTHY_ADULT, createRng(13));
    const result = patient.laryngoscopy('direct');
    expect([1, 2, 3, 4]).toContain(result.grade);
    expect(result.durationSeconds).toBeGreaterThan(10);
    expect(result.narrative).toContain('Cormack-Lehane');
  });

  it('Scenario: Failure rates are anchored to reported incidence', () => {
    // An unremarkable airway: grade 3 or 4 in the published low-percentage range.
    const probabilities = gradeProbabilities({ difficulty: 0, difficultMaskVentilation: false }, 'direct', 0);
    const difficult = (probabilities[2] ?? 0) + (probabilities[3] ?? 0);
    expect(difficult).toBeGreaterThan(0.02);
    expect(difficult).toBeLessThan(0.12);
    expect(probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });

  it('Scenario: repeated attempts worsen the grade through airway trauma', () => {
    const anatomy = { difficulty: 0.4, difficultMaskVentilation: false };
    const fresh = gradeProbabilities(anatomy, 'direct', 0);
    const traumatized = gradeProbabilities(anatomy, 'direct', 0.35);
    const badly = (p: number[]) => (p[2] ?? 0) + (p[3] ?? 0);
    expect(badly(traumatized)).toBeGreaterThan(badly(fresh));
  });

  it('Scenario: Videolaryngoscopy changes the odds, as the guideline expects', () => {
    const anatomy = { difficulty: 0.6, difficultMaskVentilation: false };
    const direct = gradeProbabilities(anatomy, 'direct', 0);
    const video = gradeProbabilities(anatomy, 'video', 0);
    const adequate = (p: number[]) => (p[0] ?? 0) + (p[1] ?? 0);
    expect(adequate(video)).toBeGreaterThan(adequate(direct));
  });

  it('consumes simulated time, more when the view is poor', () => {
    const patient = new VirtualPatient(
      { ...HEALTHY_ADULT, airway: { difficulty: 0.9, difficultMaskVentilation: true } }, createRng(14),
    );
    const first = patient.laryngoscopy('direct');
    const second = patient.laryngoscopy('direct');
    expect(first.durationSeconds).toBeGreaterThan(0);
    expect(second.durationSeconds).toBeGreaterThan(0);
    expect(patient.airway.attempts).toBe(2);
    expect(patient.airway.trauma).toBeGreaterThan(first.traumaAdded);
  });
});

describe('Requirement: Laryngoscopy Grades Match Reported Incidence', () => {
  // A simulator that makes every airway difficult distorts a learner's
  // expectations as badly as one that makes none. These are the reported
  // elective-surgery numbers the distribution is anchored to.
  const poorView = (difficulty: number, technique: 'direct' | 'video') => {
    const p = gradeProbabilities({ difficulty, difficultMaskVentilation: false }, technique, 0);
    return (p[2] ?? 0) + (p[3] ?? 0);
  };

  it('Scenario: an unremarkable airway is a grade 1 or 2 view almost always', () => {
    const p = gradeProbabilities({ difficulty: 0, difficultMaskVentilation: false }, 'direct', 0);
    // Grade 3 in the low single digits, grade 4 rare: reported grade 4 incidence
    // in elective surgery is roughly 0.1 to 0.5 percent.
    expect((p[0] ?? 0) + (p[1] ?? 0)).toBeGreaterThan(0.9);
    expect(p[3] ?? 0).toBeLessThan(0.006);
  });

  it('Scenario: difficulty spans the reported range instead of saturating', () => {
    // Monotone, and even the most difficult declared anatomy stays inside what
    // high-risk cohorts report rather than making a poor view the normal case.
    expect(poorView(0.2, 'direct')).toBeGreaterThan(poorView(0, 'direct'));
    expect(poorView(1, 'direct')).toBeGreaterThan(poorView(0.6, 'direct'));
    expect(poorView(1, 'direct')).toBeLessThan(0.35);
  });

  it('Scenario: videolaryngoscopy rescues the difficult airway, as the guidelines assume', () => {
    // Video delivers an adequate view in the large majority of difficult airways.
    // That is why it is the rescue device, and a simulator in which it barely
    // helps teaches the opposite of the difficult-airway guideline.
    expect(poorView(1, 'video')).toBeLessThan(0.15);
    expect(poorView(1, 'video')).toBeLessThan(poorView(1, 'direct') / 2);
  });
});

/**
 * Acceptance tests for engine/pkpd-core and engine/pharmacology.
 */
import { describe, expect, it } from 'vitest';
import {
  CompartmentSolver, STEP_MINUTES, contextSensitiveDecrementMinutes, timeToPeakEffectMinutes,
} from '@platform/kernel/compartments';
import {
  MissingCovariate, NoEffectSiteForModel, UnsupportedModelStructure,
} from '@platform/kernel/errors';
import {
  bodyMassIndex, deriveBody, fatFreeMassAlSallami2015, fatFreeMassJanmahasatian2005, jamesLbmInverts,
  jamesLbmTurningPointKg, leanBodyMassJames1976, type Covariates,
} from '@anesthesia/pharmacology/body-composition';
import { evaluateEnvelope, CONFIDENCE_LABEL_TEXT } from '@anesthesia/pharmacology/envelope';
import {
  MODELS, MODEL_SET_REVISION, getModel, parametersFor, selectDefaultModel,
} from '@anesthesia/pharmacology/registry';
import {
  MARSH_RATE_CONSTANTS, PROPOFOL_MARSH_1991,
} from '@anesthesia/pharmacology/models/propofol-marsh-1991';
import { PROPOFOL_SCHNIDER_1998 } from '@anesthesia/pharmacology/models/propofol-schnider-1998';
import {
  ELEVELD_PD, ELEVELD_REFERENCE, ELEVELD_THETA, PROPOFOL_ELEVELD_2018,
} from '@anesthesia/pharmacology/models/propofol-eleveld-2018';
import { REMIFENTANIL_MINTO_1997 } from '@anesthesia/pharmacology/models/remifentanil-minto-1997';
import {
  additiveEffect, combinedPotency, macForAge, macFraction, responseSurfaceEffect,
  sigmoidEmax, totalMacFraction, PROPOFOL_REMIFENTANIL_SURFACE,
} from '@anesthesia/pharmacology/pd';
import { createRng } from '@platform/kernel/rng';

const ADULT: Covariates = { ageYears: 35, weightKg: 70, heightCm: 170, sex: 'male' };

describe('Requirement: Mammillary Compartment Solver', () => {
  it('Scenario: Mass is conserved in the absence of elimination', () => {
    const parameters = { ...parametersFor(PROPOFOL_MARSH_1991, ADULT), cl: 0 };
    const solver = new CompartmentSolver(parameters);
    solver.bolus(100);
    for (let step = 0; step < 240 * 600; step += 1) {
      solver.step(0);
      if (step % 6000 === 0) {
        expect(Math.abs(solver.totalAmount - 100) / 100).toBeLessThan(1e-9);
      }
    }
    expect(Math.abs(solver.totalAmount - 100) / 100).toBeLessThan(1e-9);
  });

  it('Scenario: An unsupported compartment count is rejected at load time', () => {
    expect(() => new CompartmentSolver({
      modelId: 'four-compartment-fiction',
      v1: 5, peripheralVolumes: [10, 20, 40], cl: 1,
      intercompartmentalClearances: [1, 1, 1], ke0: 0.2,
    })).toThrow(UnsupportedModelStructure);
    // And the error names the model rather than silently truncating to three.
    try {
      new CompartmentSolver({
        modelId: 'four-compartment-fiction', v1: 5, peripheralVolumes: [10, 20, 40],
        cl: 1, intercompartmentalClearances: [1, 1, 1], ke0: 0.2,
      });
    } catch (error) {
      expect((error as Error).message).toContain('four-compartment-fiction');
    }
  });

  it('supports one, two and three compartments', () => {
    for (const peripheral of [[], [20], [20, 100]]) {
      const solver = new CompartmentSolver({
        modelId: 'n', v1: 5, peripheralVolumes: peripheral, cl: 1,
        intercompartmentalClearances: peripheral.map(() => 1), ke0: 0.2,
      });
      solver.bolus(10);
      solver.step(0);
      expect(solver.plasma).toBeGreaterThan(0);
    }
  });

  it('matches a fine-step reference solution, proving the matrix exponential is exact', () => {
    const parameters = parametersFor(PROPOFOL_MARSH_1991, ADULT);
    const coarse = new CompartmentSolver(parameters, STEP_MINUTES);
    const fine = new CompartmentSolver(parameters, STEP_MINUTES / 50);
    coarse.bolus(140); fine.bolus(140);
    for (let i = 0; i < 600 * 10; i += 1) {
      coarse.step(10);
      for (let j = 0; j < 50; j += 1) fine.step(10);
    }
    // Both use the exact matrix-exponential solution, so they agree to the
    // accumulated floating point error of ten simulated minutes, not to a
    // truncation error that would depend on the step.
    expect(Math.abs(coarse.plasma - fine.plasma) / fine.plasma).toBeLessThan(1e-9);
  });
});

describe('Requirement: Effect-Site Compartment', () => {
  it('Scenario: Hysteresis is present and correctly timed', () => {
    const parameters = { ...parametersFor(PROPOFOL_MARSH_1991, ADULT), ke0: 0.26 };
    const analyticMinutes = timeToPeakEffectMinutes(parameters);
    const solver = new CompartmentSolver(parameters);
    solver.bolus(140);
    const plasmaAtStart = solver.plasma;
    let peakEffectSite = 0;
    let peakEffectSiteMinutes = 0;
    for (let step = 1; step <= 600 * 20; step += 1) {
      solver.step(0);
      if (solver.effectSite > peakEffectSite) {
        peakEffectSite = solver.effectSite;
        peakEffectSiteMinutes = step * STEP_MINUTES;
      }
    }
    // Peak effect site occurs strictly LATER than peak plasma, which for a bolus is at time zero.
    expect(peakEffectSiteMinutes).toBeGreaterThan(0);
    expect(peakEffectSite).toBeLessThan(plasmaAtStart);
    // And it matches the analytic time-to-peak-effect for that ke0 within one second.
    expect(Math.abs(peakEffectSiteMinutes - analyticMinutes) * 60).toBeLessThan(1);
  });

  it('does not feed effect-site mass back into the central compartment', () => {
    const withEffect = new CompartmentSolver({ ...parametersFor(PROPOFOL_MARSH_1991, ADULT), cl: 0 });
    withEffect.bolus(100);
    for (let i = 0; i < 6000; i += 1) withEffect.step(0);
    // Total mass in the pharmacokinetic compartments is untouched by the effect site.
    expect(Math.abs(withEffect.totalAmount - 100) / 100).toBeLessThan(1e-9);
    expect(withEffect.effectSite).toBeGreaterThan(0);
  });

  it('Scenario: A model without a published ke0 produces no effect-site curve', () => {
    const solver = new CompartmentSolver({
      modelId: 'no-effect-site', v1: 5, peripheralVolumes: [20], cl: 1,
      intercompartmentalClearances: [1], ke0: null,
    });
    solver.bolus(10);
    solver.step(0);
    expect(solver.plasma).toBeGreaterThan(0);
    expect(solver.hasEffectSiteCurve).toBe(false);
    expect(() => solver.effectSite).toThrow(NoEffectSiteForModel);
  });
});

describe('Requirement: Fixed-Step Deterministic Integration', () => {
  it('Scenario: Step size is decoupled from frame rate', () => {
    // The solver executes exactly ten steps per simulated second whatever the
    // caller does, so a run at any frame rate produces the identical state.
    const parameters = parametersFor(PROPOFOL_ELEVELD_2018, ADULT);
    const run = (chunk: number) => {
      const solver = new CompartmentSolver(parameters);
      solver.bolus(140);
      let steps = 0;
      while (steps < 600) {
        for (let i = 0; i < chunk && steps < 600; i += 1) { solver.step(5); steps += 1; }
      }
      return solver.plasma;
    };
    // Sixty frames per second means one step every few frames; twelve means five at once.
    expect(Math.abs(run(1) - run(5))).toBeLessThan(1e-9);
    expect(Math.abs(run(1) - run(50))).toBeLessThan(1e-9);
  });

  it('reads no clock and uses no unseeded randomness', () => {
    // Two solvers built from identical inputs must agree bit for bit.
    const parameters = parametersFor(PROPOFOL_ELEVELD_2018, ADULT);
    const trace = () => {
      const solver = new CompartmentSolver(parameters);
      const out: number[] = [];
      for (let i = 0; i < 600; i += 1) { solver.step(i < 100 ? 30 : 0); out.push(solver.plasma, solver.effectSite); }
      return out;
    };
    expect(trace()).toEqual(trace());
    // The seeded generator likewise reproduces exactly.
    const draw = () => { const rng = createRng(4242, 'x'); return [rng.next(), rng.normal(), rng.next()]; };
    expect(draw()).toEqual(draw());
  });
});

describe('Requirement: Sigmoid Emax Pharmacodynamics', () => {
  it('follows the Eleveld equation when Table 3 labels the asymmetric branches in reverse', () => {
    expect(ELEVELD_PD.gammaLow).toBe(1.47);
    expect(ELEVELD_PD.gammaHigh).toBe(1.89);
    const below = sigmoidEmax(1.54, 3.08, ELEVELD_PD.gammaLow, ELEVELD_PD.gammaHigh, 93, 0);
    const above = sigmoidEmax(6.16, 3.08, ELEVELD_PD.gammaLow, ELEVELD_PD.gammaHigh, 93, 0);
    expect(below).toBeCloseTo(sigmoidEmax(1.54, 3.08, 1.47, 1.47, 93, 0), 12);
    expect(above).toBeCloseTo(sigmoidEmax(6.16, 3.08, 1.89, 1.89, 93, 0), 12);
  });

  it('Scenario: A two-slope sigmoid is continuous at Ce50', () => {
    const ce50 = 3.08;
    const below = sigmoidEmax(ce50 - 1e-9, ce50, 1.47, 1.89, 93, 0);
    const above = sigmoidEmax(ce50 + 1e-9, ce50, 1.47, 1.89, 93, 0);
    expect(Math.abs(below - above)).toBeLessThan(1e-6);
    // And both are exactly the midpoint at Ce50.
    expect(sigmoidEmax(ce50, ce50, 1.47, 1.89, 93, 0)).toBeCloseTo(46.5, 9);
  });

  it('Scenario: Propofol depth of anesthesia lands in the surgical range', () => {
    const depth = responseSurfaceEffect(3.0, 0);
    expect(depth).toBeGreaterThanOrEqual(40);
    expect(depth).toBeLessThanOrEqual(60);
  });

  it('is monotone decreasing in concentration for a depth endpoint', () => {
    let previous = Infinity;
    for (let ce = 0; ce <= 12; ce += 0.05) {
      const value = responseSurfaceEffect(ce, 0);
      expect(value).toBeLessThanOrEqual(previous + 1e-12);
      previous = value;
    }
  });
});

describe('Requirement: Drug Interaction Response Surface', () => {
  it('Scenario: The surface degrades to the single-drug curve', () => {
    for (const propofolCe of [0.5, 1.5, 3.0, 6.0]) {
      const surface = responseSurfaceEffect(propofolCe, 0);
      const alone = responseSurfaceEffect(propofolCe, 0, { ...PROPOFOL_REMIFENTANIL_SURFACE, alpha: 0 });
      expect(Math.abs(surface - alone)).toBeLessThan(1e-9);
    }
  });

  it('Scenario: Opioid deepens hypnosis more than addition predicts', () => {
    let previous = Infinity;
    for (let remi = 0; remi <= 4; remi += 0.25) {
      const depth = responseSurfaceEffect(2.0, remi);
      expect(depth).toBeLessThanOrEqual(previous + 1e-12);
      previous = depth;
    }
    // At 4 ng/mL the fall exceeds the sum of each drug's isolated effect.
    const synergistic = responseSurfaceEffect(2.0, 4.0);
    const additive = additiveEffect(2.0, 4.0);
    expect(synergistic).toBeLessThan(additive);
  });

  it('never returns a negative combined potency', () => {
    expect(combinedPotency(-1, -1, PROPOFOL_REMIFENTANIL_SURFACE)).toBe(0);
  });
});

describe('Requirement: Covariate Scaling', () => {
  it('Scenario: A shared body-composition equation has one implementation', () => {
    // Both models that need lean body mass call the same function, so they agree exactly.
    const patient: Covariates = { ageYears: 50, weightKg: 82, heightCm: 178, sex: 'male' };
    const direct = leanBodyMassJames1976(patient);
    expect(deriveBody(patient).leanBodyMassJames).toBe(direct);
    // And its value is what both Schnider and Minto see.
    const schnider = parametersFor(PROPOFOL_SCHNIDER_1998, patient);
    const expectedCl = 1.89 + 0.0456 * (82 - 77) - 0.0681 * (direct - 59) + 0.0264 * (178 - 177);
    expect(schnider.cl).toBeCloseTo(expectedCl, 12);
  });

  it('Scenario: Missing a required covariate is a hard error', () => {
    const noHeight = { ageYears: 40, weightKg: 70, sex: 'male' } as unknown as Covariates;
    expect(() => parametersFor(PROPOFOL_SCHNIDER_1998, noHeight)).toThrow(MissingCovariate);
    try {
      parametersFor(PROPOFOL_SCHNIDER_1998, noHeight);
    } catch (error) {
      expect((error as Error).message).toContain('heightCm');
      expect((error as Error).message).toContain('propofol-schnider-1998');
    }
  });
});

describe('Scenario: Transcription is verified against published reference values', () => {
  it('applies the Eleveld corrigendum without changing the underlying Q2 fixed effect', () => {
    expect(ELEVELD_THETA.q2Ref).toBe(1.75);
    const parameters = parametersFor(PROPOFOL_ELEVELD_2018, ELEVELD_REFERENCE);
    expect(parameters.intercompartmentalClearances[0]).toBeCloseTo(1.83, 2);
  });

  it('reproduces every model\'s reference-individual parameters', () => {
    for (const model of MODELS) {
      const reference = model.referenceIndividual;
      if (!reference) continue;
      const parameters = parametersFor(model, reference.covariates);
      const actual: Record<string, number> = {
        v1: parameters.v1,
        v2: parameters.peripheralVolumes[0] ?? Number.NaN,
        v3: parameters.peripheralVolumes[1] ?? Number.NaN,
        cl: parameters.cl,
        q2: parameters.intercompartmentalClearances[0] ?? Number.NaN,
        q3: parameters.intercompartmentalClearances[1] ?? Number.NaN,
        ke0: parameters.ke0 ?? Number.NaN,
        ce50: model.pd ? model.pd.ce50(reference.covariates) : Number.NaN,
      };
      for (const [name, expected] of Object.entries(reference.expected)) {
        const value = actual[name];
        expect(value, `${model.id} ${name}`).toBeDefined();
        const relative = Math.abs((value as number) - expected) / Math.max(Math.abs(expected), 1e-12);
        expect(relative, `${model.id} ${name}: got ${value}, expected ${expected}`)
          .toBeLessThanOrEqual(reference.tolerance);
      }
    }
  });

  it('reproduces the Marsh return rate constants from the derived clearances', () => {
    const parameters = parametersFor(PROPOFOL_MARSH_1991, ADULT);
    const k21 = (parameters.intercompartmentalClearances[0] ?? 0) / (parameters.peripheralVolumes[0] ?? 1);
    const k31 = (parameters.intercompartmentalClearances[1] ?? 0) / (parameters.peripheralVolumes[1] ?? 1);
    const k10 = parameters.cl / parameters.v1;
    // A mistyped digit in any volume or clearance would break these.
    expect(k10).toBeCloseTo(MARSH_RATE_CONSTANTS.k10, 12);
    expect(Math.abs(k21 - MARSH_RATE_CONSTANTS.k21) / MARSH_RATE_CONSTANTS.k21).toBeLessThan(0.01);
    expect(Math.abs(k31 - MARSH_RATE_CONSTANTS.k31) / MARSH_RATE_CONSTANTS.k31).toBeLessThan(0.01);
  });

  it('produces a plausible concentration-time profile after a standard induction bolus', () => {
    // A 2 mg/kg bolus in the reference adult. The peak plasma concentration
    // immediately after a bolus is dose / V1, and the effect site peaks later and
    // lower. These are the published qualitative anchors for the profile.
    const parameters = parametersFor(PROPOFOL_ELEVELD_2018, ADULT);
    const solver = new CompartmentSolver(parameters);
    solver.bolus(2 * ADULT.weightKg);
    expect(solver.plasma).toBeCloseTo(140 / parameters.v1, 9);
    let peakCe = 0;
    for (let i = 0; i < 600 * 5; i += 1) { solver.step(0); peakCe = Math.max(peakCe, solver.effectSite); }
    // The effect site peaks in the range a clinician expects for propofol.
    expect(peakCe).toBeGreaterThan(2);
    expect(peakCe).toBeLessThan(12);
  });
});

describe('Requirement: Applicability Envelopes Are Enforced', () => {
  it('Scenario: Schnider is refused for a morbidly obese patient', () => {
    const patient: Covariates = { ageYears: 40, weightKg: 140, heightCm: 172, sex: 'male' };
    expect(bodyMassIndex(patient)).toBeCloseTo(47.3, 1);

    const result = evaluateEnvelope(PROPOFOL_SCHNIDER_1998, patient);
    expect(result.label).toBe('out-of-range');
    expect(CONFIDENCE_LABEL_TEXT[result.label]).toBe('Out of range');
    // The reason names BOTH the body mass index bound and the lean-body-mass failure.
    expect(result.summary).toContain('body mass index');
    expect(result.summary).toContain('James');
    expect(result.failures.map((f) => f.id)).toContain('james-lbm-inversion');
    // And Eleveld is offered as the in-range alternative.
    expect(result.alternativeModelId).toBe('propofol-eleveld-2018');
    // Eleveld is in range for this patient. Its label is `pending-check` rather
    // than `published` because its transcription has not had its independent
    // second check: being in range is necessary for Published, not sufficient.
    expect(evaluateEnvelope(PROPOFOL_ELEVELD_2018, patient).label).toBe('pending-check');
  });

  it('Scenario: The James lean-body-mass inversion is caught', () => {
    const patient: Covariates = { ageYears: 40, weightKg: 140, heightCm: 172, sex: 'male' };
    expect(jamesLbmInverts(patient)).toBe(true);
    // Adding weight past the turning point really does reduce the computed value.
    const turningPoint = jamesLbmTurningPointKg(patient);
    const atPeak = leanBodyMassJames1976({ ...patient, weightKg: turningPoint });
    // The turning point really is the maximum, and past it the curve falls: adding
    // 20 kg to an already-heavy patient REDUCES the computed lean body mass.
    for (const offset of [-20, -5, 5, 20]) {
      expect(leanBodyMassJames1976({ ...patient, weightKg: turningPoint + offset }))
        .toBeLessThanOrEqual(atPeak + 1e-9);
    }
    expect(leanBodyMassJames1976({ ...patient, weightKg: turningPoint + 20 }))
      .toBeLessThan(leanBodyMassJames1976({ ...patient, weightKg: turningPoint + 5 }));
    // Far enough past it the equation returns a value below the patient's own
    // fat-free mass, which is the non-physical behaviour the failure mode names.
    expect(leanBodyMassJames1976({ ...patient, weightKg: 200 }))
      .toBeLessThan(fatFreeMassJanmahasatian2005({ ...patient, weightKg: 200 }));
    // Both affected models declare the failure mode.
    for (const model of [PROPOFOL_SCHNIDER_1998, REMIFENTANIL_MINTO_1997]) {
      expect(model.failureModes.map((m) => m.id)).toContain('james-lbm-inversion');
      expect(evaluateEnvelope(model, patient).label).toBe('out-of-range');
    }
    // Janmahasatian, by contrast, stays monotone at every habitus.
    let previous = 0;
    for (let weight = 40; weight <= 200; weight += 1) {
      const value = fatFreeMassJanmahasatian2005({ ...patient, weightKg: weight });
      expect(value).toBeGreaterThan(previous);
      previous = value;
    }
  });

  it('Scenario: The learner may override, deliberately and visibly', () => {
    // An out-of-range model still runs, so the learner can see what goes wrong.
    const patient: Covariates = { ageYears: 40, weightKg: 140, heightCm: 172, sex: 'male' };
    const parameters = parametersFor(PROPOFOL_SCHNIDER_1998, patient);
    const solver = new CompartmentSolver(parameters);
    solver.bolus(280);
    solver.step(0);
    expect(Number.isFinite(solver.plasma)).toBe(true);
    expect(evaluateEnvelope(PROPOFOL_SCHNIDER_1998, patient).label).toBe('out-of-range');
  });
});

describe('Requirement: Initial Model Set Is Named And Cited', () => {
  it('gives every shipped model a resolvable citation', () => {
    for (const model of MODELS) {
      expect(model.citation.authors.length).toBeGreaterThan(3);
      expect(model.citation.year).toBeGreaterThan(1980);
      expect(model.citation.pmid ?? model.citation.doi, `${model.id} needs a PMID or DOI`).toBeDefined();
      expect(model.citation.locator.length).toBeGreaterThan(10);
      expect(model.citation.summary.length).toBeGreaterThan(40);
    }
  });

  it('Scenario: Model choice per patient is defensible', () => {
    const selection = selectDefaultModel('propofol', ADULT);
    expect(selection.model.id).toBe('propofol-eleveld-2018');
    expect(selection.reason).toContain('obesity');
    expect(selection.reason).toContain('old age');
  });

  it('Scenario: A parameter carries its transcription record', () => {
    for (const model of MODELS) {
      expect(model.transcription.primaryLocator.length).toBeGreaterThan(10);
      if (model.transcription.status === 'verified') {
        expect(model.transcription.secondSource).not.toBeNull();
        expect(model.transcription.checkedBy).not.toBeNull();
        expect(model.transcription.checkedOn).not.toBeNull();
      } else {
        // A model pending the independent check must say why, so the state is
        // visible rather than silent.
        expect(model.transcription.note, `${model.id} must explain why the check is outstanding`)
          .toBeTruthy();
      }
    }
  });

  it('Scenario: Unverified parameters are visible, not silent', () => {
    // A model pending its independent check can never be presented as Published.
    const result = evaluateEnvelope(PROPOFOL_ELEVELD_2018, ADULT);
    expect(result.pendingIndependentCheck).toBe(true);
  });

  it('carries a model-set revision that a transcript can record', () => {
    expect(MODEL_SET_REVISION).toMatch(/^\d{4}\.\d{2}\.\d+$/);
  });
});

describe('Requirement: Age-related minimum alveolar concentration', () => {
  it('reproduces the Nickalls and Mapleson iso-MAC relationship', () => {
    // MAC falls with age, so the SAME end-tidal concentration is a HIGHER
    // fraction of MAC in an older patient.
    expect(macForAge('sevoflurane', 40)).toBeCloseTo(1.80, 9);
    expect(macForAge('sevoflurane', 80)).toBeLessThan(macForAge('sevoflurane', 20));
    expect(macFraction('sevoflurane', 2.0, 80)).toBeGreaterThan(macFraction('sevoflurane', 2.0, 20));
    // A decade costs about 6% of MAC.
    expect(macForAge('sevoflurane', 50) / macForAge('sevoflurane', 40)).toBeCloseTo(Math.pow(10, -0.0269), 9);
  });

  it('Scenario: Nitrous oxide contributes to total MAC', () => {
    const without = totalMacFraction('sevoflurane', 1.5, 0, 40);
    const with60 = totalMacFraction('sevoflurane', 1.5, 60, 40);
    expect(with60.total).toBeGreaterThan(without.total);
    // Additive, and each agent's contribution is available separately.
    expect(with60.total).toBeCloseTo(with60.agent + with60.nitrousOxide, 12);
    expect(with60.agent).toBeCloseTo(without.agent, 12);
  });
});

describe('Property tests: invariants hold across randomized inputs', () => {
  const rng = createRng(31337, 'property');

  it('keeps compartment amounts non-negative for any non-negative dose history', () => {
    for (let trial = 0; trial < 40; trial += 1) {
      const patient: Covariates = {
        ageYears: rng.uniform(18, 90), weightKg: rng.uniform(45, 120),
        heightCm: rng.uniform(150, 195), sex: rng.next() < 0.5 ? 'male' : 'female',
      };
      const solver = new CompartmentSolver(parametersFor(PROPOFOL_ELEVELD_2018, patient));
      for (let step = 0; step < 3000; step += 1) {
        if (rng.next() < 0.002) solver.bolus(rng.uniform(0, 200));
        solver.step(rng.next() < 0.5 ? 0 : rng.uniform(0, 20));
        // Checked periodically rather than every step: an amount cannot go
        // negative and then recover, so sampling catches any violation.
        if (step % 25 !== 0) continue;
        for (const amount of solver.amounts) expect(amount).toBeGreaterThanOrEqual(-1e-12);
        expect(solver.effectSite).toBeGreaterThanOrEqual(-1e-12);
      }
    }
  });

  it('never lets effect-site exceed the running maximum plasma for a bolus-only history', () => {
    const solver = new CompartmentSolver(parametersFor(PROPOFOL_ELEVELD_2018, ADULT));
    let maxPlasma = 0;
    for (let step = 0; step < 12000; step += 1) {
      if (step % 3000 === 0) solver.bolus(100);
      solver.step(0);
      maxPlasma = Math.max(maxPlasma, solver.plasma);
      expect(solver.effectSite).toBeLessThanOrEqual(maxPlasma + 1e-9);
    }
  });

  it('keeps the Hill function monotone in concentration', () => {
    for (let trial = 0; trial < 200; trial += 1) {
      const ce50 = rng.uniform(0.5, 10);
      const gamma = rng.uniform(0.8, 4);
      const a = rng.uniform(0, 20);
      const b = a + rng.uniform(0, 20);
      expect(sigmoidEmax(b, ce50, gamma, gamma, 0, 100))
        .toBeGreaterThanOrEqual(sigmoidEmax(a, ce50, gamma, gamma, 0, 100) - 1e-12);
    }
  });
});

describe('Requirement: Context-Sensitive Decrement Time', () => {
  it('Scenario: remifentanil stays nearly flat with duration', () => {
    const parameters = parametersFor(REMIFENTANIL_MINTO_1997, ADULT);
    const short = contextSensitiveDecrementMinutes(parameters, 10, 0.5);
    const long = contextSensitiveDecrementMinutes(parameters, 240, 0.5);
    expect(long).toBeLessThan(short * 2.5);
    expect(short).toBeLessThan(20);
  });

  it('Scenario: accumulation lengthens offset for a long-context drug', () => {
    const parameters = parametersFor(PROPOFOL_ELEVELD_2018, ADULT);
    const short = contextSensitiveDecrementMinutes(parameters, 10, 0.5);
    const long = contextSensitiveDecrementMinutes(parameters, 240, 0.5);
    expect(long).toBeGreaterThan(short);
  });
});

describe('Requirement: the dependency graph is clean', () => {
  it('resolves every model from this repository with no external dataset', () => {
    expect(MODELS.length).toBeGreaterThanOrEqual(4);
    expect(getModel('propofol-eleveld-2018').drugId).toBe('propofol');
    expect(ELEVELD_PD.ce50Ref).toBe(3.08);
  });
});

describe('Requirement: Body Composition Is Continuous In Age', () => {
  it('Scenario: nothing changes discontinuously at a birthday', () => {
    // Al-Sallami's age scale asymptotes toward the adult prediction rather than
    // switching to it. Branching to Janmahasatian at 18 made a female patient's
    // fat-free mass drop 2.9% the instant she turned 18, and Eleveld's V3 and Q3
    // moved with it.
    for (const sex of ['male', 'female'] as const) {
      const before = fatFreeMassAlSallami2015({ ageYears: 17.999, weightKg: 60, heightCm: 165, sex });
      const after = fatFreeMassAlSallami2015({ ageYears: 18.001, weightKg: 60, heightCm: 165, sex });
      expect(Math.abs(after - before) / before, `${sex} fat-free mass steps at 18`).toBeLessThan(0.001);
    }
  });

  it('Scenario: the adult value stays close to the adult equation it asymptotes to', () => {
    for (const sex of ['male', 'female'] as const) {
      const covariates = { ageYears: 40, weightKg: 70, heightCm: 175, sex };
      const alSallami = fatFreeMassAlSallami2015(covariates);
      const janmahasatian = fatFreeMassJanmahasatian2005(covariates);
      expect(Math.abs(alSallami - janmahasatian) / janmahasatian).toBeLessThan(0.05);
    }
  });
});

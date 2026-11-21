import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '@anesthesia/scenarios';
import { MODELS_BY_ID } from '@anesthesia/pharmacology/registry';
import {
  authoredValues, bolusCurve, MAX_CURVES, parseSandboxQuery, sandboxCatalogue, sandboxCurves, sandboxQuery,
  sandboxStateProblem, suggestedScenario, type SandboxState,
} from '@anesthesia/sandbox/pharmacology-sandbox';

const catalogue = sandboxCatalogue(SCENARIOS);
const routine = SCENARIOS.find((scenario) => scenario.metadata.id === 'routine-induction')!;
const base: SandboxState = { modelId: 'propofol-eleveld-2018', patientId: 'routine-induction', dose: 100, minutes: 10 };

describe('the sandbox takes every input from the authored catalogue', () => {
  it('offers the lessons\' own patients, each once, naming every lesson that authored it', () => {
    const keys = catalogue.patients.map(({ covariates: c }) => `${c.ageYears}|${c.sex}|${c.heightCm}|${c.weightKg}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(catalogue.patients.flatMap((patient) => patient.scenarioIds).sort())
      .toEqual(SCENARIOS.map((scenario) => scenario.metadata.id).sort());
    expect(catalogue.patients.find((patient) => patient.id === 'routine-induction')?.covariates).toEqual({
      ageYears: routine.patient.ageYears, sex: routine.patient.sex,
      heightCm: routine.patient.heightCm, weightKg: routine.patient.weightKg,
    });
  });

  it('offers only absolute doses some lesson\'s formulary offers, in the model\'s own unit', () => {
    for (const [drug, doses] of Object.entries(catalogue.doses)) {
      expect(doses.length, drug).toBeGreaterThan(0);
      for (const dose of doses) {
        expect(SCENARIOS.some((scenario) => scenario.formulary.some((entry) => entry.drugId === drug
          && entry.presets.some((preset) => preset.amount === dose && !preset.unit.includes('/'))))).toBe(true);
      }
    }
  });

  it('refuses any value no lesson authored', () => {
    expect(sandboxStateProblem(catalogue, base)).toBeNull();
    expect(sandboxStateProblem(catalogue, { ...base, dose: 101 })).toMatch(/not a dose any lesson/);
    expect(sandboxStateProblem(catalogue, { ...base, patientId: 'someone-real' })).toMatch(/No authored patient/);
    expect(sandboxStateProblem(catalogue, { ...base, modelId: 'propofol-tci' })).toMatch(/No model/);
    expect(sandboxStateProblem(catalogue, { ...base, minutes: 7 })).toMatch(/not an offered duration/);
    const ages = authoredValues(catalogue, 'ageYears');
    expect(sandboxStateProblem(catalogue, { ...base, vary: { covariate: 'ageYears', values: [ages[0]!, 200] } }))
      .toMatch(/not a value any authored patient has/);
    expect(sandboxStateProblem(catalogue, { ...base, vary: { covariate: 'ageYears', values: [ages[0]!] } }))
      .toMatch(/2 to 4 values/);
    expect(sandboxStateProblem(catalogue, { ...base, vary: { covariate: 'ageYears', values: ages.slice(0, MAX_CURVES + 1) } }))
      .toMatch(/2 to 4 values/);
  });
});

describe('the curves', () => {
  it('start with the whole bolus in the central compartment and an empty effect site', () => {
    const model = MODELS_BY_ID.get('propofol-eleveld-2018')!;
    const curve = bolusCurve(model, catalogue.patients[0]!.covariates, 100, 10);
    const parameters = model.parameters(catalogue.patients[0]!.covariates);
    expect(curve.samples[0]!.plasma).toBeCloseTo(100 / parameters.v1, 6);
    expect(curve.samples[0]!.effectSite).toBe(0);
    expect(curve.samples).toHaveLength(10 * 6 + 1);
    // After a single bolus plasma only falls, and the effect site rises to a peak and then falls.
    for (let index = 1; index < curve.samples.length; index += 1) {
      expect(curve.samples[index]!.plasma).toBeLessThan(curve.samples[index - 1]!.plasma);
    }
    const effect = curve.samples.map((sample) => sample.effectSite!);
    const peak = effect.indexOf(Math.max(...effect));
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThan(effect.length - 1);
  });

  it('isolates one variable: the same bolus to older patients gives a higher early plasma peak under Schnider', () => {
    // The spec's own example: hold the dose and vary age. Schnider's V2 shrinks with age,
    // so less of the bolus redistributes and plasma stays higher.
    const ages = authoredValues(catalogue, 'ageYears').filter((age) => age >= 22);
    const values = [ages[0]!, ages.at(-1)!];
    const curves = sandboxCurves(catalogue, { ...base, modelId: 'propofol-schnider-1998', vary: { covariate: 'ageYears', values } });
    expect(curves).toHaveLength(2);
    expect(curves.map((curve) => curve.covariates.ageYears)).toEqual(values);
    expect(curves[1]!.samples[12]!.plasma).toBeGreaterThan(curves[0]!.samples[12]!.plasma);
    // Only the varied covariate moved.
    const { ageYears: _a, ...young } = curves[0]!.covariates;
    const { ageYears: _b, ...old } = curves[1]!.covariates;
    expect(young).toEqual(old);
  });

  it('draws an out-of-envelope curve and labels it out of range, as a scenario would', () => {
    const child = authoredValues(catalogue, 'ageYears')[0]!;
    expect(child).toBeLessThan(18);
    const [curve] = sandboxCurves(catalogue, { ...base, modelId: 'propofol-marsh-1991',
      vary: { covariate: 'ageYears', values: [child, 45] } });
    expect(curve!.envelope.label).toBe('out-of-range');
    expect(curve!.samples.length).toBeGreaterThan(0);
  });

  it('suggests the lesson where this pharmacology matters, preferring the patient\'s own', () => {
    expect(suggestedScenario(catalogue, base)).toBe('routine-induction');
    const remifentanil = catalogue.scenariosByDrug['remifentanil']!;
    expect(remifentanil).toContain(suggestedScenario(catalogue, { ...base, modelId: 'remifentanil-minto-1997', dose: 50 }));
  });
});

describe('a sandbox state as a link', () => {
  it('round-trips through the URL', () => {
    const state: SandboxState = { ...base, vary: { covariate: 'weightKg', values: authoredValues(catalogue, 'weightKg').slice(0, 3) } };
    expect(parseSandboxQuery(catalogue, sandboxQuery(state))).toEqual({ state });
    expect(parseSandboxQuery(catalogue, sandboxQuery(base))).toEqual({ state: base });
  });

  it('carries the inputs and nothing else: no transcript, progress or identifier', () => {
    const keys = [...new URLSearchParams(sandboxQuery({ ...base, vary: { covariate: 'ageYears', values: [45, 76] } })).keys()];
    expect(keys.sort()).toEqual(['dose', 'minutes', 'model', 'patient', 'vary']);
  });

  it('refuses rather than corrects a link it cannot honour', () => {
    expect(parseSandboxQuery(catalogue, `${sandboxQuery(base)}&transcript=abc`)).toEqual({
      problem: 'The link carries "transcript", which the sandbox does not read.' });
    expect(parseSandboxQuery(catalogue, sandboxQuery(base).replace('dose=100', 'dose=1e2'))).toHaveProperty('problem');
    expect(parseSandboxQuery(catalogue, `${sandboxQuery(base)}&vary=heightCm:170,180`)).toHaveProperty('problem');
    expect(parseSandboxQuery(catalogue, sandboxQuery(base).replace('dose=100', 'dose=5000'))).toHaveProperty('problem');
  });
});

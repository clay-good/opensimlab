/**
 * The pharmacology sandbox (learning/knowledge-layer → The Sandbox).
 *
 * The engine's drug models with no scenario, no crisis, no objectives and no
 * tutor: give one bolus to one patient and watch plasma and effect-site
 * concentration, or hold that bolus fixed and vary one covariate to see the
 * curves side by side.
 *
 * Three rules keep it inside the product's boundaries:
 *
 * - **Forward only.** A dose goes in and a curve comes out. Nothing here takes
 *   a concentration and returns a dose, and the architecture test that keeps
 *   inverse control out of the kernel imports this module too.
 * - **Authored inputs only.** Patients are the anaesthesia lessons' own patients,
 *   doses are the absolute doses those lessons' formularies offer, and a varied
 *   covariate takes only values some authored patient has. There is no free-text
 *   or free-number field, so nothing a person types can describe a real patient.
 * - **The envelope is shown, not hidden.** Every curve carries its model's
 *   envelope verdict for that patient, and an out-of-range curve is still drawn,
 *   labelled as such, exactly as it would be in a scenario.
 *
 * A sandbox state is addressable by URL, and the URL carries only the model,
 * the patient, the dose, the varied covariate and the duration.
 */
import { CompartmentSolver } from '@platform/kernel/compartments';
import type { Covariates } from '@anesthesia/pharmacology/body-composition';
import { evaluateEnvelope, type EnvelopeResult } from '@anesthesia/pharmacology/envelope';
import { MODELS, MODELS_BY_ID } from '@anesthesia/pharmacology/registry';
import type { PharmacologyModel } from '@anesthesia/pharmacology/types';
import type { Scenario } from '@anesthesia/scenarios/types';

/** One patient the sandbox can use: an anaesthesia lesson's own patient. */
export interface SandboxPatient {
  /** The id of the first lesson that authored this patient. */
  readonly id: string;
  readonly covariates: Covariates;
  /** Every lesson that authored exactly this patient, in catalogue order. */
  readonly scenarioIds: readonly string[];
}

export type VariedCovariate = 'ageYears' | 'weightKg';
export const VARIED_COVARIATES: readonly VariedCovariate[] = ['ageYears', 'weightKg'];
export const SANDBOX_MINUTES: readonly number[] = [5, 10, 20, 30];
/** More curves than this stop being readable on one axis. */
export const MAX_CURVES = 4;
/** Seconds between plotted samples. The solution is exact at each one. */
export const SAMPLE_SECONDS = 10;

export interface SandboxState {
  readonly modelId: string;
  readonly patientId: string;
  readonly dose: number;
  readonly minutes: number;
  /** Hold the dose and vary one covariate across these authored values. */
  readonly vary?: { readonly covariate: VariedCovariate; readonly values: readonly number[] };
}

export interface SandboxCurve {
  readonly covariates: Covariates;
  readonly envelope: EnvelopeResult;
  /** Minutes, and concentrations in the model's own unit; effect site is null where the model has none. */
  readonly samples: readonly { readonly minutes: number; readonly plasma: number; readonly effectSite: number | null }[];
}

export interface SandboxCatalogue {
  readonly patients: readonly SandboxPatient[];
  /** Absolute bolus doses the lessons' formularies offer, per drug, in the model's dose unit. */
  readonly doses: Readonly<Record<string, readonly number[]>>;
  /** For each drug, the lessons whose formulary carries it. */
  readonly scenariosByDrug: Readonly<Record<string, readonly string[]>>;
}

const patientKey = (covariates: Covariates) =>
  `${covariates.ageYears}|${covariates.sex}|${covariates.heightCm}|${covariates.weightKg}`;

/** Build the sandbox's choices from the scenario catalogue, which is where every input comes from. */
export function sandboxCatalogue(scenarios: readonly Scenario[]): SandboxCatalogue {
  const patients = new Map<string, { id: string; covariates: Covariates; scenarioIds: string[] }>();
  const doses: Record<string, Set<number>> = {};
  const scenariosByDrug: Record<string, string[]> = {};
  for (const scenario of scenarios) {
    const { ageYears, sex, heightCm, weightKg } = scenario.patient;
    const covariates: Covariates = { ageYears, sex, heightCm, weightKg };
    const key = patientKey(covariates);
    const existing = patients.get(key);
    if (existing) existing.scenarioIds.push(scenario.metadata.id);
    else patients.set(key, { id: scenario.metadata.id, covariates, scenarioIds: [scenario.metadata.id] });
    for (const entry of scenario.formulary) {
      const units = new Set(MODELS.filter((model) => model.drugId === entry.drugId).map((model) => model.doseUnit));
      if (units.size === 0) continue;
      (scenariosByDrug[entry.drugId] ??= []).push(scenario.metadata.id);
      for (const preset of entry.presets) {
        if (units.has(preset.unit) && preset.amount > 0) (doses[entry.drugId] ??= new Set()).add(preset.amount);
      }
    }
  }
  return {
    patients: [...patients.values()],
    doses: Object.fromEntries(Object.entries(doses).map(([drug, set]) => [drug, [...set].sort((a, b) => a - b)])),
    scenariosByDrug: Object.fromEntries(Object.entries(scenariosByDrug).map(([drug, ids]) => [drug, [...new Set(ids)]])),
  };
}

/** The values a covariate may take when varied: those some authored patient has. */
export function authoredValues(catalogue: SandboxCatalogue, covariate: VariedCovariate): readonly number[] {
  return [...new Set(catalogue.patients.map((patient) => patient.covariates[covariate]))].sort((a, b) => a - b);
}

/** Why a state cannot be drawn, or null when it can. */
export function sandboxStateProblem(catalogue: SandboxCatalogue, state: SandboxState): string | null {
  const model = MODELS_BY_ID.get(state.modelId);
  if (!model) return `No model "${state.modelId}".`;
  if (!catalogue.patients.some((patient) => patient.id === state.patientId)) return `No authored patient "${state.patientId}".`;
  if (!(catalogue.doses[model.drugId] ?? []).includes(state.dose)) {
    return `${String(state.dose)} ${model.doseUnit} is not a dose any lesson's formulary offers for ${model.drugName}.`;
  }
  if (!SANDBOX_MINUTES.includes(state.minutes)) return `${String(state.minutes)} minutes is not an offered duration.`;
  if (state.vary) {
    const allowed = authoredValues(catalogue, state.vary.covariate);
    if (state.vary.values.length < 2 || state.vary.values.length > MAX_CURVES) {
      return `Varying a covariate takes 2 to ${MAX_CURVES} values.`;
    }
    if (new Set(state.vary.values).size !== state.vary.values.length) return 'A varied value is repeated.';
    const outside = state.vary.values.find((value) => !allowed.includes(value));
    if (outside !== undefined) return `${String(outside)} is not a value any authored patient has.`;
  }
  return null;
}

/** Concentrations after one bolus at time zero, sampled every SAMPLE_SECONDS. */
export function bolusCurve(model: PharmacologyModel, covariates: Covariates, dose: number, minutes: number): SandboxCurve {
  const parameters = model.parameters(covariates);
  const step = SAMPLE_SECONDS / 60;
  const solver = new CompartmentSolver(parameters, step);
  const hasEffectSite = parameters.ke0 !== null;
  solver.bolus(dose);
  const samples: { minutes: number; plasma: number; effectSite: number | null }[] = [];
  const count = Math.round(minutes / step);
  for (let index = 0; index <= count; index += 1) {
    if (index > 0) solver.step(0);
    samples.push({ minutes: index * step, plasma: solver.plasma, effectSite: hasEffectSite ? solver.effectSite : null });
  }
  return { covariates, envelope: evaluateEnvelope(model, covariates), samples };
}

/** Every curve a valid state draws: one, or one per varied value with the dose held fixed. */
export function sandboxCurves(catalogue: SandboxCatalogue, state: SandboxState): readonly SandboxCurve[] {
  const problem = sandboxStateProblem(catalogue, state);
  if (problem) throw new Error(problem);
  const model = MODELS_BY_ID.get(state.modelId)!;
  const patient = catalogue.patients.find((candidate) => candidate.id === state.patientId)!;
  const variants = state.vary
    ? state.vary.values.map((value) => ({ ...patient.covariates, [state.vary!.covariate]: value }))
    : [patient.covariates];
  return variants.map((covariates) => bolusCurve(model, covariates, state.dose, state.minutes));
}

/**
 * The lesson where this pharmacology matters clinically: the patient's own
 * lesson if it gives this drug, otherwise the first lesson that does.
 */
export function suggestedScenario(catalogue: SandboxCatalogue, state: SandboxState): string | null {
  const model = MODELS_BY_ID.get(state.modelId);
  if (!model) return null;
  const withDrug = catalogue.scenariosByDrug[model.drugId] ?? [];
  const patient = catalogue.patients.find((candidate) => candidate.id === state.patientId);
  return patient?.scenarioIds.find((id) => withDrug.includes(id)) ?? withDrug[0] ?? null;
}

const QUERY_KEYS = ['model', 'patient', 'dose', 'minutes', 'vary'] as const;

/** The URL query for a state. It carries the inputs and nothing else. */
export function sandboxQuery(state: SandboxState): string {
  const params = new URLSearchParams({
    model: state.modelId, patient: state.patientId, dose: String(state.dose), minutes: String(state.minutes),
  });
  if (state.vary) params.set('vary', `${state.vary.covariate}:${state.vary.values.join(',')}`);
  return params.toString();
}

/**
 * Read a state from a URL query, strictly: an unknown key, a malformed number,
 * or a value no lesson authored is refused rather than corrected, so a link
 * either opens exactly what it says or says why it cannot.
 */
export function parseSandboxQuery(
  catalogue: SandboxCatalogue, query: string,
): { readonly state: SandboxState } | { readonly problem: string } {
  const params = new URLSearchParams(query);
  const unknown = [...params.keys()].find((key) => !(QUERY_KEYS as readonly string[]).includes(key));
  if (unknown !== undefined) return { problem: `The link carries "${unknown}", which the sandbox does not read.` };
  const number = (text: string | null) => (text !== null && /^\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN);
  const modelId = params.get('model') ?? '';
  const patientId = params.get('patient') ?? '';
  const dose = number(params.get('dose'));
  const minutes = number(params.get('minutes'));
  if (Number.isNaN(dose) || Number.isNaN(minutes)) return { problem: 'The link\'s dose or duration is not a number.' };
  let vary: SandboxState['vary'];
  const varied = params.get('vary');
  if (varied !== null) {
    const [covariate, list] = varied.split(':');
    if (!(VARIED_COVARIATES as readonly string[]).includes(covariate ?? '') || !list) {
      return { problem: 'The link varies something the sandbox cannot vary.' };
    }
    const values = list.split(',').map(number);
    if (values.some(Number.isNaN)) return { problem: 'A varied value in the link is not a number.' };
    vary = { covariate: covariate as VariedCovariate, values };
  }
  const state: SandboxState = { modelId, patientId, dose, minutes, ...(vary ? { vary } : {}) };
  const problem = sandboxStateProblem(catalogue, state);
  return problem ? { problem } : { state };
}

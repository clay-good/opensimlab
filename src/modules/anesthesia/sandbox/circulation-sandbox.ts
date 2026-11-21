/**
 * The circulation half of the sandbox's physiology (learning/knowledge-layer →
 * The Sandbox): the shared hemodynamic capability with three inputs exposed.
 *
 * Take one anaesthesia lesson's own patient, then at time zero dilate the
 * vessels, remove blood, or constrict them, and watch the baroreflex answer.
 * It is the engine's `stepHemodynamics`, stepped at the engine's tick, so the
 * teaching point it carries is the module's own: the same fall in pressure by a
 * different mechanism is compensated differently, and a patient whose stroke
 * volume cannot rise compensates worse.
 *
 * The label beside each input is not asserted here. It is read from the
 * engine's own influence records, which mark each term `teachingModel` or not,
 * so the sandbox can never call a term better grounded than the engine does.
 */
import {
  baselineSvr, cardiacOutput, meanArterialPressure, stepHemodynamics,
  type HemodynamicDrive, type HemodynamicProfile, type HemodynamicState,
} from '@anesthesia/physiology/hemodynamics';
import type { Scenario } from '@anesthesia/scenarios/types';

export const VASODILATION_LEVELS: readonly number[] = [0, 0.5, 1];
export const BLOOD_LOSS_PERCENT: readonly number[] = [0, 10, 20, 30];
export const VASOPRESSOR_LEVELS: readonly number[] = [0, 0.5, 1];
export const CIRCULATION_MINUTES: readonly number[] = [2, 5, 10];
const TICKS_PER_MINUTE = 600;
const SAMPLE_EVERY_TICKS = 20; // 2 s

export type CirculationInput = 'vasodilation' | 'blood-loss' | 'vasopressor';
/** The engine term each input drives, by the id the engine reports it under. */
export const INPUT_TERMS: Readonly<Record<CirculationInput, string>> = {
  vasodilation: 'propofol-vasodilation',
  'blood-loss': 'hypovolemia',
  vasopressor: 'vasopressor',
};

export interface CirculationState {
  /** The lesson whose authored patient baseline is used. */
  readonly scenarioId: string;
  /** Fraction of the engine's maximal propofol vasodilation. */
  readonly vasodilation: number;
  readonly bloodLossPercent: number;
  /** Fraction of the engine's maximal vasopressor effect. */
  readonly vasopressor: number;
  readonly minutes: number;
}

export interface CirculationSample {
  readonly minutes: number;
  readonly meanArterialMmHg: number;
  readonly heartRateBpm: number;
  readonly strokeVolumeMl: number;
  readonly cardiacOutputLPerMin: number;
}

export interface CirculationRun {
  readonly samples: readonly CirculationSample[];
  /** Whether the engine marks each input's term as a teaching model; absent where the input is off. */
  readonly teaching: Partial<Record<CirculationInput, boolean>>;
}

export function profileFor(scenario: Scenario): HemodynamicProfile {
  const baseline = scenario.patient.baseline;
  return {
    baselineHeartRateBpm: baseline.heartRateBpm, baselineMapMmHg: baseline.meanArterialMmHg,
    baselineStrokeVolumeMl: baseline.strokeVolumeMl, arterialStiffness: baseline.arterialStiffness,
    fixedStrokeVolume: baseline.fixedStrokeVolume, baroreflexGain: baseline.baroreflexGain,
    bloodVolumeMl: baseline.bloodVolumeMl, hemoglobinGPerDl: baseline.hemoglobinGPerDl,
  };
}

export function circulationStateProblem(scenarios: readonly Scenario[], state: CirculationState): string | null {
  if (!scenarios.some((scenario) => scenario.metadata.id === state.scenarioId)) return `No lesson "${state.scenarioId}".`;
  if (!VASODILATION_LEVELS.includes(state.vasodilation)) return `${String(state.vasodilation)} is not an offered vasodilation.`;
  if (!BLOOD_LOSS_PERCENT.includes(state.bloodLossPercent)) return `${String(state.bloodLossPercent)}% is not an offered blood loss.`;
  if (!VASOPRESSOR_LEVELS.includes(state.vasopressor)) return `${String(state.vasopressor)} is not an offered vasopressor effect.`;
  if (!CIRCULATION_MINUTES.includes(state.minutes)) return `${String(state.minutes)} minutes is not an offered duration.`;
  return null;
}

export function runCirculation(scenarios: readonly Scenario[], state: CirculationState): CirculationRun {
  const problem = circulationStateProblem(scenarios, state);
  if (problem) throw new Error(problem);
  const profile = profileFor(scenarios.find((scenario) => scenario.metadata.id === state.scenarioId)!);
  const hemodynamics: HemodynamicState = {
    heartRateBpm: profile.baselineHeartRateBpm,
    strokeVolumeMl: profile.baselineStrokeVolumeMl,
    svrDynSCm5: baselineSvr(profile),
    // The loss happens at time zero, all at once: the point is the reflex, not the bleed.
    bloodVolumeMl: profile.bloodVolumeMl * (1 - state.bloodLossPercent / 100),
  };
  // Everything not exposed is held at rest. The baroreflex is not blunted by
  // anaesthetic depth here, which the page says, because coupling it silently to
  // the vasodilation input would make that input two things at once.
  const drive: HemodynamicDrive = {
    propofolVasodilation: state.vasodilation, propofolDepression: 0, opioidEffect: 0, surgicalStimulus: 0,
    anesthesiaDepthFraction: 0, vasopressorEffect: state.vasopressor, positivePressure: false,
    saturationPercent: 98, volatileMacFraction: 0,
  };
  const step = 1 / TICKS_PER_MINUTE;
  const teaching: Partial<Record<CirculationInput, boolean>> = {};
  const sample = (minutes: number, map: number): CirculationSample => ({
    minutes, meanArterialMmHg: map, heartRateBpm: hemodynamics.heartRateBpm, strokeVolumeMl: hemodynamics.strokeVolumeMl,
    cardiacOutputLPerMin: cardiacOutput(hemodynamics.heartRateBpm, hemodynamics.strokeVolumeMl),
  });
  const samples: CirculationSample[] = [sample(0, meanArterialPressure(
    cardiacOutput(hemodynamics.heartRateBpm, hemodynamics.strokeVolumeMl), hemodynamics.svrDynSCm5))];
  for (let tick = 1; tick <= state.minutes * TICKS_PER_MINUTE; tick += 1) {
    const result = stepHemodynamics(hemodynamics, profile, drive, step);
    for (const [input, term] of Object.entries(INPUT_TERMS) as [CirculationInput, string][]) {
      const influence = result.influences.find((candidate) => candidate.termId === term);
      if (influence) teaching[input] = influence.teachingModel;
    }
    if (tick % SAMPLE_EVERY_TICKS === 0) samples.push(sample(tick * step, result.meanArterialMmHg));
  }
  return { samples, teaching };
}

const CIRCULATION_KEYS = ['view', 'lesson', 'vasodilation', 'loss', 'vasopressor', 'minutes'] as const;

/** The URL query for a circulation state: `view=circulation` and the inputs, nothing else. */
export function circulationQuery(state: CirculationState): string {
  return new URLSearchParams({
    view: 'circulation', lesson: state.scenarioId, vasodilation: String(state.vasodilation),
    loss: String(state.bloodLossPercent), vasopressor: String(state.vasopressor), minutes: String(state.minutes),
  }).toString();
}

/** Read a circulation state strictly: refuse rather than correct. */
export function parseCirculationQuery(
  scenarios: readonly Scenario[], query: string,
): { readonly state: CirculationState } | { readonly problem: string } {
  const params = new URLSearchParams(query);
  const unknown = [...params.keys()].find((key) => !(CIRCULATION_KEYS as readonly string[]).includes(key));
  if (unknown !== undefined) return { problem: `The link carries "${unknown}", which the sandbox does not read.` };
  const number = (text: string | null) => (text !== null && /^\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN);
  const state: CirculationState = {
    scenarioId: params.get('lesson') ?? '', vasodilation: number(params.get('vasodilation')),
    bloodLossPercent: number(params.get('loss')), vasopressor: number(params.get('vasopressor')),
    minutes: number(params.get('minutes')),
  };
  const problem = circulationStateProblem(scenarios, state);
  return problem ? { problem } : { state };
}

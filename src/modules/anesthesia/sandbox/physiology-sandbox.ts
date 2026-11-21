/**
 * The physiology half of the sandbox (learning/knowledge-layer → The Sandbox):
 * the shared respiratory capability with its inputs exposed.
 *
 * Breathe a chosen inspired oxygen for three minutes, then switch to a chosen
 * pattern - apnoea, the profile's own breathing, or the same rate at half the tidal volume - and watch
 * saturation and arterial oxygen tension fall or hold. It is the same gas
 * exchange code the lessons run, stepped at the engine's own 0.1 s tick, with
 * the preoxygenation `timeToDesaturationMinutes` uses, so the healthy adult's
 * apnoea here is the Benumof benchmark the physiology test already holds.
 *
 * Each input says what it drives: a model held to a published result, or a
 * teaching calibration. Forward only, like the pharmacology half, and every
 * value is one the respiratory capability already declares.
 */
import {
  initialGasState, RESPIRATORY_PROFILES, stepGas, type VentilationInput,
} from '@anesthesia/physiology/respiratory';

export type RespiratoryProfileId = keyof typeof RESPIRATORY_PROFILES;
export type BreathingPattern = 'apnea' | 'spontaneous' | 'half-tidal-volume';
export type InputBasis = 'published' | 'teaching';

export const PROFILE_IDS = Object.keys(RESPIRATORY_PROFILES) as RespiratoryProfileId[];
export const PREOXYGENATION_FIO2: readonly number[] = [0.21, 0.4, 0.6, 1];
export const BREATHING_PATTERNS: readonly BreathingPattern[] = ['apnea', 'spontaneous', 'half-tidal-volume'];
export const PHYSIOLOGY_MINUTES: readonly number[] = [5, 10, 20];
/** Minutes of tidal breathing on the chosen fraction before the pattern starts. */
export const PREOXYGENATION_MINUTES = 3;
const TICKS_PER_MINUTE = 600;
const SAMPLE_EVERY_TICKS = 50; // 5 s
/**
 * Where a run stops. The model is held to the time to 90%; carried on, it
 * drives saturation and oxygen tension to zero in a patient whose circulation
 * it never lets fail, which is a course nobody should learn. Below this the
 * sandbox says it stopped rather than drawing it.
 */
export const STOP_BELOW_SATURATION = 50;

/**
 * What each choice drives. Published means the model is held to a published
 * result for it: Benumof, Dagg and Benumof 1997 (PMID 9357902) for apnoea in the
 * three profiles it states, the alveolar gas equation for inspired oxygen.
 * Teaching means a calibration written here.
 */
export const PROFILE_BASIS: Readonly<Record<RespiratoryProfileId, InputBasis>> = {
  healthy: 'published', 'moderately-ill': 'published', obese: 'published', 'term-pregnancy': 'teaching',
};
export const PATTERN_BASIS: Readonly<Record<BreathingPattern, InputBasis>> = {
  // Apnoea is the benchmarked case; ventilation runs through the carbon dioxide
  // store, whose coefficient is a teaching calibration (respiratory.ts).
  apnea: 'published', spontaneous: 'teaching', 'half-tidal-volume': 'teaching',
};
export const FIO2_BASIS: InputBasis = 'published';

export interface PhysiologyState {
  readonly profile: RespiratoryProfileId;
  readonly fio2: number;
  readonly pattern: BreathingPattern;
  readonly minutes: number;
}

export interface PhysiologySample {
  /** Minutes since the pattern started; preoxygenation is before zero. */
  readonly minutes: number;
  readonly spo2Percent: number;
  readonly pao2MmHg: number;
  readonly paco2MmHg: number;
}

export interface PhysiologyRun {
  readonly samples: readonly PhysiologySample[];
  /** Minutes after the pattern started until saturation reached 90%, or null if it did not. */
  readonly minutesTo90: number | null;
  /** Minutes at which the run stopped because saturation fell below STOP_BELOW_SATURATION, or null. */
  readonly stoppedAt: number | null;
}

export function physiologyStateProblem(state: PhysiologyState): string | null {
  if (!PROFILE_IDS.includes(state.profile)) return `No respiratory profile "${state.profile}".`;
  if (!PREOXYGENATION_FIO2.includes(state.fio2)) return `${String(state.fio2)} is not an offered inspired oxygen fraction.`;
  if (!BREATHING_PATTERNS.includes(state.pattern)) return `No breathing pattern "${state.pattern}".`;
  if (!PHYSIOLOGY_MINUTES.includes(state.minutes)) return `${String(state.minutes)} minutes is not an offered duration.`;
  return null;
}

export function runPhysiology(state: PhysiologyState): PhysiologyRun {
  const problem = physiologyStateProblem(state);
  if (problem) throw new Error(problem);
  const profile = RESPIRATORY_PROFILES[state.profile];
  const gas = initialGasState(profile, state.fio2);
  const step = 1 / TICKS_PER_MINUTE;
  const base: Omit<VentilationInput, 'tidalVolumeMl' | 'respiratoryRateBpm'> = {
    fio2: state.fio2, cardiacOutputRatio: 1, obstructionFraction: 0, hemoglobinGPerDl: 15, bloodVolumeMl: 5000,
  };
  // The same preoxygenation timeToDesaturationMinutes uses, so the benchmark carries over.
  for (let i = 0; i < PREOXYGENATION_MINUTES * TICKS_PER_MINUTE; i += 1) {
    stepGas(gas, { ...base, tidalVolumeMl: 500, respiratoryRateBpm: 12 }, profile, step);
  }
  const rate = state.pattern === 'apnea' ? 0 : profile.spontaneousRespiratoryRateBpm;
  const tidal = state.pattern === 'apnea' ? 0
    : state.pattern === 'spontaneous' ? profile.spontaneousTidalVolumeMl : profile.spontaneousTidalVolumeMl / 2;
  const samples: PhysiologySample[] = [];
  let minutesTo90: number | null = null;
  for (let tick = 1; tick <= state.minutes * TICKS_PER_MINUTE; tick += 1) {
    const result = stepGas(gas, { ...base, tidalVolumeMl: tidal, respiratoryRateBpm: rate }, profile, step);
    if (minutesTo90 === null && result.spo2Percent <= 90) minutesTo90 = tick * step;
    const sample = { minutes: tick * step, spo2Percent: result.spo2Percent,
      pao2MmHg: result.pao2MmHg, paco2MmHg: result.paco2MmHg };
    if (result.spo2Percent < STOP_BELOW_SATURATION) {
      samples.push(sample);
      return { samples, minutesTo90, stoppedAt: tick * step };
    }
    if (tick % SAMPLE_EVERY_TICKS === 0 || tick === 1) samples.push(sample);
  }
  return { samples, minutesTo90, stoppedAt: null };
}

const PHYSIOLOGY_KEYS = ['view', 'profile', 'fio2', 'pattern', 'minutes'] as const;

/** The URL query for a physiology state: `view=physiology` and the inputs, nothing else. */
export function physiologyQuery(state: PhysiologyState): string {
  return new URLSearchParams({
    view: 'physiology', profile: state.profile, fio2: String(state.fio2), pattern: state.pattern, minutes: String(state.minutes),
  }).toString();
}

/** Read a physiology state strictly, as the pharmacology half does: refuse rather than correct. */
export function parsePhysiologyQuery(query: string): { readonly state: PhysiologyState } | { readonly problem: string } {
  const params = new URLSearchParams(query);
  const unknown = [...params.keys()].find((key) => !(PHYSIOLOGY_KEYS as readonly string[]).includes(key));
  if (unknown !== undefined) return { problem: `The link carries "${unknown}", which the sandbox does not read.` };
  const number = (text: string | null) => (text !== null && /^\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN);
  const state: PhysiologyState = {
    profile: (params.get('profile') ?? '') as RespiratoryProfileId,
    fio2: number(params.get('fio2')),
    pattern: (params.get('pattern') ?? '') as BreathingPattern,
    minutes: number(params.get('minutes')),
  };
  const problem = physiologyStateProblem(state);
  return problem ? { problem } : { state };
}

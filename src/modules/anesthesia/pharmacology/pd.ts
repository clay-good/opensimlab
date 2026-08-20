/**
 * Concentration-to-effect mapping (engine/pkpd-core → Sigmoid Emax
 * Pharmacodynamics, Drug Interaction Response Surface).
 */

import type { Covariates } from './body-composition';
import type { PdDeclaration } from './types';

/**
 * The sigmoidal Emax relationship
 *
 *   Effect(Ce) = E0 + (Emax - E0) * Ce^gamma / (Ce50^gamma + Ce^gamma)
 *
 * Models that publish asymmetric slopes apply the appropriate gamma on each side
 * of Ce50. The two branches meet exactly at Ce50, where both reduce to the
 * midpoint, so the function is continuous there regardless of the slopes.
 */
export function sigmoidEmax(
  ce: number,
  ce50: number,
  gammaLow: number,
  gammaHigh: number,
  e0: number,
  eMax: number,
): number {
  const concentration = Math.max(ce, 0);
  if (concentration === 0) return e0;
  const gamma = concentration < ce50 ? gammaLow : gammaHigh;
  const ratio = Math.pow(concentration / ce50, gamma);
  return e0 + (eMax - e0) * (ratio / (1 + ratio));
}

/** Evaluate a model's declared pharmacodynamics for a patient. */
export function evaluatePd(pd: PdDeclaration, covariates: Covariates, ce: number): number {
  return sigmoidEmax(ce, pd.ce50(covariates), pd.gammaLow, pd.gammaHigh, pd.e0, pd.eMax);
}

/**
 * Normalized drug effect, 0 to 1, used as the input to the interaction surface.
 * This is the drug's own effect expressed as a fraction of its maximum, which is
 * what a response-surface model composes.
 */
export function normalizedEffect(ce: number, ce50: number, gamma: number): number {
  const concentration = Math.max(ce, 0);
  if (concentration === 0) return 0;
  const ratio = Math.pow(concentration / ce50, gamma);
  return ratio / (1 + ratio);
}

/**
 * The propofol-remifentanil response surface.
 *
 * Hypnotic-opioid synergy is modelled with a published response-surface form,
 * never by summing independent effects. This is the Greco-style interaction term
 * applied to the normalized potencies:
 *
 *   U_prop = Ce_prop / Ce50_prop
 *   U_remi = Ce_remi / Ce50_remi
 *   U      = U_prop + U_remi + alpha * U_prop * U_remi
 *   Effect = U^gamma / (1 + U^gamma)
 *
 * The cross term `alpha` is what makes the combination supra-additive. With
 * alpha = 0 the surface reduces to simple additivity; with remifentanil at zero
 * it reduces EXACTLY to the standalone propofol curve, which is the property the
 * specification requires and which the tests assert to 1e-9.
 *
 * PROVENANCE, STATED PRECISELY. The Greco interaction FORM above is the published
 * one used throughout the hypnotic-opioid response-surface literature. The two
 * numbers that are NOT transcribed from a paper are `remifentanilCe50Hypnotic`
 * and `alpha`: remifentanil has no hypnotic effect of its own at clinical
 * concentrations, so neither is a potency for producing hypnosis. They are an
 * Open Sim Lab calibration, chosen so that the surface reproduces the clinically
 * observed magnitude of the interaction:
 *
 *   at a remifentanil effect-site concentration of 4 ng/mL, the propofol
 *   concentration needed for the same depth falls by about a third.
 *
 * Solving the Greco form for that condition gives alpha near 0.9, which is the
 * value used. This calibration is recorded in the limitations register and every
 * number it drives carries the teaching-model marker.
 */
export interface ResponseSurfaceParameters {
  /** Propofol Ce50 for the depth endpoint, µg/mL. */
  readonly propofolCe50: number;
  /** Remifentanil scale over which it potentiates hypnosis, ng/mL. */
  readonly remifentanilCe50Hypnotic: number;
  /** Steepness of the combined surface. */
  readonly gamma: number;
  /** Interaction coefficient. Greater than zero is synergy. */
  readonly alpha: number;
  readonly e0: number;
  readonly eMax: number;
}

export const PROPOFOL_REMIFENTANIL_SURFACE: ResponseSurfaceParameters = {
  propofolCe50: 3.08,
  remifentanilCe50Hypnotic: 18.0,
  gamma: 1.47,
  alpha: 0.9,
  e0: 93,
  eMax: 0,
};

/** Combined normalized potency U, before the sigmoid. */
export function combinedPotency(
  propofolCe: number,
  remifentanilCe: number,
  parameters: ResponseSurfaceParameters,
): number {
  const uProp = Math.max(propofolCe, 0) / parameters.propofolCe50;
  const uRemi = Math.max(remifentanilCe, 0) / parameters.remifentanilCe50Hypnotic;
  return uProp + uRemi + parameters.alpha * uProp * uRemi;
}

/** The predicted depth index from the combined surface. */
export function responseSurfaceEffect(
  propofolCe: number,
  remifentanilCe: number,
  parameters: ResponseSurfaceParameters = PROPOFOL_REMIFENTANIL_SURFACE,
): number {
  const u = combinedPotency(propofolCe, remifentanilCe, parameters);
  if (u === 0) return parameters.e0;
  const ratio = Math.pow(u, parameters.gamma);
  return parameters.e0 + (parameters.eMax - parameters.e0) * (ratio / (1 + ratio));
}

/**
 * The effect predicted by simple addition of each drug's isolated effect, used
 * only to demonstrate that the surface exceeds additivity. It is never used to
 * drive the simulation.
 */
export function additiveEffect(
  propofolCe: number,
  remifentanilCe: number,
  parameters: ResponseSurfaceParameters = PROPOFOL_REMIFENTANIL_SURFACE,
): number {
  const alone = { ...parameters, alpha: 0 };
  const propofolOnly = parameters.e0 - responseSurfaceEffect(propofolCe, 0, alone);
  const remifentanilOnly = parameters.e0 - responseSurfaceEffect(0, remifentanilCe, alone);
  return parameters.e0 - (propofolOnly + remifentanilOnly);
}

/**
 * Age-related minimum alveolar concentration, by the iso-MAC relationship of
 * Nickalls and Mapleson (*Br J Anaesth* 2003;91:170-4):
 *
 *   MAC(age) = MAC40 * 10^(-0.00269 * (age - 40))
 *
 * where MAC40 is the agent's minimum alveolar concentration at 40 years.
 */
export const MAC_AGE_EXPONENT = -0.00269;

/** MAC at 40 years, in volumes percent, per agent. */
export const MAC_40: Record<'sevoflurane' | 'isoflurane' | 'desflurane', number> = {
  sevoflurane: 1.80,
  isoflurane: 1.17,
  desflurane: 6.6,
};

export function macForAge(agent: keyof typeof MAC_40, ageYears: number): number {
  return MAC_40[agent] * Math.pow(10, MAC_AGE_EXPONENT * (ageYears - 40));
}

/**
 * The age-adjusted MAC fraction for a measured end-tidal concentration. Because
 * MAC falls with age, the SAME end-tidal concentration is a HIGHER fraction of
 * MAC in an older patient.
 */
export function macFraction(agent: keyof typeof MAC_40, endTidalPercent: number, ageYears: number): number {
  return endTidalPercent / macForAge(agent, ageYears);
}

/**
 * Nitrous oxide contributes additively to the total MAC fraction, as the iso-MAC
 * charts describe. Its own MAC is about 104 volumes percent in adults.
 */
export const NITROUS_OXIDE_MAC_PERCENT = 104;

export function totalMacFraction(
  agent: keyof typeof MAC_40,
  endTidalPercent: number,
  nitrousOxidePercent: number,
  ageYears: number,
): { agent: number; nitrousOxide: number; total: number } {
  const agentFraction = macFraction(agent, endTidalPercent, ageYears);
  const nitrousFraction = nitrousOxidePercent / NITROUS_OXIDE_MAC_PERCENT;
  return { agent: agentFraction, nitrousOxide: nitrousFraction, total: agentFraction + nitrousFraction };
}

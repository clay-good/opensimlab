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
 * and `alpha`. They are an Open Sim Lab calibration, chosen so that the surface
 * reproduces the clinically observed magnitude of the interaction:
 *
 *   at a remifentanil effect-site concentration of 4 ng/mL, the propofol
 *   concentration needed for the same depth falls by about a third.
 *
 * Solving the Greco form for that condition gives alpha near 0.9, which is the
 * value used. This calibration is recorded in the limitations register and every
 * number it drives carries the teaching-model marker.
 *
 * WHAT THIS FORM IMPLIES, SAID OUT LOUD. The Greco U₂ term necessarily gives
 * remifentanil a hypnotic effect of its own: at 8 ng/mL alone this surface
 * predicts a depth index around 71, a drop of about twenty points. Clinically,
 * remifentanil alone is a poor hypnotic and does not reliably produce
 * unconsciousness at those concentrations, so the surface OVERSTATES what the
 * opioid does by itself. `remifentanilCe50Hypnotic` is deliberately large (18
 * ng/mL, far above the clinical range) to keep that overstatement small where
 * learners work, but it is not zero and this file will not pretend it is. The
 * limitations register carries it under `opioid-alone-hypnosis`.
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

/**
 * The MAC fraction at which the depth index sits at its own midpoint.
 *
 * This is the anchor that lets a volatile enter the same normalized-potency
 * units as propofol, and it has to be an anchor for the SAME endpoint the
 * surface describes. Two candidates are wrong for that:
 *
 *  - MAC itself is an EC50 for MOVEMENT, not for hypnosis.
 *  - MAC-awake, about 0.34, is an EC50 for RESPONSE TO COMMAND. Using it put the
 *    index at 30 for half a MAC — a patient sedated to a whisper of agent
 *    reported as deeply anaesthetised.
 *
 * The surface's propofol partner is Eleveld's Ce50 for the depth index itself,
 * so the volatile's denominator must be the MAC fraction giving the same
 * half-maximal index, which is about one MAC: processed-EEG indices sit in the
 * mid-forties at 1.0 MAC sevoflurane, near 65 at 0.5 MAC and in the twenties at
 * 2 MAC, and this value reproduces all three.
 *
 * Mapleson 1996 gives the age relation for MAC, applied to the
 * denominator before this fraction is taken, so an older patient reaches the
 * same normalized potency at a lower end-tidal concentration.
 */
export const VOLATILE_DEPTH_MAC_50 = 0.95;

/**
 * Combined normalized potency U, before the sigmoid.
 *
 * `volatileMacFraction` enters ADDITIVELY. A volatile and an intravenous
 * hypnotic are additive for the hypnotic endpoint to a good approximation, and
 * the synergy term stays where it is established — between the hypnotic and the
 * opioid. Treating the volatile as a third synergistic partner would be
 * inventing an interaction to make a number move.
 */
export function combinedPotency(
  propofolCe: number,
  remifentanilCe: number,
  parameters: ResponseSurfaceParameters,
  volatileMacFraction = 0,
): number {
  const uProp = Math.max(propofolCe, 0) / parameters.propofolCe50;
  const uRemi = Math.max(remifentanilCe, 0) / parameters.remifentanilCe50Hypnotic;
  const uVol = Math.max(volatileMacFraction, 0) / VOLATILE_DEPTH_MAC_50;
  return uProp + uRemi + uVol + parameters.alpha * uProp * uRemi;
}

/** The predicted depth index from the combined surface. */
export function responseSurfaceEffect(
  propofolCe: number,
  remifentanilCe: number,
  parameters: ResponseSurfaceParameters = PROPOFOL_REMIFENTANIL_SURFACE,
  volatileMacFraction = 0,
): number {
  const u = combinedPotency(propofolCe, remifentanilCe, parameters, volatileMacFraction);
  if (u === 0) return parameters.e0;
  const ratio = Math.pow(u, parameters.gamma);
  return parameters.e0 + (parameters.eMax - parameters.e0) * (ratio / (1 + ratio));
}

/**
 * The effect predicted by ADDITIVITY, used only to demonstrate that the surface
 * exceeds it. It is never used to drive the simulation.
 *
 * Additivity here means LOEWE additivity — the zero-interaction case of the very
 * model being tested, `alpha = 0`, where the two drugs behave as dilutions of one
 * another. That is the comparator the Greco interaction coefficient is defined
 * against, so it is the only one against which "alpha > 0 means synergy" is a
 * meaningful statement.
 *
 * It is NOT the sum of the two isolated effects. Summing effects is Bliss-style
 * independence, it is not what alpha measures, and on a bounded sigmoid it breaks
 * down badly: two drugs each producing a 50-point drop would sum to a 100-point
 * drop and predict a NEGATIVE depth index. An earlier version of this function
 * did exactly that, and the single test point it was checked at happened to sit
 * in the narrow region where the sign still came out right.
 */
export function additiveEffect(
  propofolCe: number,
  remifentanilCe: number,
  parameters: ResponseSurfaceParameters = PROPOFOL_REMIFENTANIL_SURFACE,
): number {
  return responseSurfaceEffect(propofolCe, remifentanilCe, { ...parameters, alpha: 0 });
}

/**
 * Age-related minimum alveolar concentration:
 *
 *   MAC(age) = MAC40 * 10^(-0.00269 * (age - 40))
 *
 * where MAC40 is the agent's minimum alveolar concentration at 40 years.
 *
 * PROVENANCE. The equation, this exponent and every MAC40 value below are from
 * Mapleson WW, *Effect of age on MAC in humans: a meta-analysis*, Br J Anaesth
 * 1996;76:179-85 (PMID 8777094), which states them directly: "b = -0.00269 (95%
 * confidence limits -0.0030, -0.0024) and a = MAC at age 40 yr, which... is
 * given by: halothane, 0.75%; isoflurane, 1.17%; enflurane, 1.63%; sevoflurane,
 * 1.80%; desflurane 6.6%; nitrous oxide, 104%".
 *
 * These used to be attributed to Nickalls and Mapleson 2003. That paper is the
 * iso-MAC CHARTS built on this relation, not its source, and a reader checking
 * the numbers against it would not have found them. The charts are still the
 * right citation for the clinical application and are cited as such.
 *
 * The published 95% confidence limits on the exponent are ±0.0003, which over
 * the 40-year span from a 40-year-old to an 80-year-old is about ±3% on MAC —
 * small enough that the age adjustment is worth making and large enough that it
 * is not worth reading to three figures.
 */
export const MAC_AGE_EXPONENT = -0.00269;

/** The published 95% confidence limits on the age exponent (Mapleson 1996). */
export const MAC_AGE_EXPONENT_CL = [-0.0030, -0.0024] as const;

/** MAC at 40 years, in volumes percent, per agent (Mapleson 1996, Table). */
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
 * charts describe. Its MAC at 40 years is 104 volumes percent (Mapleson 1996).
 *
 * It ages like every other agent, and that is the paper's own finding rather
 * than an extrapolation: Mapleson reports log10 MAC decreasing with age "at the
 * same rate for all inhaled anaesthetics" and lists nitrous oxide in the same
 * table as the volatiles. Treating its MAC as a fixed 104 under-reads its
 * contribution in exactly the patients where that matters most: at 80 years its
 * MAC is 81 volumes percent, so 50% nitrous is 0.62 MAC, not the 0.48 a fixed
 * denominator reports.
 */
export const NITROUS_OXIDE_MAC_40_PERCENT = 104;

/** Age-adjusted nitrous oxide MAC, by the same relationship as the volatiles. */
export function nitrousOxideMacForAge(ageYears: number): number {
  return NITROUS_OXIDE_MAC_40_PERCENT * Math.pow(10, MAC_AGE_EXPONENT * (ageYears - 40));
}

export function totalMacFraction(
  agent: keyof typeof MAC_40,
  endTidalPercent: number,
  nitrousOxidePercent: number,
  ageYears: number,
): { agent: number; nitrousOxide: number; total: number } {
  const agentFraction = macFraction(agent, endTidalPercent, ageYears);
  const nitrousFraction = nitrousOxidePercent / nitrousOxideMacForAge(ageYears);
  return { agent: agentFraction, nitrousOxide: nitrousFraction, total: agentFraction + nitrousFraction };
}

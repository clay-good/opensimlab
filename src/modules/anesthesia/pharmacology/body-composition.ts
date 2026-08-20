/**
 * The shared body-composition equations, implemented ONCE and reused
 * (engine/pkpd-core → A shared body-composition equation has one implementation).
 *
 * Every model that needs lean body mass or fat-free mass calls these. There is no
 * second definition anywhere in the repository, which `tests/unit/pharmacology.test.ts`
 * asserts.
 */

import { MissingCovariate } from '@platform/kernel/errors';

/** The covariates a patient supplies. Nothing here identifies a real person. */
export interface Covariates {
  /** Years. */
  readonly ageYears: number;
  /** Kilograms, total body weight. */
  readonly weightKg: number;
  /** Centimetres. */
  readonly heightCm: number;
  readonly sex: 'male' | 'female';
  /** Post-menstrual age in weeks. Required only by models with a maturation term. */
  readonly postMenstrualAgeWeeks?: number;
  /** True when an opioid is co-administered; some models carry an opiates term. */
  readonly opioidsCoadministered?: boolean;
}

/** Body mass index, kg/m². Derived, never stored. */
export function bodyMassIndex(covariates: Covariates): number {
  const metres = covariates.heightCm / 100;
  return covariates.weightKg / (metres * metres);
}

/**
 * Lean body mass by James 1976, in kilograms.
 *
 * James WPT. Research on Obesity: A Report of the DHSS/MRC Group. London: HMSO, 1976.
 *
 *   male:   LBM = 1.1 * W - 128 * (W / H)^2
 *   female: LBM = 1.07 * W - 148 * (W / H)^2
 *
 * with W in kilograms and H in centimetres.
 *
 * KNOWN FAILURE MODE. The quadratic term grows faster than the linear one, so
 * above a certain body habitus the equation INVERTS: adding weight reduces the
 * computed lean body mass, and eventually returns a non-physical value. Schnider
 * 1998 propofol and Minto 1997 remifentanil both take lean body mass as a
 * covariate and are therefore both affected. `jamesLbmInverts` encodes this as an
 * executable predicate rather than describing it in prose
 * (engine/pharmacology → The James lean-body-mass inversion is caught).
 */
export function leanBodyMassJames1976(covariates: Covariates): number {
  const { weightKg: w, heightCm: h, sex } = covariates;
  if (!Number.isFinite(h) || h <= 0) throw new MissingCovariate('james-1976', 'heightCm');
  const ratio = w / h;
  return sex === 'male' ? 1.1 * w - 128 * ratio * ratio : 1.07 * w - 148 * ratio * ratio;
}

/**
 * True where the James equation has passed its turning point, so that adding
 * weight decreases the computed lean body mass. The turning point is found by
 * differentiating with respect to weight at fixed height:
 *
 *   d(LBM)/dW = a - 2 * b * W / H^2 = 0   =>   W_peak = a * H^2 / (2 * b)
 *
 * with (a, b) = (1.1, 128) for males and (1.07, 148) for females.
 */
export function jamesLbmInverts(covariates: Covariates): boolean {
  return covariates.weightKg > jamesLbmTurningPointKg(covariates);
}

/** The weight, in kilograms, at which the James equation turns over for this height and sex. */
export function jamesLbmTurningPointKg(covariates: Covariates): number {
  const a = covariates.sex === 'male' ? 1.1 : 1.07;
  const b = covariates.sex === 'male' ? 128 : 148;
  const h = covariates.heightCm;
  return (a * h * h) / (2 * b);
}

/**
 * Fat-free mass by Janmahasatian 2005, in kilograms.
 *
 * Janmahasatian S, Duffull SB, Ash S, Ward LC, Byrne NM, Green B.
 * Quantification of lean bodyweight. *Clin Pharmacokinet* 2005;44:1051-65.
 *
 *   male:   FFM = 9270 * W / (6680 + 216 * BMI)
 *   female: FFM = 9270 * W / (8780 + 244 * BMI)
 *
 * Unlike James this is monotone in weight at every habitus, which is why models
 * derived across obese populations use it instead.
 */
export function fatFreeMassJanmahasatian2005(covariates: Covariates): number {
  const bmi = bodyMassIndex(covariates);
  const denominator = covariates.sex === 'male' ? 6680 + 216 * bmi : 8780 + 244 * bmi;
  return (9270 * covariates.weightKg) / denominator;
}

/**
 * Fat-free mass by Al-Sallami 2015, in kilograms, which extends the adult
 * relationship down through childhood.
 *
 * Al-Sallami HS, Goulding A, Grant A, Taylor R, Holford N, Duffull SB.
 * Prediction of fat-free mass in children. *Clin Pharmacokinet* 2015;54:1169-78.
 *
 * The equation is CONTINUOUS and applies at every age. Its age scale asymptotes
 * toward Janmahasatian's adult prediction rather than switching to it, so there is
 * no branch here and there must not be one: an earlier version returned the adult
 * equation at and above 18 years, which made a female patient's fat-free mass drop
 * 2.9% the instant she turned 18, and Eleveld's V3 and Q3 with it. Eleveld applies
 * Al-Sallami across all ages, which is the behaviour this reproduces.
 */
export function fatFreeMassAlSallami2015(covariates: Covariates): number {
  const bmi = bodyMassIndex(covariates);
  const age = covariates.ageYears;
  if (covariates.sex === 'male') {
    const scale = 0.88 + (1 - 0.88) / (1 + Math.pow(age / 13.4, -12.7));
    return scale * ((9270 * covariates.weightKg) / (6680 + 216 * bmi));
  }
  const scale = 1.11 + (1 - 1.11) / (1 + Math.pow(age / 7.1, -1.1));
  return scale * ((9270 * covariates.weightKg) / (8780 + 244 * bmi));
}

/** Predicted (ideal) body weight by Devine, in kilograms. */
export function predictedBodyWeightKg(covariates: Covariates): number {
  const inchesOver5Feet = Math.max(covariates.heightCm / 2.54 - 60, 0);
  return covariates.sex === 'male' ? 50 + 2.3 * inchesOver5Feet : 45.5 + 2.3 * inchesOver5Feet;
}

/** Body surface area by Du Bois, in square metres. */
export function bodySurfaceAreaM2(covariates: Covariates): number {
  return 0.007184 * Math.pow(covariates.weightKg, 0.425) * Math.pow(covariates.heightCm, 0.725);
}

/** Every derived body measure, computed rather than stored. */
export interface DerivedBody {
  readonly bmi: number;
  readonly leanBodyMassJames: number;
  readonly fatFreeMass: number;
  readonly predictedBodyWeight: number;
  readonly bodySurfaceArea: number;
  readonly jamesInverts: boolean;
}

export function deriveBody(covariates: Covariates): DerivedBody {
  return {
    bmi: bodyMassIndex(covariates),
    leanBodyMassJames: leanBodyMassJames1976(covariates),
    fatFreeMass: fatFreeMassAlSallami2015(covariates),
    predictedBodyWeight: predictedBodyWeightKg(covariates),
    bodySurfaceArea: bodySurfaceAreaM2(covariates),
    jamesInverts: jamesLbmInverts(covariates),
  };
}

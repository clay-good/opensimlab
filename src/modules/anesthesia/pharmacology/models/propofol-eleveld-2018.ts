/**
 * Propofol — Eleveld 2018, the general-purpose model.
 *
 * Eleveld DJ, Colin P, Absalom AR, Struys MMRF. Pharmacokinetic-pharmacodynamic
 * model for propofol for broad application in anaesthesia and sedation.
 * *Br J Anaesth* 2018;120:942-59.
 *
 * It is the only shipped adult model derived across a broad population including
 * obesity and old age, which is why it is the default for an adult patient whose
 * scenario does not name a model.
 *
 * TRANSCRIPTION STATUS. The structural equations below are transcribed from the
 * primary publication. The parameter values carry `pending-independent-check`,
 * which means they have NOT yet been checked by a second person against a second
 * source. Until they are, this model cannot carry the Published label, the
 * interface names the model as pending an independent check wherever it drives a
 * number, and the limitations register records it. See `docs/governance/limitations.md`.
 */

import type { PharmacologyModel } from '../types';
import { fatFreeMassAlSallami2015 } from '../body-composition';

/** The reference individual the model is normalized to: 35 y, 70 kg, 170 cm, male. */
export const ELEVELD_REFERENCE = {
  ageYears: 35, weightKg: 70, heightCm: 170, sex: 'male' as const,
};

/** Published fixed effects. Names follow the paper's theta numbering. */
export const ELEVELD_THETA = {
  /** V1 reference, litres. */
  v1Ref: 6.28,
  /** V2 reference, litres. */
  v2Ref: 25.5,
  /** V3 reference, litres. */
  v3Ref: 273,
  /** Clearance reference for males, litres per minute. */
  clRefMale: 1.79,
  /** Q2 reference, litres per minute. */
  q2Ref: 1.75,
  /** Q3 reference, litres per minute. */
  q3Ref: 1.11,
  /** Clearance maturation E50, in weeks of post-menstrual age. */
  clMaturationE50Weeks: 42.3,
  /** Clearance maturation Hill slope. */
  clMaturationSlope: 9.06,
  /** V2 ageing exponent, per year. */
  v2Ageing: -0.0156,
  /** Clearance opiates exponent, per year. */
  clOpiates: -0.00286,
  /** Central volume sigmoid E50, kilograms. */
  centralE50Kg: 33.6,
  /** V3 opiates exponent, per year. */
  v3Opiates: -0.0138,
  /** Q3 maturation E50, in weeks of post-menstrual age. */
  q3MaturationE50Weeks: 68.3,
  /** Clearance reference for females, litres per minute. */
  clRefFemale: 2.10,
  /** Q2 immaturity multiplier. */
  q2Immaturity: 1.30,
} as const;

/** Pharmacodynamic fixed effects for the depth-of-anaesthesia endpoint. */
export const ELEVELD_PD = {
  /** Ce50 at the reference age, µg/mL. */
  ce50Ref: 3.08,
  /** Ce50 ageing exponent, per year. */
  ce50Ageing: -0.00635,
  /** Baseline index with no drug present. */
  e0: 93,
  /** Index at maximal effect. */
  eMax: 0,
  /** ke0 at the reference weight, per minute. */
  ke0Ref: 0.146,
  /** ke0 weight exponent. */
  ke0WeightExponent: -0.25,
  /** Hill slope below Ce50. */
  gammaLow: 1.47,
  /** Hill slope above Ce50. The model publishes an asymmetric pair. */
  gammaHigh: 1.89,
} as const;

/** exp(x * (age - 35)), the paper's ageing function. */
const ageing = (exponent: number, ageYears: number): number =>
  Math.exp(exponent * (ageYears - ELEVELD_REFERENCE.ageYears));

/** x^lambda / (x^lambda + e50^lambda), the paper's sigmoid. */
const sigmoid = (x: number, e50: number, lambda: number): number =>
  Math.pow(x, lambda) / (Math.pow(x, lambda) + Math.pow(e50, lambda));

/** Central volume weight function. */
const central = (weightKg: number): number => sigmoid(weightKg, ELEVELD_THETA.centralE50Kg, 1);

/** Post-menstrual age in weeks, from post-natal age when it is not declared. */
const postMenstrualWeeks = (ageYears: number, declared?: number): number =>
  declared ?? ageYears * 52.143 + 40;

export const PROPOFOL_ELEVELD_2018: PharmacologyModel = {
  id: 'propofol-eleveld-2018',
  drugId: 'propofol',
  drugName: 'Propofol',
  compartments: 3,
  concentrationUnit: 'µg/mL',
  doseUnit: 'mg',
  requiredCovariates: ['ageYears', 'weightKg', 'heightCm', 'sex'],
  parameters: (covariates) => {
    const { ageYears, weightKg, sex } = covariates;
    const opiates = covariates.opioidsCoadministered ?? true;
    const pma = postMenstrualWeeks(ageYears, covariates.postMenstrualAgeWeeks);
    const referencePma = postMenstrualWeeks(ELEVELD_REFERENCE.ageYears);

    const ffm = fatFreeMassAlSallami2015(covariates);
    const referenceFfm = fatFreeMassAlSallami2015(ELEVELD_REFERENCE);

    const v1 = ELEVELD_THETA.v1Ref * (central(weightKg) / central(ELEVELD_REFERENCE.weightKg));
    const v2 = ELEVELD_THETA.v2Ref
      * (weightKg / ELEVELD_REFERENCE.weightKg)
      * ageing(ELEVELD_THETA.v2Ageing, ageYears);
    const v3 = ELEVELD_THETA.v3Ref
      * (ffm / referenceFfm)
      * (opiates ? Math.exp(ELEVELD_THETA.v3Opiates * ageYears) : 1);

    const clMaturation = sigmoid(pma, ELEVELD_THETA.clMaturationE50Weeks, ELEVELD_THETA.clMaturationSlope);
    const referenceClMaturation = sigmoid(
      referencePma, ELEVELD_THETA.clMaturationE50Weeks, ELEVELD_THETA.clMaturationSlope,
    );
    const clRef = sex === 'male' ? ELEVELD_THETA.clRefMale : ELEVELD_THETA.clRefFemale;
    const cl = clRef
      * Math.pow(weightKg / ELEVELD_REFERENCE.weightKg, 0.75)
      * (clMaturation / referenceClMaturation)
      * (opiates ? Math.exp(ELEVELD_THETA.clOpiates * ageYears) : 1);

    const q3Maturation = sigmoid(pma, ELEVELD_THETA.q3MaturationE50Weeks, 1);
    const referenceQ3Maturation = sigmoid(referencePma, ELEVELD_THETA.q3MaturationE50Weeks, 1);

    const q2 = ELEVELD_THETA.q2Ref
      * Math.pow(v2 / ELEVELD_THETA.v2Ref, 0.75)
      * (1 + ELEVELD_THETA.q2Immaturity * (1 - q3Maturation));
    const q3 = ELEVELD_THETA.q3Ref
      * Math.pow(v3 / ELEVELD_THETA.v3Ref, 0.75)
      * (q3Maturation / referenceQ3Maturation);

    return {
      modelId: 'propofol-eleveld-2018',
      v1,
      peripheralVolumes: [v2, v3],
      cl,
      intercompartmentalClearances: [q2, q3],
      ke0: ELEVELD_PD.ke0Ref * Math.pow(weightKg / ELEVELD_REFERENCE.weightKg, ELEVELD_PD.ke0WeightExponent),
    };
  },
  pd: {
    effect: 'depth-index',
    e0: ELEVELD_PD.e0,
    eMax: ELEVELD_PD.eMax,
    ce50: (covariates) => ELEVELD_PD.ce50Ref * ageing(ELEVELD_PD.ce50Ageing, covariates.ageYears),
    gammaLow: ELEVELD_PD.gammaLow,
    gammaHigh: ELEVELD_PD.gammaHigh,
    betweenSubjectCv: null,
  },
  envelope: {
    // Derived across a pooled population spanning birth to the very elderly.
    ageYears: [0, 105],
    weightKg: [0.68, 160],
    heightCm: [40, 220],
    bodyMassIndex: [10, 60],
  },
  failureModes: [],
  citation: {
    authors: 'Eleveld DJ, Colin P, Absalom AR, Struys MMRF',
    title: 'Pharmacokinetic-pharmacodynamic model for propofol for broad application in anaesthesia and sedation',
    journal: 'British Journal of Anaesthesia',
    year: 2018,
    volumePages: '120:942-59',
    pmid: '29661412',
    doi: '10.1016/j.bja.2018.01.018',
    locator: 'Fixed-effect parameter table and covariate model.',
    summary:
      'A propofol model built by pooling many previously published datasets spanning neonates to '
      + 'the elderly, including obese patients, so that one parameter set covers the whole range '
      + 'rather than several models each covering a slice of it.',
  },
  transcription: {
    primaryLocator: 'Fixed-effect parameter table; covariate equations for V1, V2, V3, CL, Q2, Q3, ke0 and Ce50.',
    secondSource: null,
    checkedBy: null,
    checkedOn: null,
    status: 'pending-independent-check',
    note:
      'The structural equations and every fixed-effect value are transcribed from the primary '
      + 'publication. The independent second-source check by a different person, which this '
      + 'project requires before a model may carry the Published label, has NOT been performed, '
      + 'so every number this model drives is marked as pending an independent check.\n\n'
      + 'WHAT A SECOND-SOURCE CHECK ACTUALLY FOUND. The check was attempted. The primary is '
      + 'paywalled, and the one reachable secondary that reproduces the parameter table could not '
      + 'be read reliably: two retrievals of the same table returned different clearance values '
      + 'and its rows visibly mixed entries from adjacent models. Nothing was confirmed from it '
      + 'and NOTHING WAS CHANGED on its authority, because correcting a right number from an '
      + 'unreliable source is worse than leaving it marked unchecked. It did disagree about V1 '
      + '(6.25 against 6.28) and about V3 (447 scaled by total body weight against 273 scaled by '
      + 'fat-free mass); those two are where a checker with the paper should start. See '
      + '`src/platform/docs/verified-constants.ts`.\n\n'
      + 'TWO THINGS THIS TRANSCRIPTION DOES NOT COVER, STATED RATHER THAN GLOSSED.\n\n'
      + 'First, the corrigendum. An earlier version of this file asserted in three places that '
      + 'the 2018 corrigendum was applied, and recorded nowhere what the corrigendum changed. An '
      + 'unfalsifiable provenance claim on the default adult model is worse than no claim, so the '
      + 'assertion is withdrawn until someone checks the corrigendum against this table and '
      + 'records the result here.\n\n'
      + 'Second, arterial versus venous sampling. The paper publishes separate parameters for the '
      + 'two sampling sites — a central-volume factor and a substantially faster venous ke0. Only '
      + 'the ARTERIAL branch is implemented here. Predicted onset is therefore the arterial one, '
      + 'and a learner comparing this to a venous-referenced pump will see a difference this '
      + 'model does not account for.',
  },
  notes:
    'Eleveld is the default adult propofol model here because it is the only shipped model derived '
    + 'across a population broad enough to include obesity and old age. Its ke0 is smaller than '
    + "Schnider's, so its predicted effect-site peak is later and lower.",
  isTeachingModel: false,
  referenceIndividual: {
    covariates: ELEVELD_REFERENCE,
    // The terms that are normalized to the reference individual vanish exactly
    // there, so these four must reproduce the published constants to machine
    // precision. Clearance, V3 and Q2 are deliberately NOT asserted here: their
    // equations carry an opiates term and a maturation term that do not reduce to
    // one at the reference individual, so asserting the bare published constant
    // would be asserting something the model does not claim.
    expected: {
      v1: ELEVELD_THETA.v1Ref,
      v2: ELEVELD_THETA.v2Ref,
      ke0: ELEVELD_PD.ke0Ref,
      ce50: ELEVELD_PD.ce50Ref,
    },
    tolerance: 1e-9,
  },
};

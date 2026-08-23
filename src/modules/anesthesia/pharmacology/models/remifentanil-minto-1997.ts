/**
 * Remifentanil — Minto 1997.
 *
 * Minto CF, Schnider TW, Egan TD, et al. Influence of age and gender on the
 * pharmacokinetics and pharmacodynamics of remifentanil. I. Model development.
 * *Anesthesiology* 1997;86:10-23 (PMID 9009935), and II. Model application,
 * 86:24-33 (PMID 9009936).
 *
 * Transcribed by hand from the primary publications. Like Schnider, this model
 * takes lean body mass by the James 1976 equation and inherits its inversion.
 */

import type { PharmacologyModel } from '../types';
import { jamesLbmInverts, leanBodyMassJames1976 } from '../body-composition';

/** The covariate model is centred on a 40-year-old with a lean body mass of 55 kg. */
const REFERENCE_AGE_YEARS = 40;
const REFERENCE_LBM_KG = 55;

export const REMIFENTANIL_MINTO_1997: PharmacologyModel = {
  id: 'remifentanil-minto-1997',
  drugId: 'remifentanil',
  drugName: 'Remifentanil',
  compartments: 3,
  concentrationUnit: 'ng/mL',
  doseUnit: 'µg',
  requiredCovariates: ['ageYears', 'weightKg', 'heightCm', 'sex'],
  parameters: (covariates) => {
    const age = covariates.ageYears - REFERENCE_AGE_YEARS;
    const lbm = leanBodyMassJames1976(covariates) - REFERENCE_LBM_KG;
    const v1 = 5.1 - 0.0201 * age + 0.072 * lbm;
    const v2 = 9.82 - 0.0811 * age + 0.108 * lbm;
    const v3 = 5.42;
    const cl1 = 2.6 - 0.0162 * age + 0.0191 * lbm;
    const cl2 = 2.05 - 0.0301 * age;
    const cl3 = 0.076 - 0.00113 * age;
    return {
      modelId: 'remifentanil-minto-1997',
      v1,
      peripheralVolumes: [v2, v3],
      cl: cl1,
      intercompartmentalClearances: [cl2, cl3],
      // ke0 falls with age in the published relationship.
      ke0: 0.595 - 0.007 * age,
    };
  },
  pd: {
    effect: 'opioid-effect',
    e0: 0,
    eMax: 1,
    // Effect-site concentration for half maximal effect on the spectral edge
    // endpoint, which likewise falls with age.
    ce50: (covariates) => 13.1 - 0.148 * (covariates.ageYears - REFERENCE_AGE_YEARS),
    gammaLow: 2.44,
    gammaHigh: 2.44,
    gammaTransitionSteepness: null,
    betweenSubjectCv: null,
  },
  envelope: {
    ageYears: [20, 85],
    weightKg: [40, 130],
    heightCm: [145, 200],
    bodyMassIndex: [15, 35],
  },
  failureModes: [
    {
      id: 'james-lbm-inversion',
      reason:
        'Minto takes lean body mass by the James 1976 equation as a covariate on the central '
        + 'volume and on clearance. Above the turning point of that equation, adding weight '
        + 'REDUCES the computed lean body mass, so the model predicts a smaller volume and a '
        + 'lower clearance for a larger patient, which is non-physical.',
      predicate: jamesLbmInverts,
      // No alternative is offered, because there is not one: this is the only
      // remifentanil model in the build. Naming itself here would tell a learner
      // the model had failed and then hand them the same model as the remedy.
    },
  ],
  citation: {
    authors: 'Minto CF, Schnider TW, Egan TD, Youngs E, Lemmens HJM, Gambus PL, et al.',
    title: 'Influence of age and gender on the pharmacokinetics and pharmacodynamics of remifentanil. I. Model development',
    journal: 'Anesthesiology',
    year: 1997,
    volumePages: '86:10-23',
    pmid: '9009935',
    doi: '10.1097/00000542-199701000-00004',
    locator: 'Covariate model centred on a 40-year-old with 55 kg lean body mass.',
    summary:
      'A three-compartment remifentanil model with age and lean body mass covariates, derived '
      + 'alongside a pharmacodynamic model on the electroencephalographic spectral edge. Part II '
      + '(PMID 9009936) applies the model and reports its predictive performance.',
  },
  transcription: {
    primaryLocator: 'Part I covariate equations for V1, V2, V3, Cl1, Cl2, Cl3 and ke0.',
    secondSource: null,
    checkedBy: null,
    checkedOn: null,
    status: 'pending-independent-check',
    note:
      'Transcribed from the primary publication. The independent second-source check required '
      + 'before this model may carry the Published label has not yet been performed.',
  },
  notes:
    'Remifentanil is metabolized by non-specific esterases, so its offset barely lengthens with '
    + 'infusion duration. The concentration panel contrasts it against fentanyl for exactly '
    + 'that reason.',
  isTeachingModel: false,
  referenceIndividual: {
    // A 40-year-old with a James lean body mass of 55 kg: every centred term
    // vanishes and the parameters reduce to the published constants.
    // 70 kg at 168.8464 cm gives a James lean body mass of exactly 55 kg.
    covariates: { ageYears: 40, weightKg: 70, heightCm: 168.8464, sex: 'male' },
    expected: { v1: 5.1, v2: 9.82, v3: 5.42, cl: 2.6, q2: 2.05, q3: 0.076, ke0: 0.595 },
    tolerance: 1e-4,
  },
};

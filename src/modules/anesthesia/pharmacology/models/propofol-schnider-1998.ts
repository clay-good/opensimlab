/**
 * Propofol — Schnider 1998.
 *
 * Transcribed by hand from the primary publication.
 *
 * This model takes lean body mass by the James 1976 equation as a covariate on
 * clearance, and therefore inherits that equation's inversion at high body mass
 * index. That failure mode is encoded below as an executable predicate.
 */

import type { PharmacologyModel } from '../types';
import { bodyMassIndex, jamesLbmInverts, leanBodyMassJames1976 } from '../body-composition';

export const PROPOFOL_SCHNIDER_1998: PharmacologyModel = {
  id: 'propofol-schnider-1998',
  drugId: 'propofol',
  drugName: 'Propofol',
  compartments: 3,
  concentrationUnit: 'µg/mL',
  doseUnit: 'mg',
  requiredCovariates: ['ageYears', 'weightKg', 'heightCm', 'sex'],
  parameters: (covariates) => {
    const { ageYears: age, weightKg: weight, heightCm: height } = covariates;
    const lbm = leanBodyMassJames1976(covariates);
    // Published covariate equations. V1 and V3 are fixed; V2, Cl1 and Cl2 scale.
    const v1 = 4.27;
    const v2 = 18.9 - 0.391 * (age - 53);
    const v3 = 238;
    const cl1 = 1.89 + 0.0456 * (weight - 77) - 0.0681 * (lbm - 59) + 0.0264 * (height - 177);
    const cl2 = 1.29 - 0.024 * (age - 53);
    const cl3 = 0.836;
    return {
      modelId: 'propofol-schnider-1998',
      v1,
      peripheralVolumes: [v2, v3],
      cl: cl1,
      intercompartmentalClearances: [cl2, cl3],
      ke0: 0.456,
    };
  },
  pd: null,
  envelope: {
    ageYears: [18, 85],
    weightKg: [44, 123],
    heightCm: [150, 200],
    // The derivation population was not obese; above this the lean-body-mass term misbehaves.
    bodyMassIndex: [15, 35],
  },
  failureModes: [
    {
      id: 'james-lbm-inversion',
      reason:
        'Schnider takes lean body mass by the James 1976 equation as a covariate on clearance. '
        + 'Above the turning point of that equation, adding weight REDUCES the computed lean body '
        + 'mass, which raises the computed clearance instead of lowering it. The model then '
        + 'under-predicts concentration in exactly the patients where over-dosing matters most.',
      predicate: jamesLbmInverts,
      alternativeModelId: 'propofol-eleveld-2018',
    },
    {
      id: 'schnider-obesity',
      reason:
        'The derivation population had a body mass index below about 35. Beyond that the model '
        + 'is extrapolating.',
      predicate: (covariates) => bodyMassIndex(covariates) > 35,
      alternativeModelId: 'propofol-eleveld-2018',
    },
  ],
  citation: {
    authors: 'Schnider TW, Minto CF, Gambus PL, Andresen C, Goodale DB, Shafer SL, Youngs EJ',
    title: 'The influence of method of administration and covariates on the pharmacokinetics of propofol in adult volunteers',
    journal: 'Anesthesiology',
    year: 1998,
    volumePages: '88:1170-82',
    pmid: '9605675',
    locator: 'Covariate model for V2, Cl1 and Cl2; fixed V1 and V3.',
    summary:
      'A three-compartment propofol model derived in adult volunteers, in which age, weight, '
      + 'height and lean body mass enter the covariate model. It is widely implemented in '
      + 'target-controlled infusion pumps outside the United States.',
  },
  transcription: {
    primaryLocator: 'Published covariate equations for V1, V2, V3, Cl1, Cl2, Cl3.',
    secondSource: null,
    checkedBy: null,
    checkedOn: null,
    status: 'pending-independent-check',
    note:
      'Transcribed from the primary publication. The independent second-source check required '
      + 'before this model may carry the Published label has not yet been performed.',
  },
  notes:
    'Schnider is the model most learners will meet on a target-controlled infusion pump outside '
    + 'the United States. Its lean-body-mass term is also the clearest teachable example of a '
    + 'model failing outside the population it was derived in.',
  isTeachingModel: false,
  referenceIndividual: {
    // The covariate equations are centred on the STUDY POPULATION's separate means
    // — age 53, weight 77 kg, height 177 cm, lean body mass 59 kg — which do not
    // describe one mutually consistent individual, because a 77 kg 177 cm male has
    // a James lean body mass of 60.5 kg rather than 59. So there is no patient for
    // whom every centred term vanishes at once.
    //
    // The values asserted here are therefore the ones that DO reduce cleanly at
    // age 53: the two fixed volumes, the fixed slow clearance, and the two terms
    // whose only covariate is age. Clearance is asserted separately, against its
    // published formula evaluated with the actual lean body mass, in
    // "A shared body-composition equation has one implementation".
    covariates: { ageYears: 53, weightKg: 77, heightCm: 177, sex: 'male' },
    expected: { v1: 4.27, v2: 18.9, v3: 238, q2: 1.29, q3: 0.836 },
    tolerance: 1e-12,
  },
};

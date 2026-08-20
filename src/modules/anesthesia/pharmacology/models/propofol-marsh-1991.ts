/**
 * Propofol — Marsh 1991.
 *
 * Transcribed by hand from the primary publication. Nothing is imported from any
 * external dataset, and no sibling project is consulted at build or run time.
 */

import type { PharmacologyModel } from '../types';

/**
 * Rate constants, per minute, exactly as published.
 *
 * The solver is parameterized by clearances rather than rate constants, so Q2 and
 * Q3 are derived as k12*V1 and k13*V1. The published return constants k21 and k31
 * are exported so a test can assert that the derived clearances reproduce them,
 * which catches a mistyped digit in either direction.
 */
export const MARSH_RATE_CONSTANTS = {
  k10: 0.119,
  k12: 0.112,
  k21: 0.055,
  k13: 0.0419,
  k31: 0.0033,
} as const;
const K10 = MARSH_RATE_CONSTANTS.k10;
const K12 = MARSH_RATE_CONSTANTS.k12;
const K13 = MARSH_RATE_CONSTANTS.k13;
/** Volumes as a fraction of total body weight, litres per kilogram. */
const V1_PER_KG = 0.228;
const V2_PER_KG = 0.463;
const V3_PER_KG = 2.893;

export const PROPOFOL_MARSH_1991: PharmacologyModel = {
  id: 'propofol-marsh-1991',
  drugId: 'propofol',
  drugName: 'Propofol',
  compartments: 3,
  concentrationUnit: 'µg/mL',
  doseUnit: 'mg',
  requiredCovariates: ['weightKg'],
  parameters: (covariates) => {
    const v1 = V1_PER_KG * covariates.weightKg;
    const v2 = V2_PER_KG * covariates.weightKg;
    const v3 = V3_PER_KG * covariates.weightKg;
    // The paper publishes rate constants; clearances follow from them and the volumes.
    return {
      modelId: 'propofol-marsh-1991',
      v1,
      peripheralVolumes: [v2, v3],
      cl: K10 * v1,
      intercompartmentalClearances: [K12 * v1, K13 * v1],
      ke0: 0.26,
    };
  },
  pd: null,
  envelope: {
    ageYears: [16, 100],
    weightKg: [30, 150],
    bodyMassIndex: [15, 40],
  },
  failureModes: [
    {
      id: 'marsh-weight-only',
      reason:
        'Marsh scales every volume linearly with total body weight and takes no other covariate, '
        + 'so in obesity it predicts a central volume far larger than the patient has and '
        + 'under-predicts the concentration after a bolus.',
      predicate: (covariates) =>
        covariates.weightKg / Math.pow(covariates.heightCm / 100, 2) > 35,
      alternativeModelId: 'propofol-eleveld-2018',
    },
  ],
  citation: {
    authors: 'Marsh B, White M, Morton N, Kenny GNC',
    title: 'Pharmacokinetic model driven infusion of propofol in children',
    journal: 'British Journal of Anaesthesia',
    year: 1991,
    volumePages: '67:41-8',
    pmid: '1859758',
    locator: 'Rate constants and volume coefficients as reported in the model description.',
    summary:
      'A three-compartment propofol model in which every volume scales linearly with total '
      + 'body weight. It was the first model widely implemented in target-controlled infusion '
      + 'pumps and remains in clinical use, which is why it is taught here.',
  },
  transcription: {
    primaryLocator: 'Model description, rate constants k10, k12, k21, k13, k31 and volume coefficients.',
    secondSource: null,
    checkedBy: null,
    checkedOn: null,
    status: 'pending-independent-check',
    note:
      'Transcribed from the primary publication. The independent second-source check required '
      + 'before this model may carry the Published label has not yet been performed.',
  },
  notes:
    'Marsh takes weight as its only covariate. It is simple, familiar, and demonstrably wrong '
    + 'at the extremes of body habitus, which makes it a useful contrast against Eleveld.',
  isTeachingModel: false,
  referenceIndividual: {
    covariates: { ageYears: 35, weightKg: 70, heightCm: 170, sex: 'male' },
    expected: { v1: 15.96, v2: 32.41, v3: 202.51, cl: 1.8992 },
    tolerance: 1e-3,
  },
};

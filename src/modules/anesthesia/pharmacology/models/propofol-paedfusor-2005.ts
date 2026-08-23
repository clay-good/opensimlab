/**
 * Propofol — Paedfusor, ages 1–12 years.
 *
 * Absalom and Kenny published the complete data set as microconstants. The
 * compartment solver consumes volumes and clearances, so the intercompartmental
 * clearances below are algebraic conversions that preserve every published
 * forward and return rate constant.
 */

import type { PharmacologyModel } from '../types';

export const PAEDFUSOR_RATE_CONSTANTS = {
  k10Coefficient: 0.1527,
  k10WeightExponent: -0.3,
  k12: 0.114,
  k13: 0.0419,
  k21: 0.055,
  k31: 0.0033,
  ke0: 0.26,
  v1LitresPerKg: 0.4584,
} as const;

export const PROPOFOL_PAEDFUSOR_2005: PharmacologyModel = {
  id: 'propofol-paedfusor-2005',
  drugId: 'propofol',
  drugName: 'Propofol',
  compartments: 3,
  concentrationUnit: 'µg/mL',
  doseUnit: 'mg',
  requiredCovariates: ['ageYears', 'weightKg'],
  parameters: (covariates) => {
    const v1 = PAEDFUSOR_RATE_CONSTANTS.v1LitresPerKg * covariates.weightKg;
    const v2 = v1 * PAEDFUSOR_RATE_CONSTANTS.k12 / PAEDFUSOR_RATE_CONSTANTS.k21;
    const v3 = v1 * PAEDFUSOR_RATE_CONSTANTS.k13 / PAEDFUSOR_RATE_CONSTANTS.k31;
    const k10 = PAEDFUSOR_RATE_CONSTANTS.k10Coefficient
      * covariates.weightKg ** PAEDFUSOR_RATE_CONSTANTS.k10WeightExponent;
    return {
      modelId: 'propofol-paedfusor-2005',
      v1,
      peripheralVolumes: [v2, v3],
      cl: k10 * v1,
      intercompartmentalClearances: [
        PAEDFUSOR_RATE_CONSTANTS.k12 * v1,
        PAEDFUSOR_RATE_CONSTANTS.k13 * v1,
      ],
      ke0: PAEDFUSOR_RATE_CONSTANTS.ke0,
    };
  },
  // The source publishes PK and an effect-site equilibration constant, not a
  // pediatric depth-response surface. The shared depth response remains a
  // separately disclosed teaching calibration.
  pd: null,
  envelope: { ageYears: [1, 12], weightKg: [5, 61] },
  failureModes: [],
  citation: {
    authors: 'Absalom AR, Kenny GNC',
    title: "'Paedfusor' pharmacokinetic data set",
    journal: 'British Journal of Anaesthesia',
    year: 2005,
    volumePages: '95:110',
    pmid: '15941735',
    doi: '10.1093/bja/aei567',
    locator: 'Table 1, age 1–12 years: V1, k10, k12, k13, k21, k31 and ke0.',
    summary:
      'The authors published the complete pediatric propofol data set used by the '
      + 'Paedfusor target-controlled infusion system, including the weight-scaled volumes '
      + 'and microconstants used for children aged 1–12 years.',
  },
  transcription: {
    primaryLocator: 'Absalom and Kenny 2005, Table 1, age 1–12 years.',
    secondSource: null,
    checkedBy: null,
    checkedOn: null,
    status: 'pending-independent-check',
    note:
      'Transcribed from the primary publication. The independent second-person check '
      + 'required for a Published confidence label is still outstanding.',
  },
  notes:
    'Paedfusor is selected by default only from 1 through 12 years in this build. '
    + 'Its published ke0 drives effect-site equilibration, but the source does not '
    + 'supply an independently validated pediatric depth-response surface.',
  isTeachingModel: false,
  referenceIndividual: {
    covariates: { ageYears: 6, weightKg: 20, heightCm: 115, sex: 'female' },
    expected: {
      v1: 9.168,
      v2: 19.002763636363635,
      v3: 116.40581818181818,
      cl: 0.5699078551510028,
      q2: 1.045152,
      q3: 0.3841392,
      ke0: 0.26,
    },
    tolerance: 1e-10,
  },
};

/**
 * Rocuronium clinical-course teaching model.
 *
 * The dose/time landmarks are anchored to adult clinical observations, but the
 * compact one-compartment PK and the concentration-to-blockade curve are Open
 * Sim Lab calibrations. This is deliberately not named after a published PK/PD
 * model and can never carry the Published confidence label.
 */

import type { PharmacologyModel } from '../types';

export const ROCURONIUM_TEACHING_PD = {
  ce50MgPerL: 1.9,
  gamma: 4,
} as const;

export const ROCURONIUM_CLINICAL_COURSE_TEACHING: PharmacologyModel = {
  id: 'rocuronium-clinical-course-teaching',
  drugId: 'rocuronium',
  drugName: 'Rocuronium',
  compartments: 1,
  concentrationUnit: 'mg/L',
  doseUnit: 'mg',
  requiredCovariates: ['weightKg'],
  parameters: (covariates) => ({
    modelId: 'rocuronium-clinical-course-teaching',
    // These constants are calibrated together so 0.6 mg/kg in a 70 kg adult
    // reaches profound block within the observed onset window and begins
    // clinically meaningful recovery around half an hour.
    v1: (5 / 70) * covariates.weightKg,
    peripheralVolumes: [],
    cl: (0.2 / 70) * covariates.weightKg,
    intercompartmentalClearances: [],
    ke0: 2,
  }),
  pd: {
    effect: 'neuromuscular-blockade',
    e0: 0,
    eMax: 1,
    ce50: () => ROCURONIUM_TEACHING_PD.ce50MgPerL,
    gammaLow: ROCURONIUM_TEACHING_PD.gamma,
    gammaHigh: ROCURONIUM_TEACHING_PD.gamma,
    gammaTransitionSteepness: null,
    betweenSubjectCv: null,
  },
  envelope: {
    ageYears: [18, 64],
    weightKg: [40, 140],
  },
  failureModes: [],
  citation: {
    authors: 'McCoy EP, Mirakhur RK, Maddineni VR, Wierda JMKH, Proost JH',
    title: 'Neuromuscular effects of rocuronium bromide (Org 9426) during fentanyl and halothane anaesthesia',
    journal: 'Anaesthesia',
    year: 1993,
    volumePages: '48:103-5',
    pmid: '8460753',
    doi: '10.1111/j.1365-2044.1993.tb06844.x',
    locator: 'Dose groups and reported onset and spontaneous-recovery landmarks.',
    summary:
      'Adult dose-response observations anchor the onset and recovery windows. The compact PK/PD '
      + 'equations used here are a teaching calibration, not a transcription of that study.',
  },
  transcription: {
    primaryLocator: 'No parameter transcription: Open Sim Lab calibration to reported clinical landmarks.',
    secondSource: null,
    checkedBy: null,
    checkedOn: null,
    status: 'pending-independent-check',
    note: 'The model is permanently presented as Teaching because its PK/PD constants are calibrated.',
  },
  notes:
    'Rocuronium produces skeletal-muscle paralysis only. It provides no hypnosis, amnesia, '
    + 'analgesia or haemodynamic protection. The quantitative train-of-four course is a teaching '
    + 'calibration to adult onset and recovery landmarks.',
  isTeachingModel: true,
};

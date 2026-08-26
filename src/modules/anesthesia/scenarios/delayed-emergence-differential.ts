/** Ordered delayed-emergence differential with a fixed lateralizing examination finding. */

import type { Scenario } from './types';

export const DELAYED_EMERGENCE_DIFFERENTIAL: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'delayed-emergence-differential', version: '0.1.0', maturity: 'preview',
    title: 'Delayed emergence differential', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 6, difficulty: 'advanced',
    objectives: [
      {
        id: 'support-delayed-emergence-patient',
        statement: 'Preserve the airway and review ventilation, oxygenation, circulation, and temperature first.',
        measure: 'The immediate support review was accepted before cause investigation.',
      },
      {
        id: 'reconcile-delayed-emergence-exposures',
        statement: 'Reconcile anesthetic, opioid, benzodiazepine, and neuromuscular-blockade evidence without anchoring on one category.',
        measure: 'The medication record and quantitative recovery review was accepted after immediate support.',
      },
      {
        id: 'check-delayed-emergence-metabolic-causes',
        statement: 'Check glucose, ventilation, sodium, and temperature as bounded reversible categories.',
        measure: 'The fixed bedside metabolic findings were reviewed after exposure reconciliation.',
      },
      {
        id: 'find-delayed-emergence-lateralizing-sign',
        statement: 'Perform a focused neurologic examination when common recorded causes do not explain the pattern.',
        measure: 'The accepted examination recorded a new asymmetric motor response and gaze preference.',
      },
      {
        id: 'escalate-delayed-emergence-neurologic-pattern',
        statement: 'Escalate the new lateralizing pattern urgently while continuing airway support.',
        measure: 'Urgent neurologic evaluation was accepted after the focused examination.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Cascella M, et al. Delayed Emergence from Anesthesia: What We Know and How We Act. Local Reg Anesth. 2020;13:195-206. PMCID PMC7652217.',
        'Tzabazis A, et al. Delayed emergence after anesthesia. J Clin Anesth. 2015;27:353-360. PMID 25912729.',
      ],
    },
    limitations: [
      'delayed-emergence-is-a-bounded-differential-vignette',
      'fixed-bedside-results-do-not-model-laboratory-testing',
      'no-neurologic-diagnosis-treatment-or-outcome',
    ],
  },
  patient: {
    ageYears: 69, sex: 'female', heightCm: 164, weightKg: 74, asaClass: 3,
    diagnosis: 'Colon cancer', procedure: 'Laparoscopic right hemicolectomy',
    comorbidities: ['Hypertension', 'Hyperlipidemia'],
    medications: ['Amlodipine', 'Atorvastatin'], allergies: ['None known'],
    fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 74, meanArterialMmHg: 88, strokeVolumeMl: 66,
      hemoglobinGPerDl: 12.8, bloodVolumeMl: 4600, coreTemperatureC: 36.7,
      arterialStiffness: 1.2, baroreflexGain: 0.75, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.16, difficultMaskVentilation: false,
      assessment: 'Tracheal tube secured; delivered ventilation and continuous capnography remain established',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: [
      'ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'train-of-four',
    ],
    airwayDevice: 'tracheal-tube', startingTrainOfFourRatio: 0.95,
    ventilator: {
      mode: 'volume-control', fio2: 0.5, tidalVolumeMl: 450,
      respiratoryRateBpm: 12, freshGasFlowLPerMin: 4,
      sevofluranePercent: 0, delivering: true,
    },
  },
  formulary: [],
  timeline: [{
    id: 'delayed-emergence-briefing', type: 'narrative',
    target: 'delayed-emergence-differential', atTick: 0, severity: 'warning',
    message: 'Twenty minutes after anesthetic delivery ended, the patient has not regained an appropriate response to voice. The tracheal tube and delivered ventilation remain in place. Work through immediate support, recorded drug and block evidence, bounded metabolic findings, and a focused examination before choosing an escalation path. This vignette does not measure consciousness, diagnose a neurologic event, teach reversal dosing, simulate laboratory testing, or model treatment and outcome.',
  }],
  debrief: { rubric: [
    { id: 'delayed-support', objectiveId: 'support-delayed-emergence-patient', question: 'Which immediate support and physiologic categories did you verify first?' },
    { id: 'delayed-exposure', objectiveId: 'reconcile-delayed-emergence-exposures', question: 'Which recorded drug and quantitative-block findings did and did not explain the pattern?' },
    { id: 'delayed-metabolic', objectiveId: 'check-delayed-emergence-metabolic-causes', question: 'Which fixed metabolic findings narrowed this vignette without excluding every real cause?' },
    { id: 'delayed-neurologic', objectiveId: 'find-delayed-emergence-lateralizing-sign', question: 'Which new examination asymmetry changed the urgency?' },
    { id: 'delayed-escalation', objectiveId: 'escalate-delayed-emergence-neurologic-pattern', question: 'What did you escalate, and which diagnosis and treatment decisions remain outside this screen?' },
  ] },
};

/** A calm, incremental propofol induction for one stable older adult. */

import type { Scenario } from './types';

export const ROUTINE_GERIATRIC_INDUCTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'routine-geriatric-induction', version: '0.1.0', maturity: 'draft',
    title: 'Routine geriatric intravenous induction', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'introductory',
    objectives: [
      {
        id: 'preoxygenate-older-adult',
        statement: 'Establish an oxygen reserve before beginning the modeled older-adult induction.',
        measure: 'End-tidal oxygen fraction reached at least 0.85 before the first accepted propofol bolus.',
      },
      {
        id: 'titrate-geriatric-propofol',
        statement: 'Titrate the labeled older-adult propofol range in increments and watch the modeled effect site catch up.',
        measure: 'Accepted propofol totaled 1–1.5 mg/kg, no bolus exceeded 20 mg, and consecutive boluses were at least 10 seconds apart.',
      },
      {
        id: 'protect-geriatric-perfusion',
        statement: 'Preserve perfusion while the incremental hypnotic effect develops.',
        measure: 'Mean arterial pressure never fell below 65 mmHg after the first propofol bolus.',
      },
      {
        id: 'ventilate-geriatric-induction',
        statement: 'Begin age-appropriate delivered ventilation before oxygen saturation falls.',
        measure: 'Accepted delivered ventilation at 6–8 mL/kg began after propofol and oxygen saturation remained at least 92% through the case.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'United States Food and Drug Administration approved labeling. Propofol injectable emulsion. Current DailyMed label.',
        'Eleveld DJ, et al. Pharmacokinetic-pharmacodynamic model for propofol for broad application in anaesthesia and sedation. Br J Anaesth 2018;120:942-59. PMID 29661412.',
        'Klein et al. Recommendations for standards of monitoring during anaesthesia and recovery 2021. PMID 34013531.',
      ],
    },
    limitations: [
      'geriatric-induction-is-one-bounded-profile',
      'bolus-injection-is-instantaneous',
      'depth-index-is-a-drug-model-not-an-eeg',
    ],
  },
  patient: {
    ageYears: 76, sex: 'male', heightCm: 174, weightKg: 72, asaClass: 2,
    diagnosis: 'Reducible inguinal hernia', procedure: 'Elective open inguinal hernia repair',
    comorbidities: ['Treated hypertension'], medications: ['Amlodipine'],
    allergies: ['None known'], fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 68, meanArterialMmHg: 92, strokeVolumeMl: 66,
      hemoglobinGPerDl: 13.6, bloodVolumeMl: 4800, coreTemperatureC: 36.4,
      arterialStiffness: 1.35, baroreflexGain: 0.75, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.12, difficultMaskVentilation: false,
      assessment: 'Mallampati II, adequate mouth opening and neck movement; removable dentures are out',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 450, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 2, sevofluranePercent: 0, delivering: false,
    },
  },
  formulary: [{
    drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
    deliveryModes: ['bolus'], syringeVolumeMl: 20, typicalDose: 80,
    presets: [
      { label: '20 mg', amount: 20, unit: 'mg' },
      { label: '40 mg', amount: 40, unit: 'mg' },
      { label: '1 mg/kg', amount: 1, unit: 'mg/kg' },
      { label: '1.5 mg/kg', amount: 1.5, unit: 'mg/kg' },
      { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
    ],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'A stable 76-year-old man is monitored for elective surgery. This practice window isolates preoxygenation, incremental propofol delivery, effect-site lag, pressure, and early ventilation. It does not predict frailty, cognition, delirium, organ reserve, or an individual dose.',
    },
    {
      id: 'induction-ready', type: 'narrative', atTick: 1200, severity: 'info',
      message: 'The operating room is ready. Confirm that oxygen has reached the patient, then titrate and reassess rather than treating the planned total as one automatic bolus.',
    },
    {
      id: 'case-end', type: 'narrative', atTick: 4800, severity: 'advisory',
      message: 'The induction practice window is ending. Confirm delivered ventilation, oxygenation, pressure, and the modeled effect-site trajectory before debrief.',
    },
  ],
  replayPoints: [{
    id: 'before-first-aliquot', label: 'Before the first propofol increment',
    objectiveId: 'titrate-geriatric-propofol', atTick: 1199,
    reason: 'Rehearse checking oxygen reserve and allowing each modeled increment to develop before deciding what comes next.',
  }],
  debrief: { rubric: [
    {
      id: 'oxygen-reserve', objectiveId: 'preoxygenate-older-adult',
      question: 'Which end-tidal value showed that the oxygen setting had reached the patient?',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
    {
      id: 'incremental-dose', objectiveId: 'titrate-geriatric-propofol',
      question: 'How did the accepted increments and effect-site delay change the decision to give more?',
      concept: 'hysteresis-and-effect-site-lag',
    },
    {
      id: 'pressure', objectiveId: 'protect-geriatric-perfusion',
      question: 'How did pressure change as the modeled effect site rose, and what can this one trajectory not predict?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'ventilation', objectiveId: 'ventilate-geriatric-induction',
      question: 'When did delivered ventilation begin relative to the first dose and the saturation trend?',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
  ] },
};

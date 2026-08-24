/** A bounded routine intravenous induction for one healthy 6-year-old child. */

import type { Scenario } from './types';

export const ROUTINE_PEDIATRIC_IV_INDUCTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'routine-pediatric-iv-induction',
    version: '0.1.0',
    maturity: 'draft',
    title: 'Routine pediatric intravenous induction',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 8,
    difficulty: 'introductory',
    objectives: [
      {
        id: 'preoxygenate-child',
        statement: 'Fill the child\'s oxygen reserve before giving propofol.',
        measure: 'End-tidal oxygen fraction reached at least 0.90 before the first accepted propofol bolus.',
      },
      {
        id: 'dose-pediatric-propofol',
        statement: 'Calculate the induction dose from the child\'s 20 kg actual body weight.',
        measure: 'The first accepted propofol bolus was entered in mg/kg and was within the labeled 2.5–3.5 mg/kg range for a healthy child aged 3–16 years.',
      },
      {
        id: 'ventilate-child-by-weight',
        statement: 'Deliver pediatric-sized breaths and adjust the rate to observed gas exchange.',
        measure: 'After induction, accepted delivered ventilation used 6–8 mL/kg tidal volume and sustained end-tidal carbon dioxide between 30 and 50 mmHg.',
      },
      {
        id: 'avoid-pediatric-desaturation',
        statement: 'Establish ventilation before the child reaches the steep part of the oxygen curve.',
        measure: 'Oxygen saturation remained at or above 92% from the first propofol bolus through the end of the case.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Absalom A, Kenny G. Paedfusor pharmacokinetic data set. Br J Anaesth 2005;95:110. PMID 15941735',
        'Absalom A, et al. Accuracy of the Paedfusor in children undergoing cardiac surgery or catheterization. Br J Anaesth 2003;91:507-13. PMID 14504151',
        'Videira RL, et al. Preoxygenation in children: for how long? Acta Anaesthesiol Scand 1992;36:109-11. PMID 1549927',
        'Thorsteinsson A, et al. Functional residual capacity in anesthetized children: normal values and values in children with cardiac anomalies. Anesthesiology 1990;73:876-81. PMID 2240677',
        'Lindahl SG. Oxygen consumption and carbon dioxide elimination in infants and children during anaesthesia and surgery. Br J Anaesth 1989;62:70-6. PMID 2492815',
        'Numa AH, Newth CJL. Anatomic dead space in infants and children. J Appl Physiol 1996;80:1485-9. PMID 8727530',
        'Lindahl SG, et al. Ventilation and gas exchange during anaesthesia and surgery in spontaneously breathing infants and children. Br J Anaesth 1984;56:121-9. PMID 6419754',
        'US DailyMed propofol injectable emulsion prescribing information, current page consulted 2026-08-23.',
      ],
    },
    limitations: [
      'paedfusor-pk-does-not-validate-pediatric-depth',
      'pediatric-respiratory-profile-is-a-teaching-model',
      'pediatric-hemodynamic-maturation-is-not-modeled',
      'pediatric-airway-equipment-sizing-is-not-modeled',
      'pediatric-case-is-one-bounded-profile',
      'pediatric-emergence-is-not-modeled',
      'bolus-injection-is-instantaneous',
    ],
  },
  patient: {
    ageYears: 6, sex: 'male', heightCm: 115, weightKg: 20, asaClass: 1,
    diagnosis: 'Need for diagnostic imaging under general anesthesia',
    procedure: 'Magnetic resonance imaging of the brain',
    comorbidities: [], medications: [], allergies: ['None known'],
    fasting: 'Solids eight hours, clear fluids two hours',
    baseline: {
      heartRateBpm: 95, meanArterialMmHg: 70, strokeVolumeMl: 28,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 1600, coreTemperatureC: 36.7,
      arterialStiffness: 0.75, baroreflexGain: 1.1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.08, difficultMaskVentilation: false,
      assessment: 'Age-appropriate mouth opening and neck movement; no predicted difficult airway',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 120,
      respiratoryRateBpm: 29, delivering: false,
    },
  },
  formulary: [{
    drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
    deliveryModes: ['bolus'], syringeVolumeMl: 10, typicalDose: 50,
    presets: [
      { label: '1 mg/kg', amount: 1, unit: 'mg/kg' },
      { label: '2.5 mg/kg', amount: 2.5, unit: 'mg/kg' },
      { label: '3.5 mg/kg', amount: 3.5, unit: 'mg/kg' },
    ],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'info',
      message: 'A healthy 6-year-old boy weighing 20 kg needs general anesthesia for a non-painful MRI. He has an intravenous cannula and is breathing room air. This case ends after induction and stable delivered ventilation; it does not model maintenance, emergence, pediatric airway-device sizing, or a broad range of childhood physiology.',
    },
    {
      id: 'imaging-team-ready', type: 'narrative', atTick: 4200, severity: 'advisory',
      message: 'The imaging team is ready. Confirm stable oxygenation and ventilation before transfer into the scanner.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'child-oxygen-reserve', objectiveId: 'preoxygenate-child',
      question: 'What end-tidal value showed that preoxygenation had reached the child, and why is the margin shorter than in an adult?',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
    {
      id: 'child-propofol-weight', objectiveId: 'dose-pediatric-propofol',
      question: 'What was the dose in mg/kg, and which parts of the displayed response come from pediatric kinetics versus a teaching calibration?',
      concept: 'hysteresis-and-effect-site-lag',
    },
    {
      id: 'child-ventilation', objectiveId: 'ventilate-child-by-weight',
      question: 'What tidal volume did 6–8 mL/kg produce, and how did end-tidal carbon dioxide guide the rate?',
      concept: 'capnogram-morphology',
    },
    {
      id: 'child-saturation-margin', objectiveId: 'avoid-pediatric-desaturation',
      question: 'What was the lowest saturation after induction, and how quickly did the margin change?',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
  ] },
};

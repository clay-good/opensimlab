/** Early recognition and initial response to volatile-triggered malignant hyperthermia. */

import type { Scenario } from './types';

export const EARLY_MALIGNANT_HYPERTHERMIA_DURING_VOLATILE_ANESTHESIA: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'early-malignant-hyperthermia-during-volatile-anesthesia',
    version: '0.1.0',
    title: 'Early malignant hyperthermia during volatile anesthesia',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 10,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'recognize-mh-hypermetabolism',
        statement: 'Recognize the early hypermetabolic pattern.',
        measure: 'An accepted malignant-hyperthermia response action was recorded within 60 seconds of the first modeled rigidity. This is an action proxy, not a diagnosis.',
      },
      {
        id: 'stop-trigger-and-hyperventilate',
        statement: 'Stop volatile delivery and hyperventilate with 100% oxygen at high fresh-gas flow.',
        measure: 'The vaporizer was at zero, oxygen at least 95%, fresh-gas flow at least 10 L/min, and actively delivered minute ventilation at least twice baseline within 60 seconds of the first modeled rigidity.',
      },
      {
        id: 'give-initial-dantrolene',
        statement: 'Give 2.5 mg/kg intravenous dantrolene promptly and repeat while observable signs persist.',
        measure: 'An accepted 2.5 mg/kg intravenous dantrolene action was recorded within 90 seconds of the first modeled rigidity.',
      },
      {
        id: 'reassess-mh-response',
        statement: 'Reassess carbon dioxide, heart rate, rigidity, and the later temperature trajectory after initial treatment.',
        measure: 'Within 120 seconds after accepted dantrolene, end-tidal carbon dioxide, heart rate, or modeled rigidity fell from its treatment-time value. Temperature is reported as a late sign, not a recognition requirement.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Malignant Hyperthermia Association of the United States. Managing a Crisis. Current web protocol consulted 2026-08-23.',
        'Glahn KPE, et al. Recognition and management of a malignant hyperthermia crisis: updated 2024 guideline from the European Malignant Hyperthermia Group. Br J Anaesth 2025;134:221-3. PMID 39482150',
        'Hopkins PM, et al. Malignant hyperthermia 2020: Guideline from the Association of Anaesthetists. Anaesthesia 2021;76:655-64. PMID 33399225',
        'Larach MG, et al. Clinical presentation, treatment, and complications of malignant hyperthermia in North America from 1987 to 2006. Anesth Analg 2010;110:498-507. PMID 20081135',
      ],
    },
    limitations: [
      'malignant-hyperthermia-is-a-teaching-model',
      'dantrolene-course-is-a-teaching-model',
      'rigidity-is-observable-status-only',
      'malignant-hyperthermia-initial-response-only',
      'fresh-gas-flow-is-a-teaching-model',
      'oxyhaemoglobin-curve-is-fixed',
      'no-team-or-communication',
    ],
  },
  patient: {
    ageYears: 24, sex: 'male', heightCm: 180, weightKg: 80, asaClass: 1,
    diagnosis: 'Anterior cruciate ligament rupture',
    procedure: 'Arthroscopic anterior cruciate ligament reconstruction',
    comorbidities: ['No known comorbidity'], medications: ['None'],
    allergies: ['None known'], fasting: 'Solids eight hours, clear fluids two hours',
    baseline: {
      heartRateBpm: 68, meanArterialMmHg: 92, strokeVolumeMl: 82,
      hemoglobinGPerDl: 14.6, bloodVolumeMl: 5600, coreTemperatureC: 36.7,
      arterialStiffness: 0.9, baroreflexGain: 1.1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Mallampati I, good mouth opening, full neck movement',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 12, delivering: false, freshGasFlowLPerMin: 1,
    },
  },
  formulary: [
    {
      drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
      syringeVolumeMl: 20, typicalDose: 160, deliveryModes: ['bolus', 'infusion'],
      presets: [
        { label: '1 mg/kg', amount: 1, unit: 'mg/kg' },
        { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
      ],
    },
    {
      drugId: 'remifentanil', concentration: 50, concentrationUnit: 'µg/mL',
      syringeVolumeMl: 20, typicalDose: 80,
      presets: [
        { label: '25 µg', amount: 25, unit: 'µg' },
        { label: '0.5 µg/kg', amount: 0.5, unit: 'µg/kg' },
      ],
    },
  ],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'Induce anesthesia, secure the airway, and establish volatile maintenance. Published estimates place malignant hyperthermia between approximately 1 in 10,000 and 1 in 150,000 general anesthetics. This case models early recognition and initial response only; it does not model laboratory-guided acidosis or hyperkalemia treatment, rhabdomyolysis, team actions, or post-crisis care.',
    },
    {
      id: 'volatile-trigger-context', type: 'malignant-hyperthermia',
      target: 'volatile-trigger', value: 1, atTick: 2400, severity: 'warning',
    },
    {
      id: 'reassessment', type: 'narrative', atTick: 5400, severity: 'advisory',
      message: 'Reassess end-tidal carbon dioxide, heart rate, observable rigidity, temperature, trigger delivery, ventilation, fresh-gas flow, and accepted dantrolene. Temperature is a late sign.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'pattern-before-temperature', objectiveId: 'recognize-mh-hypermetabolism',
      question: 'Which change appeared first, and why must recognition not wait for temperature?',
      concept: 'capnogram-morphology',
    },
    {
      id: 'remove-trigger-and-ventilate', objectiveId: 'stop-trigger-and-hyperventilate',
      question: 'When did you stop volatile delivery and establish high-flow 100% oxygen with increased minute ventilation?',
      concept: 'capnogram-morphology',
    },
    {
      id: 'dantrolene-timing', objectiveId: 'give-initial-dantrolene',
      question: 'When did you give the first 2.5 mg/kg IV dantrolene dose, and what prompted repetition or reassessment?',
      concept: 'hysteresis-and-effect-site-lag',
    },
    {
      id: 'bounded-response', objectiveId: 'reassess-mh-response',
      question: 'How did carbon dioxide, heart rate, rigidity, and temperature change, and which unmodeled protocol steps remain clinically required?',
      concept: 'capnogram-morphology',
    },
  ] },
};

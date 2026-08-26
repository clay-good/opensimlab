/** Moderate COPD exacerbation with a fixed emergency-department blood-gas review. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const COPD_EXACERBATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'copd-exacerbation', version: '0.1.0', maturity: 'preview',
    title: 'COPD exacerbation', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 10, difficulty: 'introductory',
    objectives: [
      { id: 'assess-copd-exacerbation-severity', statement: 'Assess exacerbation severity and immediate mimics from symptoms, signs, oxygenation, and one authored blood gas.', measure: 'The fixed whole-patient and blood-gas review preceded treatment.' },
      { id: 'use-controlled-oxygen-in-copd', statement: 'Titrate oxygen to the fixed 88-92% target and retain a plan to review carbon dioxide and pH.', measure: 'Controlled oxygen was recorded after the severity review.' },
      { id: 'give-initial-copd-exacerbation-treatment', statement: 'Pair initial short-acting bronchodilation with a short systemic-corticosteroid course.', measure: 'The fixed air-driven bronchodilator bundle and 5-day corticosteroid intent were both recorded.' },
      { id: 'recognize-copd-antibiotic-indication', statement: 'Use the authored purulent sputum finding to record an antibiotic indication without inventing a prescription.', measure: 'Antibiotic intent was recorded from the declared indication.' },
      { id: 'reassess-copd-respiratory-failure', statement: 'Reassess symptoms, signs, oxygenation, and blood gas before deciding whether ventilatory escalation is needed.', measure: 'Serial reassessment followed all accepted initial actions.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Global Initiative for Chronic Obstructive Lung Disease. Global Strategy for Prevention, Diagnosis and Management of COPD: 2026 Report. Version 1.3; Chapter 4, Figures 4.1, 4.2, 4.5, and 4.6; pp. 93-108.',
      ],
    },
    limitations: [
      'copd-exacerbation-findings-and-blood-gases-are-authored',
      'copd-exacerbation-treatment-is-fixed-or-intent-only',
      'no-copd-ventilatory-support-disposition-or-prevention',
    ],
  },
  patient: {
    ageYears: 67, sex: 'male', heightCm: 174, weightKg: 78, asaClass: 4,
    diagnosis: 'Acute worsening of established COPD',
    procedure: 'Emergency assessment and initial response to a COPD exacerbation',
    comorbidities: ['COPD with one prior exacerbation admission', 'Former tobacco smoking'],
    medications: ['Tiotropium inhaler', 'Salbutamol inhaler as needed'],
    allergies: ['No known drug allergies'], fasting: 'Not established in the emergency department',
    baseline: {
      heartRateBpm: 104, meanArterialMmHg: 88, strokeVolumeMl: 62,
      hemoglobinGPerDl: 15.2, bloodVolumeMl: 5000, coreTemperatureC: 37.2,
      arterialStiffness: 1.15, baroreflexGain: 0.9, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Speaking short phrases with accessory-muscle use, prolonged expiration, and diffuse wheeze',
    },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 450, respiratoryRateBpm: 28,
      delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'copd-exacerbation-onset', type: 'obstruction', value: 0.75,
      durationTicks: 36000, atTick: 0, severity: 'warning',
      message: 'A sustained lower-airway obstruction pattern is present with increased dyspnea, purulent sputum, tachypnea, room-air hypoxemia, and compensated hypercapnia.',
    },
    {
      id: 'copd-exacerbation-boundary', type: 'narrative', target: 'copd-exacerbation',
      atTick: 0, severity: 'advisory',
      message: 'Review severity, immediate mimics, and the fixed blood gas; record controlled oxygen, initial air-driven bronchodilators, short-course systemic-corticosteroid intent, and the authored antibiotic indication; then reassess for response or ventilatory escalation. Examination, testing, technique, individualized treatment, disposition, prevention, and outcome are outside this vignette.',
    },
  ],
  debrief: { rubric: [
    { id: 'copd-severity', objectiveId: 'assess-copd-exacerbation-severity', question: 'Which fixed findings determined severity, and which immediate mimics were checked?' },
    { id: 'copd-oxygen', objectiveId: 'use-controlled-oxygen-in-copd', question: 'Why was oxygen controlled, and why did the blood gas remain part of reassessment?' },
    { id: 'copd-initial-treatment', objectiveId: 'give-initial-copd-exacerbation-treatment', question: 'How did initial bronchodilation and short-course anti-inflammatory intent proceed together?' },
    { id: 'copd-antibiotic', objectiveId: 'recognize-copd-antibiotic-indication', question: 'Which authored feature supported antibiotic intent without selecting a prescription?' },
    { id: 'copd-reassessment', objectiveId: 'reassess-copd-respiratory-failure', question: 'What did the repeat symptoms, signs, oxygenation, and blood gas imply about ventilatory escalation?' },
  ] },
};

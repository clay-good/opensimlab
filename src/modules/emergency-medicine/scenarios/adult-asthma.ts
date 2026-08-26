/** Severe adult asthma exacerbation in a fixed emergency-department vignette. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ADULT_ASTHMA: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'adult-asthma', version: '0.1.0', maturity: 'preview',
    title: 'Adult asthma exacerbation', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'introductory',
    objectives: [
      { id: 'recognize-severe-adult-asthma', statement: 'Assess severity from speech, work of breathing, oxygenation, and expiratory flow while checking immediate alternative causes.', measure: 'The fixed severity and mimic review preceded treatment actions.' },
      { id: 'use-controlled-oxygen-in-adult-asthma', statement: 'Use controlled oxygen for room-air saturation below 92% rather than defaulting to unbounded oxygen.', measure: 'A fixed adult target of 92–95% was recorded after severity review.' },
      { id: 'give-initial-adult-asthma-treatment', statement: 'Pair a conservative fixed inhaled bronchodilator bundle with early systemic-corticosteroid intent.', measure: 'Both initial treatment intents were recorded without implying inhaler technique or a prescription.' },
      { id: 'reassess-adult-asthma-response', statement: 'Reassess symptoms, signs, oxygenation, waveform response, and expiratory flow before repeating treatment automatically.', measure: 'Serial reassessment followed all accepted initial actions.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Global Initiative for Asthma. Global Strategy for Asthma Management and Prevention, 2026 update. Boxes 9-4 and 9-6; pp. 180-188.',
      ],
    },
    limitations: [
      'adult-asthma-findings-and-peak-flow-are-authored',
      'adult-asthma-treatment-is-a-fixed-intent-bundle',
      'no-advanced-asthma-support-disposition-or-prevention',
    ],
  },
  patient: {
    ageYears: 41, sex: 'female', heightCm: 166, weightKg: 68, asaClass: 4,
    diagnosis: 'Severe acute worsening of known asthma',
    procedure: 'Emergency assessment and initial response to an adult asthma exacerbation',
    comorbidities: ['Asthma with one prior hospital admission'],
    medications: ['Budesonide-formoterol inhaler'], allergies: ['No known drug allergies'],
    fasting: 'Not established in the emergency department',
    baseline: {
      heartRateBpm: 118, meanArterialMmHg: 86, strokeVolumeMl: 66,
      hemoglobinGPerDl: 13.5, bloodVolumeMl: 4500, coreTemperatureC: 36.9,
      arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Speaking single words with accessory-muscle use and widespread expiratory wheeze',
    },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 430, respiratoryRateBpm: 34,
      delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'adult-asthma-onset', type: 'obstruction', value: 0.9, durationTicks: 36000,
      atTick: 0, severity: 'critical',
      message: 'A severe lower-airway obstruction pattern is present on arrival, with words-only speech, accessory-muscle use, room-air hypoxemia, and markedly reduced peak flow.',
    },
    {
      id: 'adult-asthma-boundary', type: 'narrative', target: 'adult-asthma',
      atTick: 0, severity: 'advisory',
      message: 'Review severity and immediate mimics, record controlled oxygen, give the fixed initial pMDI-and-spacer bronchodilator bundle, record early systemic-corticosteroid intent, then reassess. Examination, inhaler technique, individualized dosing, repeat or advanced treatment, disposition, and prevention planning are outside this vignette.',
    },
  ],
  debrief: { rubric: [
    { id: 'adult-asthma-severity', objectiveId: 'recognize-severe-adult-asthma', question: 'Which findings made this severe, and which immediate mimics did the fixed review address?' },
    { id: 'adult-asthma-oxygen', objectiveId: 'use-controlled-oxygen-in-adult-asthma', question: 'Why was oxygen indicated here, and why did the action carry an upper target?' },
    { id: 'adult-asthma-initial-treatment', objectiveId: 'give-initial-adult-asthma-treatment', question: 'How did bronchodilation and anti-inflammatory treatment proceed together without treating either as complete care?' },
    { id: 'adult-asthma-reassessment', objectiveId: 'reassess-adult-asthma-response', question: 'What did the repeat whole-patient and peak-flow review add before another treatment cycle?' },
  ] },
};

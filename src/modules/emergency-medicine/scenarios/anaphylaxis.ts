/** Adult emergency-department anaphylaxis after a fixed community food exposure. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ANAPHYLAXIS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'anaphylaxis', version: '0.1.0', maturity: 'draft',
    title: 'Anaphylaxis', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 7, difficulty: 'introductory',
    objectives: [
      { id: 'recognize-ed-anaphylaxis-pattern', statement: 'Recognize abrupt airway, breathing, and circulation compromise after a plausible exposure without waiting for skin findings.', measure: 'The fixed multisystem pattern was reviewed before treatment actions.' },
      { id: 'give-first-line-im-epinephrine', statement: 'Position the patient, mobilize help, and record the fixed adult first-line intramuscular epinephrine action.', measure: 'Recumbent positioning and help preceded 500 micrograms of IM epinephrine.' },
      { id: 'support-anaphylaxis-airway-and-circulation', statement: 'Add high-flow oxygen and early isotonic crystalloid for respiratory distress and cardiovascular instability.', measure: 'High-flow oxygen and the fixed 20 mL/kg crystalloid bolus followed first-line epinephrine.' },
      { id: 'reassess-initial-anaphylaxis-response', statement: 'Reassess airway, breathing, circulation, mental status, and monitor response after initial treatment.', measure: 'Serial reassessment followed all accepted initial-response actions.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Resuscitation Council UK. Special circumstances guidelines: management and prevention of cardiac arrest due to anaphylaxis. Published October 27, 2025.',
        'Cardona V, Ansotegui IJ, Ebisawa M, et al. World Allergy Organization anaphylaxis guidance 2020. World Allergy Organ J. 2020;13:100472. doi:10.1016/j.waojou.2020.100472.',
      ],
    },
    limitations: [
      'emergency-anaphylaxis-findings-are-authored',
      'emergency-anaphylaxis-actions-are-bounded',
      'no-refractory-anaphylaxis-airway-or-outcome',
    ],
  },
  patient: {
    ageYears: 34, sex: 'male', heightCm: 178, weightKg: 75, asaClass: 4,
    diagnosis: 'Abrupt multisystem reaction after a community food exposure',
    procedure: 'Emergency recognition and initial response to suspected anaphylaxis',
    comorbidities: ['Mild asthma'], medications: ['Salbutamol inhaler as needed'],
    allergies: ['Known peanut allergy reported by companion'],
    fasting: 'Recent food exposure before emergency-department arrival',
    baseline: {
      heartRateBpm: 112, meanArterialMmHg: 76, strokeVolumeMl: 64,
      hemoglobinGPerDl: 14.1, bloodVolumeMl: 5000, coreTemperatureC: 36.8,
      arterialStiffness: 1, baroreflexGain: 0.9, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Speaking in broken phrases; visible lip and tongue swelling; no airway procedure performed',
    },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 450, respiratoryRateBpm: 24,
      delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'community-food-exposure', type: 'anaphylaxis', target: 'community-food-exposure',
      value: 0.85, atTick: 0, severity: 'critical',
      message: 'Soon after a likely peanut exposure, lip and tongue swelling, widespread wheeze, hypoxemia, hypotension, and impaired perfusion develop together.',
    },
    {
      id: 'emergency-anaphylaxis-boundary', type: 'narrative', target: 'emergency-anaphylaxis',
      atTick: 0, severity: 'advisory',
      message: 'Review the fixed systemic pattern, record safe positioning and emergency help, give the fixed adult first-line IM epinephrine action, add oxygen and crystalloid, then reassess. Diagnosis, injection technique, repeat-dose timing, refractory care, observation, and outcome are outside this vignette.',
    },
  ],
  debrief: { rubric: [
    { id: 'ed-anaphylaxis-recognition', objectiveId: 'recognize-ed-anaphylaxis-pattern', question: 'Which airway, breathing, and circulation findings made immediate treatment appropriate despite absent skin findings?' },
    { id: 'ed-anaphylaxis-first-line', objectiveId: 'give-first-line-im-epinephrine', question: 'How did positioning, help, route, and the fixed adult first-line action fit together?' },
    { id: 'ed-anaphylaxis-support', objectiveId: 'support-anaphylaxis-airway-and-circulation', question: 'Which supportive actions followed first-line epinephrine, and what remains individualized in real care?' },
    { id: 'ed-anaphylaxis-reassessment', objectiveId: 'reassess-initial-anaphylaxis-response', question: 'What did you reassess, and what does the bounded monitor recovery not prove?' },
  ] },
};

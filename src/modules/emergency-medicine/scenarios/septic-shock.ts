/** Adult septic shock: parallel infection treatment, resuscitation, and source-control escalation. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const SEPTIC_SHOCK: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'septic-shock', version: '0.1.0', maturity: 'preview',
    title: 'Septic shock', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'introductory',
    objectives: [
      { id: 'recognize-probable-sepsis-with-shock', statement: 'Join probable infection, new organ dysfunction, and impaired perfusion without relying on one test.', measure: 'The fixed infection and organ-dysfunction evidence was reviewed together.' },
      { id: 'pair-diagnostics-with-immediate-antimicrobial-intent', statement: 'Record cultures and lactate without delaying immediate empiric antimicrobial intent.', measure: 'Diagnostic intent preceded antimicrobial intent inside the authored one-hour window.' },
      { id: 'give-initial-sepsis-fluid-and-reassess', statement: 'Begin the fixed initial crystalloid course, then reassess rather than continuing fluid automatically.', measure: 'The 30 mL/kg course was followed by serial perfusion reassessment.' },
      { id: 'support-persistent-shock-and-escalate-source-control', statement: 'Support persistent shock while urgent source-control evaluation proceeds in parallel.', measure: 'Norepinephrine intent and source-control escalation were both recorded without making one wait for the other.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Surviving Sepsis Campaign. International Guidelines for Management of Sepsis and Septic Shock 2026. Society of Critical Care Medicine and European Society of Intensive Care Medicine.',
        'Monnet X, Messina A, Greco M, et al. ESICM guidelines on circulatory shock and hemodynamic monitoring 2025. Intensive Care Med. 2025;51:1971-2012. doi:10.1007/s00134-025-08137-z.',
      ],
    },
    limitations: [
      'sepsis-findings-and-results-are-authored',
      'sepsis-treatment-controls-record-bounded-intent',
      'no-sepsis-pathogen-procedure-dose-or-outcome',
    ],
  },
  patient: {
    ageYears: 63, sex: 'female', heightCm: 165, weightKg: 70, asaClass: 4,
    diagnosis: 'Probable infection with shock and new organ dysfunction',
    procedure: 'Emergency assessment and initial response to probable septic shock',
    comorbidities: ['Type 2 diabetes mellitus'], medications: ['Metformin'],
    allergies: ['No allergy history available at arrival'],
    fasting: 'Not established in the emergency department',
    baseline: {
      heartRateBpm: 126, meanArterialMmHg: 52, strokeVolumeMl: 46,
      hemoglobinGPerDl: 12.2, bloodVolumeMl: 4000, coreTemperatureC: 39.2,
      arterialStiffness: 1.1, baroreflexGain: 0.85, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Speaking in short sentences; no fixed airway obstruction finding',
    },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 460, respiratoryRateBpm: 24,
      delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'sepsis-pattern-at-arrival', type: 'sepsis-pattern',
      target: 'probable-urinary-source-with-shock', value: 1, atTick: 0, severity: 'critical',
      message: 'Probable infection, organ dysfunction, and impaired perfusion are present together. The source and pathogen remain unconfirmed.',
    },
    {
      id: 'septic-shock-lesson-boundary', type: 'narrative', target: 'septic-shock',
      atTick: 0, severity: 'advisory',
      message: 'Record early cultures and lactate, immediate empiric antimicrobial intent, initial balanced crystalloid, serial reassessment, first-line norepinephrine intent, and urgent source-control escalation. Drug selection, dosing, procedures, and outcome are outside this vignette.',
    },
  ],
  debrief: { rubric: [
    { id: 'sepsis-recognition', objectiveId: 'recognize-probable-sepsis-with-shock', question: 'Which findings made this a probable infection with organ dysfunction and shock rather than a fever alone?' },
    { id: 'sepsis-antimicrobial-timing', objectiveId: 'pair-diagnostics-with-immediate-antimicrobial-intent', question: 'How did you preserve cultures before antimicrobials without waiting for results?' },
    { id: 'sepsis-fluid-reassessment', objectiveId: 'give-initial-sepsis-fluid-and-reassess', question: 'What did the fixed post-fluid reassessment change about the next action?' },
    { id: 'sepsis-source-control', objectiveId: 'support-persistent-shock-and-escalate-source-control', question: 'Why did vasopressor support and source-control escalation proceed together?' },
  ] },
};

/** Emergency-department undifferentiated shock: serial perfusion assessment and one bounded response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const UNDIFFERENTIATED_SHOCK: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'undifferentiated-shock', version: '0.1.0', maturity: 'preview',
    title: 'Undifferentiated shock', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'introductory',
    objectives: [
      { id: 'recognize-shock-from-perfusion', statement: 'Recognize shock from serial tissue-perfusion evidence, not pressure alone.', measure: 'Fixed skin, brain, kidney, pressure, and lactate evidence were reviewed.' },
      { id: 'assess-shock-phenotype', statement: 'Use focused cardiac findings to narrow the shock pattern without claiming a definitive diagnosis.', measure: 'The fixed focused-ultrasound phenotype followed whole-patient assessment.' },
      { id: 'test-fluid-responsiveness', statement: 'Check a dynamic response before a bounded fluid challenge.', measure: 'Passive-leg-raise response preceded the fixed 500 mL challenge.' },
      { id: 'reassess-and-escalate-shock', statement: 'Reassess the same perfusion markers and escalate the unresolved etiologic workup.', measure: 'Serial reassessment preceded ongoing shock escalation.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Monnet X, Messina A, Greco M, et al. ESICM guidelines on circulatory shock and hemodynamic monitoring 2025. Intensive Care Med. 2025;51:1971-2012. doi:10.1007/s00134-025-08137-z.',
        'Arabi YM, Belley-Cote E, Carsetti A, et al. ESICM clinical practice guideline on fluid therapy in adult critically ill patients. Part 1. Intensive Care Med. 2024;50:813-831. doi:10.1007/s00134-024-07369-9.',
      ],
    },
    limitations: [
      'shock-findings-are-a-fixed-vignette',
      'shock-ultrasound-and-plr-are-authored-results',
      'no-shock-etiology-definitive-treatment-or-outcome',
    ],
  },
  patient: {
    ageYears: 58, sex: 'female', heightCm: 168, weightKg: 72, asaClass: 4,
    diagnosis: 'Undifferentiated circulatory shock',
    procedure: 'Emergency assessment of undifferentiated shock',
    comorbidities: ['Hypertension'], medications: ['Lisinopril'], allergies: ['None documented'],
    fasting: 'Not established in the emergency department',
    baseline: {
      heartRateBpm: 118, meanArterialMmHg: 58, strokeVolumeMl: 42,
      hemoglobinGPerDl: 11.4, bloodVolumeMl: 3800, coreTemperatureC: 37.8,
      arterialStiffness: 1.1, baroreflexGain: 0.9, fixedStrokeVolume: false,
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
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 460, respiratoryRateBpm: 22,
      delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'shock-pattern-at-arrival', type: 'shock-pattern', target: 'fluid-responsive-low-preload',
      value: 1, atTick: 0, severity: 'critical',
      message: 'Persistent hypotension accompanies fixed tissue-hypoperfusion findings. The cause is not named.',
    },
    {
      id: 'shock-lesson-boundary', type: 'narrative', target: 'undifferentiated-shock',
      atTick: 0, severity: 'advisory',
      message: 'Assess skin, brain, kidney, pressure, lactate, fixed focused cardiac findings, and dynamic fluid responsiveness. Reassess after one bounded challenge; definitive diagnosis and treatment are outside this vignette.',
    },
  ],
  debrief: { rubric: [
    { id: 'shock-recognition', objectiveId: 'recognize-shock-from-perfusion', question: 'Which findings established impaired tissue perfusion despite uncertainty about cause?' },
    { id: 'shock-phenotype', objectiveId: 'assess-shock-phenotype', question: 'What did the fixed focused cardiac findings narrow, and what did they not diagnose?' },
    { id: 'shock-fluid-response', objectiveId: 'test-fluid-responsiveness', question: 'Why did the dynamic response come before the bounded fluid challenge?' },
    { id: 'shock-reassessment', objectiveId: 'reassess-and-escalate-shock', question: 'Which same markers needed serial reassessment before escalation?' },
  ] },
};

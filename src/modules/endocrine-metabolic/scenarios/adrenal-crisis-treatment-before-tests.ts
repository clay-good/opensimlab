import type { Scenario } from '@anesthesia/scenarios/types';

export const ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'adrenal-crisis-treatment-before-tests', version: '0.1.2', maturity: 'preview',
    title: 'Adrenal crisis: treatment cannot wait for tests', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 15, difficulty: 'intermediate',
    objectives: [
      { id: 'adrenal-urgent-steroid', statement: 'Start qualified parenteral hydrocortisone without waiting for diagnostic results.', measure: 'Hydrocortisone is accepted without a wait-for-cortisol or oral-only choice; the record is not a treatment prerequisite.' },
      { id: 'adrenal-combined-rescue', statement: 'Coordinate steroid coverage, fluid resuscitation, and qualified support together.', measure: 'Both rescue pathways and qualified support are active; partial treatment is not mistaken for complete rescue.' },
      { id: 'adrenal-reassessment', statement: 'Reassess the person after treatment rather than assuming a response.', measure: 'A fresh bedside assessment records the timed combined-treatment response.' },
      { id: 'adrenal-continuity', statement: 'Find the interrupted replacement and keep recurrence prevention in the handoff.', measure: 'The record, ongoing coverage, monitoring, precipitant care, and prevention plan are handed off without claiming discharge safety.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.2',
      sources: [
        'Endocrine Society. Diagnosis and Treatment of Primary Adrenal Insufficiency. 2016. Recommendations 1.1–1.3 and 4.1–4.6.',
        'Society for Endocrinology. Adrenal Crisis Information. Emergency treatment and prevention guidance. Consulted 2026-08-26.',
        'NICE. Adrenal insufficiency: identification and management. NG243. 2024. Recommendations 1.6–1.7.',
      ],
    },
    limitations: ['adrenal-authored-response-not-kinetics', 'adrenal-rescue-not-dose-or-technique', 'adrenal-handoff-not-resolution'],
  },
  patient: {
    ageYears: 46, sex: 'female', heightCm: 166, weightKg: 66, asaClass: 4,
    diagnosis: 'Known primary adrenal insufficiency, persistent vomiting, weakness, and shock', procedure: 'Adrenal crisis recognition and continuity rehearsal',
    comorbidities: ['Primary adrenal insufficiency'], medications: ['Replacement medication record available to review'],
    allergies: ['No known drug allergies'], fasting: 'Vomiting; unable to retain oral intake',
    baseline: { heartRateBpm: 124, meanArterialMmHg: 55, strokeVolumeMl: 48, hemoglobinGPerDl: 13, bloodVolumeMl: 4100, coreTemperatureC: 38.1, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Weak and drowsy, breathing spontaneously, with persistent vomiting' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 450, respiratoryRateBpm: 24, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'adrenal-presentation', type: 'narrative', target: 'adrenal-crisis', atTick: 0, severity: 'critical', message: 'A 46-year-old woman with known primary adrenal insufficiency has persistent vomiting, weakness, fever, and drowsiness. Supplied BP 78/44 mmHg, HR 124/min, RR 24/min, room-air SpO2 98%, temperature 38.1°C. The replacement and initial laboratory record can be reviewed, but must not delay emergency treatment. Consider infection and other shock causes in parallel.' },
    { id: 'adrenal-boundary', type: 'narrative', target: 'adrenal-crisis-boundary', atTick: 0, severity: 'warning', message: 'This dose-free lesson rehearses immediate qualified parenteral hydrocortisone, isotonic saline, support, repeated bedside assessment, and continuity. No diagnostic test or full history is required before steroid treatment. The 5-minute incomplete-rescue branch, 10-minute combined-response checkpoint, and 30-minute instructor takeover are authored teaching clocks, never safe waiting periods or response predictions. Use 60× speed for observation periods and pause to think. Improvement does not establish a diagnosis, recovery, or discharge readiness.' },
  ],
  replayPoints: [{ id: 'adrenal-first-decision', label: 'Return to the urgent steroid decision', objectiveId: 'adrenal-urgent-steroid', atTick: 1, reason: 'Compare timely combined rescue with waiting for a diagnostic result or relying on only one treatment.' }],
  debrief: { rubric: [
    { id: 'adrenal-urgency', objectiveId: 'adrenal-urgent-steroid', question: 'Which information was useful, and which information could not be allowed to delay rescue?' },
    { id: 'adrenal-parallel-care', objectiveId: 'adrenal-combined-rescue', question: 'Why were steroid replacement, volume support, and qualified help complementary rather than alternatives?' },
    { id: 'adrenal-response', objectiveId: 'adrenal-reassessment', question: 'What did the new bedside observation show, and which laboratory or fluid-balance questions remained unanswered?' },
    { id: 'adrenal-prevention', objectiveId: 'adrenal-continuity', question: 'How would the receiving team preserve steroid coverage and reduce another interruption during illness?' },
  ] },
};

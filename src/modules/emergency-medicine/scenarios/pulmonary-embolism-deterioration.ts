/** Confirmed acute pulmonary embolism with authored early hemodynamic deterioration. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PULMONARY_EMBOLISM_DETERIORATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pulmonary-embolism-deterioration', version: '0.1.0', maturity: 'preview',
    title: 'Pulmonary embolism with deterioration', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 10, difficulty: 'intermediate',
    objectives: [
      { id: 'classify-acute-pe-severity', statement: 'Integrate the confirmed pulmonary embolism, right-ventricular findings, biomarkers, oxygenation, respiratory rate, pressure, and perfusion into a serial severity assessment.', measure: 'The fixed initial Category C3R pattern was reviewed before treatment.' },
      { id: 'support-and-anticoagulate-acute-pe', statement: 'Record titrated oxygen and immediate therapeutic anticoagulation intent while avoiding unnecessary deep sedation and intubation.', measure: 'Both bounded initial intents followed severity review.' },
      { id: 'recognize-pe-deterioration', statement: 'Reassess for hypotension and hypoperfusion, recognizing progression to cardiopulmonary failure.', measure: 'The authored Category E1 deterioration was identified after initial treatment.' },
      { id: 'escalate-deteriorating-pe', statement: 'Activate multidisciplinary pulmonary embolism response and record urgent reperfusion-strategy intent.', measure: 'Team escalation and reperfusion intent followed recognition of deterioration.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Creager MA, et al. 2026 Guideline for the Evaluation and Management of Acute Pulmonary Embolism in Adults. Circulation. 2026;153:e977-e1051. doi:10.1161/CIR.0000000000001415.',
        'American Heart Association. Top Take-Home Messages for the Emergency Physician: Acute Pulmonary Embolism in Adults. 2026.',
        'American Heart Association and American College of Cardiology. Acute Pulmonary Embolism Clinical Categories. 2026.',
      ],
    },
    limitations: [
      'pulmonary-embolism-findings-and-deterioration-are-authored',
      'pulmonary-embolism-support-anticoagulation-and-reperfusion-are-intent-controls',
      'no-pulmonary-embolism-procedure-disposition-or-outcome',
    ],
  },
  patient: {
    ageYears: 63, sex: 'female', heightCm: 168, weightKg: 82, asaClass: 4,
    diagnosis: 'Confirmed acute pulmonary embolism with right-ventricular dysfunction',
    procedure: 'Emergency reassessment and escalation of deteriorating acute pulmonary embolism',
    comorbidities: ['Breast cancer on active treatment'], medications: ['Anastrozole'],
    allergies: ['No known drug allergies'], fasting: 'Not established in the emergency department',
    baseline: {
      heartRateBpm: 124, meanArterialMmHg: 84, strokeVolumeMl: 42,
      hemoglobinGPerDl: 12.4, bloodVolumeMl: 5000, coreTemperatureC: 36.9,
      arterialStiffness: 1.1, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Alert, anxious, speaking short phrases, with marked tachypnea and no upper-airway obstruction' },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 420, respiratoryRateBpm: 30, delivering: false },
  },
  formulary: [],
  timeline: [{
    id: 'pulmonary-embolism-deterioration-boundary', type: 'narrative',
    target: 'pulmonary-embolism-deterioration', atTick: 0, severity: 'critical',
    message: 'A fixed, imaging-confirmed acute pulmonary embolism begins with Category C3R features and then deteriorates after initial support. Review severity, record oxygen and anticoagulation intent, reassess the authored change, and escalate multidisciplinary reperfusion planning. Test acquisition, drug selection or dosing, airway technique, procedure selection or performance, contraindication adjudication, transfer, disposition, and outcome are outside this vignette.',
  }],
  debrief: { rubric: [
    { id: 'pe-severity', objectiveId: 'classify-acute-pe-severity', question: 'Which fixed findings established the initial acute PE category and respiratory modifier?' },
    { id: 'pe-initial-response', objectiveId: 'support-and-anticoagulate-acute-pe', question: 'How did oxygenation, anticoagulation, and right-ventricular risk shape the initial response?' },
    { id: 'pe-deterioration', objectiveId: 'recognize-pe-deterioration', question: 'Which serial pressure and perfusion findings changed the category?' },
    { id: 'pe-escalation', objectiveId: 'escalate-deteriorating-pe', question: 'Why did the deterioration require immediate team escalation and reperfusion planning?' },
  ] },
};

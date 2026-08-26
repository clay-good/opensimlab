/** Bounded adult moderate diabetic-ketoacidosis pathway. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const DIABETIC_KETOACIDOSIS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'diabetic-ketoacidosis', version: '0.1.0', maturity: 'preview',
    title: 'Diabetic ketoacidosis', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 10, difficulty: 'intermediate', objectives: [
      { id: 'recognize-moderate-dka', statement: 'Recognize DKA from diabetes or hyperglycemia, ketonemia, and metabolic acidosis while reviewing severity and precipitant.', measure: 'The fixed triad, dehydration, potassium, mental status, and failed infusion set were integrated.' },
      { id: 'begin-dka-fluid-and-monitoring-path', statement: 'Record initial isotonic fluid, monitoring, access, and serial laboratory intent.', measure: 'The bounded support bundle followed recognition.' },
      { id: 'correct-dka-potassium-before-insulin', statement: 'Delay insulin while potassium is below 3.5 mmol/L and record replacement plus monitoring.', measure: 'Potassium correction from 3.2 to an authored 3.7 mmol/L preceded insulin intent.' },
      { id: 'continue-insulin-with-dextrose-until-dka-resolves', statement: 'Record IV insulin only after the potassium gate, then add dextrose when glucose falls below 250 mg/dL while ketoacidosis persists.', measure: 'Insulin followed potassium correction and continued with dextrose through the unresolved panel.' },
      { id: 'confirm-dka-resolution-and-transition', statement: 'Use plasma ketone and pH or bicarbonate criteria to confirm resolution, then record overlap and precipitant-safe transition.', measure: 'The fixed resolution panel, transition overlap, device failure, and recurrence prevention were handed off.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Umpierrez GE, et al. Hyperglycemic Crises in Adults With Diabetes: A Consensus Report. Diabetes Care. 2024;47(8):1257-1275. doi:10.2337/dci24-0032.',
        'American Diabetes Association Professional Practice Committee. Diabetes Care in the Hospital: Standards of Care in Diabetes—2026. Diabetes Care. 2026;49(Suppl 1):S339-S363.',
      ],
    },
    limitations: ['dka-diagnosis-panels-and-response-are-authored',
      'dka-fluid-potassium-insulin-dextrose-and-transition-controls-are-proxies',
      'no-live-dka-labs-infusion-electrolyte-fluid-complication-or-outcome'],
  },
  patient: {
    ageYears: 29, sex: 'female', heightCm: 165, weightKg: 62, asaClass: 4,
    diagnosis: 'Moderate diabetic ketoacidosis with hypokalemia after insulin-infusion-set failure',
    procedure: 'Emergency fluid, electrolyte, insulin, and transition pathway',
    comorbidities: ['Type 1 diabetes mellitus'], medications: ['Insulin lispro by pump'],
    allergies: ['No known drug allergies'], fasting: 'Vomiting with minimal intake since yesterday',
    baseline: { heartRateBpm: 118, meanArterialMmHg: 75, strokeVolumeMl: 50,
      hemoglobinGPerDl: 15.2, bloodVolumeMl: 3900, coreTemperatureC: 37.1,
      arterialStiffness: 1.0, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert and protecting the airway; deep spontaneous breathing' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 560,
      respiratoryRateBpm: 28, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'dka-presentation', type: 'narrative', target: 'diabetic-ketoacidosis', atTick: 0,
      severity: 'critical', message: 'A 29-year-old with type 1 diabetes has 18 hours of polyuria, thirst, vomiting, abdominal discomfort, and weakness. She is alert with deep breathing, dry mucosa, HR 118/min, BP 98/64 mmHg, and a kinked insulin-pump infusion set. Fixed initial panel: glucose 486 mg/dL, β-hydroxybutyrate 5.4 mmol/L, venous pH 7.16, bicarbonate 11 mmol/L, and potassium 3.2 mmol/L. No infection or mixed hyperosmolar state is authored.' },
    { id: 'dka-boundary', type: 'narrative', target: 'diabetic-ketoacidosis-boundary', atTick: 0,
      severity: 'warning', message: 'Recognize moderate DKA, record initial isotonic fluid and serial monitoring, replace potassium and delay insulin until the authored repeat is above 3.5 mmol/L, then record IV insulin intent. When a later fixed panel shows glucose 238 mg/dL with persistent ketoacidosis, add dextrose and continue insulin. Confirm resolution with plasma ketone below 0.6 mmol/L plus venous pH at least 7.3 or bicarbonate at least 18 mmol/L; do not use anion gap or urine ketones alone. Examination, specimens, fluid selection or delivery, electrolyte dosing, insulin delivery, laboratory kinetics, complications, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'dka-recognition', objectiveId: 'recognize-moderate-dka', question: 'Which 3 biochemical domains established DKA, and what fixed findings shaped severity and cause?' },
    { id: 'dka-fluids', objectiveId: 'begin-dka-fluid-and-monitoring-path', question: 'Why did fluid and serial monitoring begin before insulin?' },
    { id: 'dka-potassium', objectiveId: 'correct-dka-potassium-before-insulin', question: 'Why did potassium 3.2 mmol/L lock the insulin step?' },
    { id: 'dka-insulin-dextrose', objectiveId: 'continue-insulin-with-dextrose-until-dka-resolves', question: 'Why did dextrose join rather than stop insulin at glucose 238 mg/dL?' },
    { id: 'dka-resolution', objectiveId: 'confirm-dka-resolution-and-transition', question: 'Which fixed values proved resolution, and what made the transition safe from recurrence?' },
  ] },
};

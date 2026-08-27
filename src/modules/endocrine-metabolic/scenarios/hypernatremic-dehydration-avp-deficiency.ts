import type { Scenario } from '@anesthesia/scenarios/types';

export const HYPERNATREMIC_DEHYDRATION_AVP_DEFICIENCY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'hypernatremic-dehydration-avp-deficiency', version: '0.1.0', maturity: 'preview',
    title: 'Hypernatremic dehydration: circulation, then water balance', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 135, difficulty: 'intermediate',
    objectives: [
      { id: 'avp-context', statement: 'Recognize known vasopressin deficiency, omitted medication, and lost access to water.', measure: 'Review the supplied diagnosis, omitted prescribed desmopressin, unknown hypernatremia duration, and water-access problem with qualified support, without treating low initial urine output as excluding AVP deficiency.' },
      { id: 'avp-circulation', statement: 'Prioritize circulation and reassess the response.', measure: 'Begin qualified volume restoration without an administrative or laboratory gate and explicitly observe the later circulation response; delayed restoration remains in the record.' },
      { id: 'avp-water-control', statement: 'Address water deficit and ongoing renal water loss as distinct problems.', measure: 'After circulation is restored, qualified water replacement and desmopressin can proceed independently without a new laboratory or administrative gate; normalization and blanket withholding choices remain evidence.' },
      { id: 'avp-reassessment', statement: 'Confirm a later trajectory without mistaking less urine for corrected sodium.', measure: 'Request historical findings after circulation and after combined care; retain the highest observed sodium and distinguish a partial response from normalization or safety.' },
      { id: 'avp-handoff', statement: 'Transfer continuing correction, medication, and water-access responsibilities.', measure: 'Qualified support, context review, surveillance, both response requests, and fresh later evidence support a continuing-care handoff, not discharge.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0',
      sources: [
        'Baldeweg SE et al. Society for Endocrinology Clinical Guidance: Inpatient management of cranial diabetes insipidus. Endocrine Connections. 2018;7:G8–G11. doi:10.1530/EC-18-0154. Decompensated CDI sections §§1–6: circulation, fluid replacement, reassessment, desmopressin, and continuing specialist care. Current issuing-body AVP-D page retains this guidance; authored checkpoints are not clinical intervals.',
        'Tomkins M et al. Diagnosis and Management of Central Diabetes Insipidus in Adults. Journal of Clinical Endocrinology & Metabolism. 2022;107:2701–2715. doi:10.1210/clinem/dgac381. Management of chronic CDI and inpatient/perioperative care: medication omission, water access, and coordinated care; review article, not a new guideline.',
      ],
    },
    limitations: ['avp-deficiency-authored-checkpoints', 'avp-deficiency-known-diagnosis', 'avp-deficiency-qualified-water-plan'],
  },
  patient: {
    ageYears: 67, sex: 'male', heightCm: 178, weightKg: 72, asaClass: 4,
    diagnosis: 'Hypernatremic dehydration with established arginine vasopressin deficiency',
    procedure: 'Qualified circulation restoration, water replacement, desmopressin reconciliation, reassessment, and continuing care',
    comorbidities: ['Established isolated AVP deficiency after remote pituitary surgery', 'Unknown duration of hypernatremia',
      'Supplied potassium 3.8 mmol/L and creatinine 1.6 mg/dL'],
    medications: ['Two scheduled prescribed desmopressin doses omitted during the current admission'],
    allergies: ['No known drug allergies'], fasting: 'Water access has been restricted during an intercurrent illness; qualified swallowing and route review remain necessary',
    baseline: { heartRateBpm: 112, meanArterialMmHg: 66, strokeVolumeMl: 55, hemoglobinGPerDl: 13.6,
      bloodVolumeMl: 4200, coreTemperatureC: 37.1, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Awake with a patent airway; clinical hydration and swallowing assessment remain with the qualified team' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21,
    tidalVolumeMl: 450, respiratoryRateBpm: 20, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'avp-deficiency-presentation', type: 'narrative', target: 'avp-deficiency', atTick: 0, severity: 'critical',
      message: 'A fictional 67-year-old man, 72 kg, has established isolated AVP deficiency, formerly central diabetes insipidus. Two prescribed desmopressin doses were omitted and access to drinking water was restricted during this admission. Supplied sodium is 162 mmol/L, potassium 3.8 mmol/L, and creatinine 1.6 mg/dL; the duration of hypernatremia is unknown. He is awake, thirsty, and tired, with BP 90/54 mmHg, HR 112/min, RR 20/min, SpO2 98%, temperature 37.1°C, and supplied urine output 60 mL/hour. Low urine output during depleted circulation does not exclude his known condition. Begin qualified fluid and circulation care; new sodium and urine findings require explicit reassessment.' },
    { id: 'avp-deficiency-boundary', type: 'narrative', target: 'avp-deficiency-boundary', atTick: 0, severity: 'warning',
      message: 'This dose-free lesson distinguishes circulation restoration, water replacement, and control of ongoing water loss. After circulation is restored, qualified water and desmopressin requests do not require a new laboratory result or administrative acknowledgment. The 15-minute circulation, 30-minute urine, and 120-minute combined-care changes are authored contrasts, not clinical kinetics or mandatory waits. Reassess earlier whenever needed. Sodium is not a live monitor value. Unknown duration is not acute sodium loading; no numerical prescription, water-deficit formula, automatic redosing, or brain-injury prediction is provided. The 60-minute untreated and 300-minute unfinished stops are teaching bounds, not safe deadlines. Both practice regions use the same selected pathway. Generic ventilator settings are inactive; FiO2 and exhaled CO2 are unavailable. Continuing care must restore reliable medication and water access, not merely improve a number.' },
  ],
  replayPoints: [{ id: 'avp-deficiency-first-response', label: 'Return to circulation and water access', objectiveId: 'avp-circulation',
    atTick: 1, reason: 'Compare early circulation support and coordinated water-loss management with delayed or incomplete care.' }],
  debrief: { rubric: [
    { id: 'avp-context-review', objectiveId: 'avp-context', question: 'How did medication and water access explain the risk despite low initial urine output?' },
    { id: 'avp-circulation-review', objectiveId: 'avp-circulation', question: 'What changed after circulation support, and which requested findings showed it?' },
    { id: 'avp-water-control-review', objectiveId: 'avp-water-control', question: 'Why did water replacement and desmopressin address different parts of the problem?' },
    { id: 'avp-reassessment-review', objectiveId: 'avp-reassessment', question: 'What did later urine and sodium findings establish, and what remained unresolved?' },
    { id: 'avp-handoff-review', objectiveId: 'avp-handoff', question: 'Who owns continuing sodium, fluid balance, medication reliability, and safe water access?' },
  ] },
};

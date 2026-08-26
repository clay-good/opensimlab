/** Bounded adult severe-symptomatic-hyponatremia pathway after a witnessed seizure. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const SEVERE_HYPONATREMIA_WITH_SEIZURE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'severe-hyponatremia-with-seizure', version: '0.1.0', maturity: 'preview',
    title: 'Severe hyponatremia with seizure', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'advanced', objectives: [
      { id: 'recognize-severe-symptomatic-hyponatremia', statement: 'Recognize severe symptomatic hypotonic hyponatremia from the seizure, depressed alertness, confirmed sodium, glucose, and osmolality.', measure: 'The fixed neurologic and biochemical emergency was integrated without waiting for full cause classification.' },
      { id: 'stabilize-severe-hyponatremia', statement: 'Record injury protection, airway and breathing support, monitoring, access, glucose review, and expert escalation in parallel.', measure: 'The bounded stabilization bundle followed recognition without delaying sodium-directed treatment.' },
      { id: 'record-hypertonic-saline-intent', statement: 'Record immediate local-protocol intermittent hypertonic-saline bolus intent in a closely monitored setting.', measure: 'Symptom-led hypertonic-saline intent preceded the authored first-hour reassessment.' },
      { id: 'reassess-early-sodium-and-neurologic-response', statement: 'Review the fixed first-hour neurologic state and sodium rise, then stop hypertonic saline after the immediate target is met.', measure: 'A 5 mmol/L rise and improved alertness triggered a stop rather than normalization.' },
      { id: 'prevent-hyponatremia-overcorrection', statement: 'Set correction ceilings, monitor sodium and urine output, investigate the cause, stop contributors, and retain an overcorrection contingency.', measure: 'The first-day guardrail, serial surveillance, thiazide hold, diagnostic plan, and specialist rescue boundary were handed off.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Society for Endocrinology. Emergency management of severe and moderately severely symptomatic hyponatraemia in adult patients. Revised 2022.',
        'Spasovski G, et al. Clinical practice guideline on diagnosis and treatment of hyponatraemia. Eur J Endocrinol. 2014;170(3):G1-G47. doi:10.1530/EJE-13-1020.',
      ],
    },
    limitations: ['hyponatremia-neurologic-laboratory-and-response-panels-are-authored',
      'hyponatremia-stabilization-hypertonic-monitoring-and-cause-controls-are-proxies',
      'no-live-hyponatremia-exam-labs-dosing-correction-cause-rescue-or-outcome'],
  },
  patient: {
    ageYears: 58, sex: 'female', heightCm: 164, weightKg: 66, asaClass: 4,
    diagnosis: 'Severe symptomatic hypotonic hyponatremia after a witnessed seizure',
    procedure: 'Emergency stabilization, hypertonic-saline intent, and correction surveillance',
    comorbidities: ['Hypertension'], medications: ['Chlorthalidone'],
    allergies: ['No known drug allergies'], fasting: 'Nausea, poor solid intake, and high free-water intake for 3 days',
    baseline: { heartRateBpm: 92, meanArterialMmHg: 84, strokeVolumeMl: 60,
      hemoglobinGPerDl: 12.8, bloodVolumeMl: 4500, coreTemperatureC: 36.9,
      arterialStiffness: 1.2, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Postictal, deeply somnolent, breathing spontaneously; no ongoing convulsion is authored' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 470,
      respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'hyponatremia-presentation', type: 'narrative', target: 'severe-hyponatremia-with-seizure',
      atTick: 0, severity: 'critical', message: 'A 58-year-old taking chlorthalidone has had nausea, poor solid intake, and high free-water intake for 3 days. A witnessed 75-second generalized seizure has stopped, but she remains deeply somnolent and breathing spontaneously. Fixed repeat panel: sodium 112 mmol/L, glucose 96 mg/dL, measured serum osmolality 238 mOsm/kg, potassium 3.8 mmol/L, and creatinine 0.9 mg/dL. No trauma, ongoing convulsion, hyperglycemia, or exogenous osmole is authored.' },
    { id: 'hyponatremia-boundary', type: 'narrative', target: 'severe-hyponatremia-with-seizure-boundary',
      atTick: 0, severity: 'warning', message: 'Treat the severe neurologic syndrome immediately rather than waiting for full volume or cause classification. Record injury protection, airway and breathing support, monitoring, access, glucose review, and critical-care plus endocrine or renal help in parallel; record local-protocol intermittent hypertonic-saline bolus intent in a close-monitoring environment; then review the fixed first-hour neurologic and sodium panel. After a 5 mmol/L rise with improvement, stop hypertonic saline, set a maximum 10 mmol/L total rise in the first 24 hours and 8 mmol/L per 24 hours thereafter, monitor sodium and urine output, stop contributors, investigate cause, and retain a specialist overcorrection plan. Examination, specimen collection, fluid or dose selection, delivery, sodium kinetics, seizure treatment, airway procedures, cause adjudication, relowering treatment, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'hyponatremia-recognition', objectiveId: 'recognize-severe-symptomatic-hyponatremia', question: 'Which neurologic, sodium, glucose, and osmolality findings made this a symptom-led emergency?' },
    { id: 'hyponatremia-stabilization', objectiveId: 'stabilize-severe-hyponatremia', question: 'Which immediate support and escalation steps belonged in parallel rather than before or after one another?' },
    { id: 'hyponatremia-hypertonic', objectiveId: 'record-hypertonic-saline-intent', question: 'Why did hypertonic-saline intent begin before the exact cause was settled?' },
    { id: 'hyponatremia-reassessment', objectiveId: 'reassess-early-sodium-and-neurologic-response', question: 'Why did a 5 mmol/L first-hour rise trigger a stop rather than a push toward normal sodium?' },
    { id: 'hyponatremia-overcorrection', objectiveId: 'prevent-hyponatremia-overcorrection', question: 'Which ceilings, serial checks, urine signal, cause steps, and rescue boundary protected the next 24 hours?' },
  ] },
};

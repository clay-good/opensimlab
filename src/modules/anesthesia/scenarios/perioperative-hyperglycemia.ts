/** Perioperative hyperglycemia: confirm, respond with a bounded protocol intent, and recheck. */

import type { Scenario } from './types';

export const PERIOPERATIVE_HYPERGLYCEMIA: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'perioperative-hyperglycemia', version: '0.1.0', maturity: 'preview',
    title: 'Perioperative hyperglycemia', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'introductory',
    objectives: [
      {
        id: 'confirm-perioperative-hyperglycemia',
        statement: 'Confirm the elevated glucose with a point-of-care measurement rather than relying on an unverified cue.',
        measure: 'The fixed point-of-care glucose was deliberately confirmed after the cue appeared.',
      },
      {
        id: 'use-bounded-insulin-protocol',
        statement: 'Record an institutional insulin-protocol response without inventing an individualized dose.',
        measure: 'Insulin-protocol intent was recorded after point-of-care confirmation.',
      },
      {
        id: 'reassess-perioperative-glucose',
        statement: 'Repeat the point-of-care glucose after the declared interval and interpret it against the perioperative target.',
        measure: 'The fixed 30-minute repeat glucose was obtained and fell within 100–180 mg/dL.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'American Diabetes Association Professional Practice Committee. Diabetes Care in the Hospital: Standards of Care in Diabetes—2026. Diabetes Care. 2026;49(Suppl 1):S339-S355.',
        'Korytkowski MT, et al. Management of Hyperglycemia in Hospitalized Adult Patients in Non-Critical Care Settings: An Endocrine Society Clinical Practice Guideline. J Clin Endocrinol Metab. 2022;107:2101-2128. PMID 35709363.',
      ],
    },
    limitations: [
      'perioperative-glucose-results-are-fixed-teaching-values',
      'insulin-action-is-intent-without-dose-or-delivery',
      'no-hyperglycemic-crisis-electrolyte-or-nutrition-model',
    ],
  },
  patient: {
    ageYears: 58, sex: 'male', heightCm: 178, weightKg: 88, asaClass: 3,
    diagnosis: 'Symptomatic cholelithiasis', procedure: 'Laparoscopic cholecystectomy',
    comorbidities: ['Type 2 diabetes mellitus', 'Controlled hypertension'],
    medications: ['Metformin', 'Lisinopril'], allergies: ['None known'],
    fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 72, meanArterialMmHg: 92, strokeVolumeMl: 70,
      hemoglobinGPerDl: 14.1, bloodVolumeMl: 5100, coreTemperatureC: 36.8,
      arterialStiffness: 1.15, baroreflexGain: 0.85, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Tracheal tube secured; bilateral ventilation and continuous capnography confirmed',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    airwayDevice: 'tracheal-tube',
    ventilator: {
      mode: 'volume-control', fio2: 0.4, tidalVolumeMl: 480, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 2, sevofluranePercent: 1.2, delivering: true,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'glycemic-briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'During an otherwise stable operation, an elevated glucose cue appears. Confirm it, record the bounded institutional response, and recheck. Sampling, insulin dose selection, delivery, nutrition, electrolytes, ketones, and hypoglycemia rescue are not simulated.',
    },
    {
      id: 'perioperative-glucose-course', type: 'perioperative-hyperglycemia', atTick: 100,
      value: 238, severity: 'warning',
      message: 'The glucose cue is above the perioperative target while ventilation and circulation remain stable. Confirm the point-of-care value before responding.',
    },
    {
      id: 'glycemic-reassessment', type: 'narrative', atTick: 18_100, severity: 'advisory',
      message: 'Thirty simulated minutes have elapsed after the earliest possible protocol response. Obtain the bounded repeat point-of-care glucose and interpret it against the declared target.',
    },
  ],
  debrief: { rubric: [
    { id: 'glycemic-confirmation', objectiveId: 'confirm-perioperative-hyperglycemia', question: 'Why did the elevated cue require point-of-care confirmation?', concept: 'depth-monitoring-and-its-limits' },
    { id: 'glycemic-response', objectiveId: 'use-bounded-insulin-protocol', question: 'How did you respond without turning a teaching vignette into an individualized insulin order?', concept: 'vasodilation-versus-hypovolemia' },
    { id: 'glycemic-reassessment', objectiveId: 'reassess-perioperative-glucose', question: 'What did the repeat value establish, and what remained outside the model?', concept: 'depth-monitoring-and-its-limits' },
  ] },
};

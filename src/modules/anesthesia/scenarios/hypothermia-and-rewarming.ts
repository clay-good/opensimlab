/** Intraoperative inadvertent hypothermia: observe, warm, and reassess. */

import type { Scenario } from './types';

export const HYPOTHERMIA_AND_REWARMING: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'hypothermia-and-rewarming', version: '0.1.0', maturity: 'preview',
    title: 'Hypothermia and rewarming', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'introductory',
    objectives: [
      {
        id: 'recognize-perioperative-hypothermia',
        statement: 'Recognize a falling core-temperature trend before treating one displayed value as an isolated number.',
        measure: 'Core temperature was deliberately confirmed after the fixed cooling course began.',
      },
      {
        id: 'start-active-surface-warming',
        statement: 'Restore active surface warming after the modeled interruption.',
        measure: 'Active surface warming was recorded after core temperature confirmation.',
      },
      {
        id: 'warm-bulk-perioperative-fluids',
        statement: 'Include the fixed remaining 700 mL crystalloid exposure in the thermal plan.',
        measure: 'Bulk-fluid warming intent was recorded after core temperature confirmation.',
      },
      {
        id: 'reassess-perioperative-rewarming',
        statement: 'Follow core temperature through rewarming rather than treating the warming action as the endpoint.',
        measure: 'Core temperature subsequently reached at least 36.5°C in the bounded teaching trajectory.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'National Institute for Health and Care Excellence. Hypothermia: prevention and management in adults having surgery. Clinical guideline CG65. Recommendations, amended 2016.',
        'Sessler DI. Perioperative thermoregulation and heat balance. Lancet. 2016;387:2655-2664. PMID 26775126.',
      ],
    },
    limitations: [
      'perioperative-temperature-course-is-a-fixed-teaching-target',
      'warming-actions-have-no-device-or-heat-transfer-model',
      'no-hypothermia-complications-comfort-or-disposition',
    ],
  },
  patient: {
    ageYears: 62, sex: 'female', heightCm: 164, weightKg: 70, asaClass: 2,
    diagnosis: 'Right colon adenocarcinoma', procedure: 'Open right hemicolectomy',
    comorbidities: ['Controlled hypertension'], medications: ['Losartan'],
    allergies: ['None known'], fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 68, meanArterialMmHg: 90, strokeVolumeMl: 66,
      hemoglobinGPerDl: 12.6, bloodVolumeMl: 4600, coreTemperatureC: 36.7,
      arterialStiffness: 1.15, baroreflexGain: 0.85, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.12, difficultMaskVentilation: false,
      assessment: 'Tracheal tube secured; bilateral ventilation and continuous capnography confirmed',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    airwayDevice: 'tracheal-tube',
    ventilator: {
      mode: 'volume-control', fio2: 0.45, tidalVolumeMl: 450, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 2, sevofluranePercent: 1.2, delivering: true,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'thermal-briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'During a stable open abdominal operation, the active surface-warming system was interrupted during repositioning. A fixed 700 mL crystalloid exposure remains. The core-temperature channel is available; device setup, probe technique, fluid delivery, and heat transfer are not simulated.',
    },
    {
      id: 'perioperative-cooling-course', type: 'perioperative-hypothermia', atTick: 100,
      value: 35.5, severity: 'warning',
      message: 'Core temperature is trending downward while ventilation and circulation remain stable. Confirm the measured pattern, restore the thermal plan, and keep watching the response.',
    },
    {
      id: 'thermal-reassessment', type: 'narrative', atTick: 7200, severity: 'advisory',
      message: 'Reassess the core-temperature trend. This bounded trace does not predict individual timing, complications, comfort, shivering, or transfer readiness.',
    },
  ],
  debrief: { rubric: [
    { id: 'thermal-recognition', objectiveId: 'recognize-perioperative-hypothermia', question: 'What made the temperature a trend requiring confirmation rather than a single number to dismiss?', concept: 'depth-monitoring-and-its-limits' },
    { id: 'thermal-surface', objectiveId: 'start-active-surface-warming', question: 'How did you separate restoring active warming from assuming a particular device setting or heating rate?', concept: 'vasodilation-versus-hypovolemia' },
    { id: 'thermal-fluids', objectiveId: 'warm-bulk-perioperative-fluids', question: 'Why did the fixed remaining fluid exposure belong in the thermal plan?', concept: 'vasodilation-versus-hypovolemia' },
    { id: 'thermal-reassessment', objectiveId: 'reassess-perioperative-rewarming', question: 'Which temperature trend showed response, and what could this teaching trajectory not predict?', concept: 'depth-monitoring-and-its-limits' },
  ] },
};

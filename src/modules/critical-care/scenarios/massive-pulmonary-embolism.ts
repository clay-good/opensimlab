/** Bounded Category E2R pulmonary-embolism rescue-bridge response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const MASSIVE_PULMONARY_EMBOLISM: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'massive-pulmonary-embolism', version: '0.1.0', maturity: 'draft',
    title: 'Massive pulmonary embolism', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'advanced', objectives: [
      { id: 'recognize-refractory-pe-shock', statement: 'Recognize refractory PE shock and activate PERT plus ECMO-capable rescue.', measure: 'The fixed Category E2R trajectory prompted immediate multidisciplinary rescue escalation.' },
      { id: 'review-refractory-pe-pattern', statement: 'Integrate fixed PE, RV, ventilation, perfusion, and alternate-cause findings without delaying rescue for repeated diagnosis.', measure: 'The panel supported acute obstructive RV failure while keeping bleeding and coexisting causes visible.' },
      { id: 'record-refractory-pe-support', statement: 'Record RV-sensitive perfusion, oxygenation, ventilation, rhythm, and anticoagulation review without blind fluid loading.', measure: 'Support intent protected the failing RV and remained individualized and delivery-free.' },
      { id: 'activate-pe-ecmo-bridge', statement: 'Activate resource-dependent VA-ECMO candidacy and cannulation pathways as a bridge for Category E2 refractory shock.', measure: 'The bridge was treated as specialized temporary support, not clot treatment or a universal device rule.' },
      { id: 'reassess-pe-ecmo-trajectory', statement: 'Reassess perfusion and oxygenation after the authored bridge while individualizing any additional reperfusion strategy.', measure: 'The fixed response improved without claiming thrombus resolution, proven adjunctive benefit, or outcome.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Creager MA, Barnes GD, Giri J, et al. 2026 Guideline for the Evaluation and Management of Acute Pulmonary Embolism in Adults. Circulation. 2026;153:e977-e1051.',
        'Lorusso R, Shekar K, MacLaren G, et al. ELSO Interim Guidelines for Venoarterial Extracorporeal Membrane Oxygenation in Adult Cardiac Patients. ASAIO J. 2021;67:827-844.',
        'Monnet X, Messina A, Greco M, et al. ESICM guidelines on circulatory shock and hemodynamic monitoring 2025. Intensive Care Med. 2025;51:1971-2012.',
      ] },
    limitations: ['massive-pulmonary-embolism-findings-support-and-response-are-authored',
      'massive-pulmonary-embolism-ecmo-and-reperfusion-actions-are-proxies',
      'no-live-massive-pulmonary-embolism-diagnosis-prescribing-device-or-outcome'],
  },
  patient: { ageYears: 57, sex: 'male', heightCm: 178, weightKg: 94, asaClass: 5,
    diagnosis: 'Confirmed acute pulmonary embolism with Category E2R cardiopulmonary failure',
    procedure: 'Refractory pulmonary embolism rescue',
    comorbidities: ['Obesity', 'Recent hospitalization for viral pneumonia'],
    medications: ['Parenteral anticoagulation and vasoactive support reported; delivery not modeled'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; enteral-nutrition state not represented',
    baseline: { heartRateBpm: 132, meanArterialMmHg: 50, strokeVolumeMl: 24,
      hemoglobinGPerDl: 11.9, bloodVolumeMl: 5100, coreTemperatureC: 37.6,
      arterialStiffness: 1.05, baroreflexGain: 0.6, fixedStrokeVolume: false },
    airway: { difficulty: 0.3, difficultMaskVentilation: false,
      assessment: 'Intubated with reported continuous capnography and bilateral ventilation' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'volume-control', fio2: 1,
      tidalVolumeMl: 460, respiratoryRateBpm: 26, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'massive-pe-presentation', type: 'narrative', target: 'massive-pulmonary-embolism',
      atTick: 0, severity: 'critical', message: 'A 57-year-old intubated man has an imaging-confirmed saddle pulmonary embolism despite reported parenteral anticoagulation. Hypotension persists despite 3 reported vasoactive infusions: MAP 50 mmHg, HR 132/min in sinus rhythm, capillary refill 6 seconds, mottled cool extremities, no command following, urine output 5 mL/h, and lactate rising from 5.2 to 8.1 mmol/L. SpO₂ is 82% on FiO₂ 1.0 with continuous capnography and reported bilateral ventilation. No rescue bridge has been recorded.' },
    { id: 'massive-pe-boundary', type: 'narrative', target: 'massive-pulmonary-embolism-boundary',
      atTick: 0, severity: 'warning', message: 'Fixed CT reports acute central pulmonary emboli. Fixed echocardiography reports severe RV dilation and hypokinesis, septal flattening, a small LV, and no effusion; no tension-pneumothorax or active external bleeding pattern is reported. Refractory cardiogenic shock plus ventilatory failure supports AHA/ACC acute-PE Category E2R. Activate PERT, shock, resuscitation, perfusion, and ECMO-capable teams now. Record RV-sensitive systemic-perfusion, oxygenation, ventilation, rhythm, and anticoagulation review without blind fluid loading. Activate resource- and candidacy-dependent VA-ECMO as a stabilization bridge, not thrombus treatment. After the fixed bridge response, individualize whether any additional advanced reperfusion is warranted because its usefulness on VA-ECMO is not established. Examination, monitoring, CT, echo, laboratory or hemodynamic acquisition or interpretation, diagnosis, oxygen, ventilation, anticoagulation, fluid or drug delivery, access, dosing, CPR, cannulation, ECMO, thrombectomy, thrombolysis, embolectomy, transfer, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'massive-pe-recognition', objectiveId: 'recognize-refractory-pe-shock', question: 'Which refractory shock and respiratory findings made this Category E2R?' },
    { id: 'massive-pe-pattern', objectiveId: 'review-refractory-pe-pattern', question: 'How did PE, RV, ventilation, perfusion, and alternate-cause findings shape rescue?' },
    { id: 'massive-pe-support', objectiveId: 'record-refractory-pe-support', question: 'Which RV-sensitive support guardrails mattered before and during rescue?' },
    { id: 'massive-pe-ecmo', objectiveId: 'activate-pe-ecmo-bridge', question: 'Why was VA-ECMO a resource-dependent bridge rather than clot treatment?' },
    { id: 'massive-pe-response', objectiveId: 'reassess-pe-ecmo-trajectory', question: 'What improved after the authored bridge, and why did adjunctive reperfusion remain individualized?' },
  ] },
};

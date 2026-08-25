/** Bounded adult acute-ischemic-stroke reperfusion pathway. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ACUTE_ISCHEMIC_STROKE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'acute-ischemic-stroke', version: '0.1.0', maturity: 'draft',
    title: 'Acute ischemic stroke', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'intermediate', objectives: [
      { id: 'recognize-and-activate-acute-stroke', statement: 'Recognize a disabling acute stroke pattern, establish last-known-well time, check glucose, and activate the stroke system.', measure: 'The fixed deficit, 70-minute clock, glucose, pressure, and immediate stroke activation were reviewed in order.' },
      { id: 'review-stroke-imaging-and-eligibility', statement: 'Review the authored noncontrast CT, CTA, blood pressure, and thrombolysis eligibility findings.', measure: 'No hemorrhage, a left M1 occlusion, BP 168/94 mmHg, and the absence of an authored contraindication were integrated.' },
      { id: 'record-stroke-thrombolysis-intent', statement: 'Record the fixed local-protocol tenecteplase intent without delaying eligible reperfusion.', measure: 'The single 20 mg IV tenecteplase intent followed eligibility review.' },
      { id: 'activate-stroke-thrombectomy-pathway', statement: 'Activate the endovascular pathway for the authored large-vessel occlusion without waiting for thrombolysis response.', measure: 'Thrombectomy transfer activation followed thrombolysis intent without a simulated wait.' },
      { id: 'reassess-and-handoff-acute-stroke', statement: 'Record focused post-treatment surveillance and a clock-explicit thrombectomy handoff.', measure: 'Neurologic, pressure, airway, bleeding, and transfer surveillance closed the bounded pathway.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026. doi:10.1161/STR.0000000000000513.',
        'Powers WJ, et al. Guidelines for the Early Management of Patients With Acute Ischemic Stroke: 2019 Update. Stroke. 2019;50:e344-e418. doi:10.1161/STR.0000000000000211.',
      ],
    },
    limitations: ['acute-ischemic-stroke-findings-and-eligibility-are-authored',
      'acute-ischemic-stroke-controls-are-screen-proxies',
      'no-live-stroke-score-imaging-drug-procedure-reperfusion-complication-or-outcome'],
  },
  patient: {
    ageYears: 68, sex: 'female', heightCm: 166, weightKg: 80, asaClass: 4,
    diagnosis: 'Disabling acute ischemic stroke with left M1 large-vessel occlusion',
    procedure: 'Emergency reperfusion decision and thrombectomy transfer activation',
    comorbidities: ['Hypertension'], medications: ['Amlodipine'],
    allergies: ['No known drug allergies'], fasting: 'Not established in the emergency department',
    baseline: { heartRateBpm: 82, meanArterialMmHg: 119, strokeVolumeMl: 66,
      hemoglobinGPerDl: 13.4, bloodVolumeMl: 5000, coreTemperatureC: 36.9,
      arterialStiffness: 1.2, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Protecting the airway with spontaneous breathing; dysarthria is present' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 480,
      respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'acute-stroke-presentation', type: 'narrative', target: 'acute-ischemic-stroke',
      atTick: 0, severity: 'critical',
      message: 'Sudden aphasia, right facial weakness, and right arm weakness began during a witnessed breakfast. Last known well was 70 minutes ago. The deficits are disabling. Glucose is 112 mg/dL, BP is 168/94 mmHg, and the patient is protecting her airway.' },
    { id: 'acute-stroke-boundary', type: 'narrative', target: 'acute-ischemic-stroke-boundary',
      atTick: 0, severity: 'warning',
      message: 'The authored noncontrast CT shows no hemorrhage and CTA shows a left M1 occlusion. No contraindication is authored. Review and activate the stroke pathway, record the fixed local-protocol tenecteplase 20 mg IV intent, activate thrombectomy transfer without waiting for response, then reassess and hand off. Examination, scoring, image interpretation, eligibility adjudication, drug delivery, thrombectomy, reperfusion, complications, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'stroke-recognition', objectiveId: 'recognize-and-activate-acute-stroke', question: 'Which deficit, clock, glucose, pressure, and airway findings made this an immediate stroke-system activation?' },
    { id: 'stroke-imaging', objectiveId: 'review-stroke-imaging-and-eligibility', question: 'What did the authored CT, CTA, pressure, and contraindication screen establish?' },
    { id: 'stroke-thrombolysis', objectiveId: 'record-stroke-thrombolysis-intent', question: 'Why was the fixed 20 mg tenecteplase intent available without advanced perfusion imaging?' },
    { id: 'stroke-thrombectomy', objectiveId: 'activate-stroke-thrombectomy-pathway', question: 'Why did the endovascular pathway proceed without waiting for thrombolysis response?' },
    { id: 'stroke-handoff', objectiveId: 'reassess-and-handoff-acute-stroke', question: 'Which surveillance findings and clocks belong in the thrombectomy handoff?' },
  ] },
};

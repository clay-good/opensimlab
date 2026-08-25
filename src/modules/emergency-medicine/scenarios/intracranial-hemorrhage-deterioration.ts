/** Bounded adult anticoagulant-associated intracerebral-hemorrhage deterioration pathway. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const INTRACRANIAL_HEMORRHAGE_DETERIORATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'intracranial-hemorrhage-deterioration', version: '0.1.0', maturity: 'draft',
    title: 'Intracranial hemorrhage deterioration', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 9, difficulty: 'advanced', objectives: [
      { id: 'recognize-and-stabilize-deteriorating-ich', statement: 'Recognize neurologic deterioration, reassess airway, breathing, circulation, and glucose, and activate the hemorrhage pathway.', measure: 'The fixed serial change and immediate support needs led to pathway activation.' },
      { id: 'review-ich-imaging-and-coagulopathy', statement: 'Review the authored hemorrhage, intraventricular extension, hydrocephalus, warfarin exposure, and INR.', measure: 'The fixed CT and coagulopathy findings were integrated after activation.' },
      { id: 'record-urgent-warfarin-reversal-intent', statement: 'Stop warfarin and record urgent 4-factor PCC plus IV vitamin K reversal intent.', measure: 'The agent-specific reversal bundle followed confirmation without waiting for another test.' },
      { id: 'record-smooth-ich-pressure-control', statement: 'Record smooth, sustained systolic pressure control toward 140 mmHg while avoiding less than 130 mmHg.', measure: 'The bounded pressure strategy followed stabilization and recognized the patient-specific boundary.' },
      { id: 'escalate-and-handoff-deteriorating-ich', statement: 'Activate neurocritical and neurosurgical transfer for hydrocephalus evaluation and hand off serial findings.', measure: 'Urgent escalation and clock-explicit reassessment closed the bounded pathway.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53:e282-e361. doi:10.1161/STR.0000000000000407.',
      ],
    },
    limitations: ['ich-findings-deterioration-and-response-are-authored',
      'ich-reversal-pressure-and-transfer-controls-are-screen-proxies',
      'no-live-ich-exam-imaging-drug-airway-procedure-expansion-or-outcome'],
  },
  patient: {
    ageYears: 72, sex: 'male', heightCm: 178, weightKg: 84, asaClass: 4,
    diagnosis: 'Warfarin-associated right thalamic intracerebral hemorrhage with intraventricular extension and early hydrocephalus',
    procedure: 'Emergency stabilization, reversal intent, pressure control, and neurosurgical transfer',
    comorbidities: ['Atrial fibrillation', 'Hypertension'],
    medications: ['Warfarin', 'Lisinopril'], allergies: ['No known drug allergies'],
    fasting: 'Not established in the emergency department',
    baseline: { heartRateBpm: 78, meanArterialMmHg: 142, strokeVolumeMl: 64,
      hemoglobinGPerDl: 13.7, bloodVolumeMl: 5200, coreTemperatureC: 37.0,
      arterialStiffness: 1.3, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Increasing somnolence; currently handling secretions with spontaneous breathing' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'ich-deterioration-presentation', type: 'narrative',
      target: 'intracranial-hemorrhage-deterioration', atTick: 0, severity: 'critical',
      message: 'A 72-year-old taking warfarin developed sudden headache, vomiting, dysarthria, and left weakness 55 minutes ago. During the last 15 minutes, eye opening and coherent speech have decreased. BP is 202/112 mmHg, glucose is 126 mg/dL, oxygen saturation is 96% on room air, and he is currently handling secretions with spontaneous breathing.' },
    { id: 'ich-deterioration-boundary', type: 'narrative',
      target: 'intracranial-hemorrhage-deterioration-boundary', atTick: 0, severity: 'critical',
      message: 'Authored CT shows a 28 mL right thalamic intracerebral hemorrhage with intraventricular extension and early hydrocephalus; no herniation is authored. INR is 3.2 after the last warfarin dose yesterday evening. Activate the hemorrhage pathway, stop warfarin, record urgent 4-factor PCC plus IV vitamin K intent, record smooth systolic pressure control toward 140 mmHg while avoiding less than 130 mmHg, and activate neurocritical and neurosurgical transfer. Examination, scoring, imaging interpretation, dose selection, drug delivery, airway procedures, drainage, evacuation, expansion, complications, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'ich-recognition', objectiveId: 'recognize-and-stabilize-deteriorating-ich', question: 'Which serial neurologic, airway, breathing, pressure, and glucose findings made this deterioration urgent?' },
    { id: 'ich-findings', objectiveId: 'review-ich-imaging-and-coagulopathy', question: 'What did the authored CT, medication history, timing, and INR establish?' },
    { id: 'ich-reversal', objectiveId: 'record-urgent-warfarin-reversal-intent', question: 'Why did the fixed reversal bundle proceed without waiting for another test?' },
    { id: 'ich-pressure', objectiveId: 'record-smooth-ich-pressure-control', question: 'Why did the pressure plan favor smooth control and avoid overshoot?' },
    { id: 'ich-escalation', objectiveId: 'escalate-and-handoff-deteriorating-ich', question: 'Which hydrocephalus, deterioration, airway, and treatment clocks belonged in the urgent handoff?' },
  ] },
};
